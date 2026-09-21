
-- BC-6.6 — Outcome Event Consumer: dispatch receipts + claim/finalize/replay RPCs.

-- 1. Dispatch receipts (per outbox event, per adapter).
CREATE TABLE IF NOT EXISTS public.outcome_event_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_event_id uuid NOT NULL REFERENCES public.graph_outbox_events(id) ON DELETE CASCADE,
  adapter_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','delivered','retry_scheduled','dead_lettered')),
  attempt_count integer NOT NULL DEFAULT 0,
  last_error_code text,
  next_attempt_at timestamptz,
  delivered_at timestamptz,
  dead_lettered_at timestamptz,
  processing_started_at timestamptz,
  processing_owner text,
  lease_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (outbox_event_id, adapter_name)
);

CREATE INDEX IF NOT EXISTS idx_oed_pending
  ON public.outcome_event_dispatches (adapter_name, next_attempt_at)
  WHERE status IN ('pending','retry_scheduled');

CREATE INDEX IF NOT EXISTS idx_oed_dead
  ON public.outcome_event_dispatches (adapter_name, dead_lettered_at)
  WHERE status = 'dead_lettered';

-- No public/authenticated access. Service role only.
REVOKE ALL ON public.outcome_event_dispatches FROM PUBLIC;
REVOKE ALL ON public.outcome_event_dispatches FROM anon;
REVOKE ALL ON public.outcome_event_dispatches FROM authenticated;
GRANT ALL ON public.outcome_event_dispatches TO service_role;
ALTER TABLE public.outcome_event_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcome_event_dispatches FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.outcome_event_dispatches_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_oed_touch ON public.outcome_event_dispatches;
CREATE TRIGGER trg_oed_touch BEFORE UPDATE ON public.outcome_event_dispatches
  FOR EACH ROW EXECUTE FUNCTION public.outcome_event_dispatches_touch();

-- 2. Frozen event allowlist helper.
CREATE OR REPLACE FUNCTION public.outcome_event_is_supported(_kind text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT _kind IN (
    'introduction_outcome_created',
    'introduction_outcome_connected',
    'introduction_outcome_progressed',
    'introduction_outcome_no_outcome',
    'introduction_outcome_expired'
  );
$$;

-- 3. Bounded claim: pull pending outcome outbox rows with SKIP LOCKED and bump attempt_count.
CREATE OR REPLACE FUNCTION public.outcome_consumer_claim_batch(_batch integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  event_kind text,
  aggregate_type text,
  aggregate_id uuid,
  payload jsonb,
  idempotency_key text,
  occurred_at timestamptz,
  attempt_count integer,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n integer := GREATEST(1, LEAST(COALESCE(_batch,100), 500));
BEGIN
  RETURN QUERY
  WITH cte AS (
    SELECT o.id
    FROM public.graph_outbox_events o
    WHERE o.aggregate_type = 'introduction_outcome'
      AND o.processed_at IS NULL
      AND o.available_at <= now()
      AND public.outcome_event_is_supported(o.event_kind)
    ORDER BY o.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT n
  ),
  upd AS (
    UPDATE public.graph_outbox_events o
       SET attempt_count = o.attempt_count + 1,
           available_at  = now() + interval '5 minutes' -- soft lease; finalize clears
      FROM cte
     WHERE o.id = cte.id
     RETURNING o.*
  )
  SELECT u.id, u.event_kind, u.aggregate_type, u.aggregate_id, u.payload,
         u.idempotency_key, u.occurred_at, u.attempt_count, u.created_at
    FROM upd u
   ORDER BY u.created_at ASC;
END; $$;

REVOKE ALL ON FUNCTION public.outcome_consumer_claim_batch(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.outcome_consumer_claim_batch(integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.outcome_consumer_claim_batch(integer) TO service_role;

-- 4. Aggregate order guard: return true if an older unprocessed outbox row exists for the same aggregate.
CREATE OR REPLACE FUNCTION public.outcome_consumer_has_earlier_pending(_outbox_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1
      FROM public.graph_outbox_events o
      JOIN public.graph_outbox_events me ON me.id = _outbox_id
     WHERE o.aggregate_type = me.aggregate_type
       AND o.aggregate_id   = me.aggregate_id
       AND o.processed_at IS NULL
       AND o.created_at < me.created_at
  );
$$;
REVOKE ALL ON FUNCTION public.outcome_consumer_has_earlier_pending(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.outcome_consumer_has_earlier_pending(uuid) TO service_role;

-- 5. Upsert dispatch receipt.
CREATE OR REPLACE FUNCTION public.outcome_dispatch_record(
  _outbox_event_id uuid,
  _adapter_name text,
  _status text,
  _error_code text DEFAULT NULL,
  _next_attempt_at timestamptz DEFAULT NULL
) RETURNS public.outcome_event_dispatches
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  row public.outcome_event_dispatches;
BEGIN
  IF _status NOT IN ('pending','processing','delivered','retry_scheduled','dead_lettered') THEN
    RAISE EXCEPTION 'invalid dispatch status: %', _status;
  END IF;

  INSERT INTO public.outcome_event_dispatches AS d
    (outbox_event_id, adapter_name, status, attempt_count, last_error_code,
     next_attempt_at, delivered_at, dead_lettered_at)
  VALUES (_outbox_event_id, _adapter_name, _status,
          CASE WHEN _status IN ('delivered','retry_scheduled','dead_lettered') THEN 1 ELSE 0 END,
          _error_code, _next_attempt_at,
          CASE WHEN _status='delivered' THEN now() END,
          CASE WHEN _status='dead_lettered' THEN now() END)
  ON CONFLICT (outbox_event_id, adapter_name) DO UPDATE
     SET status          = EXCLUDED.status,
         attempt_count   = d.attempt_count + 1,
         last_error_code = EXCLUDED.last_error_code,
         next_attempt_at = EXCLUDED.next_attempt_at,
         delivered_at    = COALESCE(d.delivered_at, EXCLUDED.delivered_at),
         dead_lettered_at= COALESCE(d.dead_lettered_at, EXCLUDED.dead_lettered_at)
  RETURNING * INTO row;

  RETURN row;
END; $$;
REVOKE ALL ON FUNCTION public.outcome_dispatch_record(uuid, text, text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.outcome_dispatch_record(uuid, text, text, text, timestamptz) TO service_role;

-- 6. Finalize: mark outbox row processed_at when all *required* adapters are terminal.
CREATE OR REPLACE FUNCTION public.outcome_consumer_finalize(
  _outbox_event_id uuid,
  _required_adapters text[]
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pending_required int;
BEGIN
  SELECT count(*) INTO pending_required
    FROM unnest(_required_adapters) a(name)
    LEFT JOIN public.outcome_event_dispatches d
      ON d.outbox_event_id = _outbox_event_id AND d.adapter_name = a.name
   WHERE d.status IS NULL OR d.status NOT IN ('delivered','dead_lettered');

  IF pending_required = 0 THEN
    UPDATE public.graph_outbox_events
       SET processed_at = now()
     WHERE id = _outbox_event_id
       AND processed_at IS NULL;
    RETURN true;
  END IF;
  RETURN false;
END; $$;
REVOKE ALL ON FUNCTION public.outcome_consumer_finalize(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.outcome_consumer_finalize(uuid, text[]) TO service_role;

-- 7. Release: on failure, reset outbox available_at based on min next_attempt of undelivered required adapters.
CREATE OR REPLACE FUNCTION public.outcome_consumer_release(
  _outbox_event_id uuid,
  _next_available_at timestamptz
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.graph_outbox_events
     SET available_at = LEAST(available_at, _next_available_at)
   WHERE id = _outbox_event_id AND processed_at IS NULL;
$$;
REVOKE ALL ON FUNCTION public.outcome_consumer_release(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.outcome_consumer_release(uuid, timestamptz) TO service_role;

-- 8. Replay one dispatch (admin/service only).
CREATE OR REPLACE FUNCTION public.outcome_consumer_replay(
  _outbox_event_id uuid,
  _adapter_name text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.outcome_event_dispatches
     SET status = 'pending',
         next_attempt_at = now(),
         dead_lettered_at = NULL,
         last_error_code = NULL
   WHERE outbox_event_id = _outbox_event_id
     AND (_adapter_name IS NULL OR adapter_name = _adapter_name);
  GET DIAGNOSTICS n = ROW_COUNT;

  UPDATE public.graph_outbox_events
     SET processed_at = NULL, available_at = now()
   WHERE id = _outbox_event_id;

  RETURN n;
END; $$;
REVOKE ALL ON FUNCTION public.outcome_consumer_replay(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.outcome_consumer_replay(uuid, text) TO service_role;

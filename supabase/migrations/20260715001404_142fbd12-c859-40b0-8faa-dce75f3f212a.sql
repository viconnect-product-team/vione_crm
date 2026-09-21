
-- BC-6.5 — Outcome lifecycle wiring & scheduler

-- 1. Helpful composite index for pair-based observation lookups.
CREATE INDEX IF NOT EXISTS idx_io_pair_pending
  ON public.introduction_outcomes(requester_user_id, target_user_id, status)
  WHERE status = 'pending';

-- 2. Outbox emission helper for outcome transitions (exactly-once via dedupe key).
CREATE OR REPLACE FUNCTION public.intro_outcome_emit_event(
  _outcome public.introduction_outcomes,
  _event_kind text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ikey text;
  payload jsonb;
BEGIN
  ikey := 'io:' || _outcome.id::text || ':' || _event_kind || ':' || COALESCE(_outcome.status,'none') || ':' || COALESCE(_outcome.outcome_type,'none');
  payload := jsonb_build_object(
    'outcomeId', _outcome.id,
    'status', _outcome.status,
    'outcomeType', _outcome.outcome_type,
    'outcomeSource', _outcome.outcome_source,
    'occurredAt', now()
  );
  PERFORM public.graph_emit_outbox_event(
    _event_kind, 'introduction_outcome', _outcome.id, payload, ikey
  );
EXCEPTION WHEN OTHERS THEN
  -- Never let telemetry break business writes.
  NULL;
END; $$;
REVOKE ALL ON FUNCTION public.intro_outcome_emit_event(public.introduction_outcomes, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_outcome_emit_event(public.introduction_outcomes, text) TO service_role;

-- 3. AFTER INSERT/UPDATE trigger on outcomes → outbox events per logical transition.
CREATE OR REPLACE FUNCTION public.introduction_outcomes_emit_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.intro_outcome_emit_event(NEW, 'introduction_outcome_created');
    RETURN NEW;
  END IF;

  -- UPDATE: emit only on meaningful transitions.
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.outcome_type IS DISTINCT FROM OLD.outcome_type THEN
    IF NEW.outcome_type = 'connected' THEN
      PERFORM public.intro_outcome_emit_event(NEW, 'introduction_outcome_connected');
    ELSIF NEW.outcome_type = 'progressed' THEN
      PERFORM public.intro_outcome_emit_event(NEW, 'introduction_outcome_progressed');
    ELSIF NEW.outcome_type = 'not_connected' THEN
      PERFORM public.intro_outcome_emit_event(NEW, 'introduction_outcome_no_outcome');
    ELSIF NEW.status = 'expired' OR NEW.outcome_type = 'closed_no_outcome' THEN
      PERFORM public.intro_outcome_emit_event(NEW, 'introduction_outcome_expired');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_io_emit_events ON public.introduction_outcomes;
CREATE TRIGGER trg_io_emit_events
  AFTER INSERT OR UPDATE ON public.introduction_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.introduction_outcomes_emit_events();

-- 4. Wire delivery acknowledgment → outcome creation (failure-isolated).
CREATE OR REPLACE FUNCTION public.introduction_deliveries_wire_outcome()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.acknowledged_at IS NOT NULL
     AND (OLD.acknowledged_at IS NULL OR OLD.acknowledged_at IS DISTINCT FROM NEW.acknowledged_at) THEN
    BEGIN
      PERFORM public.intro_outcome_create_on_ack(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      -- Delivery ack must never be blocked by outcome-side failure.
      -- Reconciliation (intro_outcome_reconcile) will heal missed outcomes.
      NULL;
    END;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_id_wire_outcome ON public.introduction_deliveries;
CREATE TRIGGER trg_id_wire_outcome
  AFTER UPDATE ON public.introduction_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.introduction_deliveries_wire_outcome();

-- 5. Wire connection acceptance → outcome observation for eligible pending pairs.
CREATE OR REPLACE FUNCTION public.user_connections_wire_outcome_observation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  conn_at timestamptz;
BEGIN
  IF NEW.status <> 'accepted' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'accepted' THEN RETURN NEW; END IF;

  conn_at := COALESCE(NEW.responded_at, NEW.updated_at, now());
  BEGIN
    FOR r IN
      SELECT id FROM public.introduction_outcomes
       WHERE status = 'pending'
         AND (
           (requester_user_id = NEW.requester_user_id AND target_user_id = NEW.recipient_user_id)
           OR (requester_user_id = NEW.recipient_user_id AND target_user_id = NEW.requester_user_id)
         )
         AND COALESCE(acknowledged_at, created_at) <= conn_at
         AND expires_at > conn_at
       ORDER BY created_at ASC
       LIMIT 50
    LOOP
      BEGIN
        PERFORM public.intro_outcome_observe_connection(r.id);
      EXCEPTION WHEN OTHERS THEN
        NULL; -- isolate: one bad outcome must not break connection acceptance
      END;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_uc_wire_outcome ON public.user_connections;
CREATE TRIGGER trg_uc_wire_outcome
  AFTER INSERT OR UPDATE OF status ON public.user_connections
  FOR EACH ROW EXECUTE FUNCTION public.user_connections_wire_outcome_observation();

-- 6. Reconciliation: bounded safety net for missed wiring.
CREATE OR REPLACE FUNCTION public.intro_outcome_reconcile(
  p_limit integer DEFAULT 100
) RETURNS TABLE (created integer, observed integer, expired integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  lim integer := GREATEST(1, LEAST(p_limit, 500));
  c1 integer := 0; c2 integer := 0; c3 integer := 0;
  r record;
BEGIN
  -- A. Acknowledged deliveries missing an outcome.
  FOR r IN
    SELECT d.id FROM public.introduction_deliveries d
    LEFT JOIN public.introduction_outcomes o ON o.introduction_delivery_id = d.id
    WHERE d.acknowledged_at IS NOT NULL AND o.id IS NULL
    ORDER BY d.acknowledged_at DESC
    LIMIT lim
  LOOP
    BEGIN PERFORM public.intro_outcome_create_on_ack(r.id); c1 := c1 + 1;
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;

  -- B. Pending outcomes where a canonical connection now exists.
  FOR r IN
    SELECT o.id FROM public.introduction_outcomes o
    WHERE o.status = 'pending'
      AND EXISTS (
        SELECT 1 FROM public.user_connections uc
        WHERE uc.status = 'accepted'
          AND (
            (uc.requester_user_id = o.requester_user_id AND uc.recipient_user_id = o.target_user_id)
            OR (uc.requester_user_id = o.target_user_id AND uc.recipient_user_id = o.requester_user_id)
          )
          AND COALESCE(uc.responded_at, uc.updated_at) >= COALESCE(o.acknowledged_at, o.created_at)
      )
    ORDER BY o.created_at ASC
    LIMIT lim
  LOOP
    BEGIN PERFORM public.intro_outcome_observe_connection(r.id); c2 := c2 + 1;
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;

  -- C. Pending outcomes past expiry.
  c3 := public.intro_outcome_expire_sweep(lim);

  created := c1; observed := c2; expired := c3;
  RETURN NEXT;
END; $$;
REVOKE ALL ON FUNCTION public.intro_outcome_reconcile(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_outcome_reconcile(integer) TO service_role;

-- 7. Hourly sweep via pg_cron (idempotent registration).
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'intro_outcome_expire_sweep_hourly') THEN
    PERFORM cron.unschedule('intro_outcome_expire_sweep_hourly');
  END IF;
  PERFORM cron.schedule(
    'intro_outcome_expire_sweep_hourly',
    '0 * * * *',
    $cron$ SELECT public.intro_outcome_expire_sweep(200); $cron$
  );
END; $$;

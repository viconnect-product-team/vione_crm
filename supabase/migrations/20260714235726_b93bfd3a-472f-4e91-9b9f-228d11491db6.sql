-- BC-6.4 — Introduction Outcome domain schema
-- Tracks what happens after an introduction is delivered.

CREATE TABLE IF NOT EXISTS public.introduction_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  introduction_delivery_id uuid NOT NULL UNIQUE
    REFERENCES public.introduction_deliveries(id) ON DELETE CASCADE,
  introduction_request_id uuid NOT NULL
    REFERENCES public.introduction_requests(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL,
  requester_person_node_id uuid NOT NULL,
  intermediary_user_id uuid NOT NULL,
  intermediary_person_node_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  target_person_node_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','resolved','expired')),
  outcome_type text NULL
    CHECK (outcome_type IS NULL OR outcome_type IN
      ('connected','progressed','not_connected','closed_no_outcome')),
  outcome_source text NULL
    CHECK (outcome_source IS NULL OR outcome_source IN
      ('observed_connection','declared_requester','declared_intermediary',
       'window_expired','system_event')),
  outcome_note text NULL,
  acknowledged_at timestamptz NULL,
  connection_observed_at timestamptz NULL,
  progressed_at timestamptz NULL,
  resolved_at timestamptz NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT io_note_len CHECK (outcome_note IS NULL OR char_length(outcome_note) <= 500),
  CONSTRAINT io_resolved_shape CHECK (
    (status = 'pending' AND outcome_type IS NULL AND resolved_at IS NULL)
    OR (status IN ('resolved','expired') AND outcome_type IS NOT NULL AND resolved_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_io_requester ON public.introduction_outcomes(requester_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_io_intermediary ON public.introduction_outcomes(intermediary_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_io_target ON public.introduction_outcomes(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_io_pending_expiry ON public.introduction_outcomes(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_io_delivery ON public.introduction_outcomes(introduction_delivery_id);

GRANT SELECT ON public.introduction_outcomes TO authenticated;
GRANT ALL ON public.introduction_outcomes TO service_role;

ALTER TABLE public.introduction_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.introduction_outcomes FORCE ROW LEVEL SECURITY;

-- Reads: requester + intermediary always; target sees minimal state (enforced via DTO redaction).
CREATE POLICY io_select_participants ON public.introduction_outcomes
  FOR SELECT TO authenticated
  USING (
    auth.uid() = requester_user_id
    OR auth.uid() = intermediary_user_id
    OR auth.uid() = target_user_id
  );

-- No direct writes; all mutations go through SECURITY DEFINER RPCs.
CREATE POLICY io_no_direct_insert ON public.introduction_outcomes
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY io_no_direct_update ON public.introduction_outcomes
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY io_no_direct_delete ON public.introduction_outcomes
  FOR DELETE TO authenticated USING (false);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.introduction_outcomes_touch()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_io_touch BEFORE UPDATE ON public.introduction_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.introduction_outcomes_touch();

-- Terminal state immutability
CREATE OR REPLACE FUNCTION public.introduction_outcomes_enforce_terminal()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('resolved','expired') THEN
    RAISE EXCEPTION 'INTRO_OUTCOME_ALREADY_RESOLVED' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_io_terminal BEFORE UPDATE ON public.introduction_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.introduction_outcomes_enforce_terminal();

-- =====================================================================
-- RPCs (SECURITY DEFINER)
-- =====================================================================

-- Create outcome upon delivery acknowledgment. Idempotent.
CREATE OR REPLACE FUNCTION public.intro_outcome_create_on_ack(
  p_delivery_id uuid
) RETURNS public.introduction_outcomes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d public.introduction_deliveries;
  existing public.introduction_outcomes;
  ack_at timestamptz;
  out_row public.introduction_outcomes;
BEGIN
  SELECT * INTO d FROM public.introduction_deliveries
    WHERE id = p_delivery_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INTRO_OUTCOME_NOT_FOUND'; END IF;

  -- Only proceed when delivery is acknowledged.
  IF d.acknowledged_at IS NULL THEN
    RAISE EXCEPTION 'INTRO_OUTCOME_INVALID_TRANSITION';
  END IF;

  SELECT * INTO existing FROM public.introduction_outcomes
    WHERE introduction_delivery_id = p_delivery_id;
  IF FOUND THEN RETURN existing; END IF;

  ack_at := d.acknowledged_at;
  INSERT INTO public.introduction_outcomes(
    introduction_delivery_id, introduction_request_id,
    requester_user_id, requester_person_node_id,
    intermediary_user_id, intermediary_person_node_id,
    target_user_id, target_person_node_id,
    acknowledged_at, expires_at
  ) VALUES (
    d.id, d.introduction_request_id,
    d.requester_user_id, d.requester_person_node_id,
    d.intermediary_user_id, d.intermediary_person_node_id,
    d.target_user_id, d.target_person_node_id,
    ack_at, ack_at + interval '60 days'
  )
  RETURNING * INTO out_row;
  RETURN out_row;
END;
$$;

REVOKE ALL ON FUNCTION public.intro_outcome_create_on_ack(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_outcome_create_on_ack(uuid) TO service_role, authenticated;

-- Observe canonical connection between requester & target after delivery.
CREATE OR REPLACE FUNCTION public.intro_outcome_observe_connection(
  p_outcome_id uuid
) RETURNS public.introduction_outcomes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o public.introduction_outcomes;
  connected boolean;
  conn_at timestamptz;
BEGIN
  SELECT * INTO o FROM public.introduction_outcomes WHERE id = p_outcome_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INTRO_OUTCOME_NOT_FOUND'; END IF;
  IF o.status <> 'pending' THEN RAISE EXCEPTION 'INTRO_OUTCOME_NOT_PENDING'; END IF;

  -- Look for canonical accepted connection between requester & target.
  SELECT true, COALESCE(uc.responded_at, uc.updated_at)
    INTO connected, conn_at
  FROM public.user_connections uc
  WHERE uc.status = 'accepted'
    AND (
      (uc.requester_user_id = o.requester_user_id AND uc.recipient_user_id = o.target_user_id)
      OR (uc.requester_user_id = o.target_user_id AND uc.recipient_user_id = o.requester_user_id)
    )
    AND COALESCE(uc.responded_at, uc.updated_at) >= COALESCE(o.acknowledged_at, o.created_at)
  ORDER BY COALESCE(uc.responded_at, uc.updated_at) ASC
  LIMIT 1;

  IF NOT COALESCE(connected, false) THEN
    RETURN o; -- nothing to do; no-op observation
  END IF;

  UPDATE public.introduction_outcomes SET
    status = 'resolved',
    outcome_type = 'connected',
    outcome_source = 'observed_connection',
    connection_observed_at = conn_at,
    resolved_at = now()
  WHERE id = o.id
  RETURNING * INTO o;
  RETURN o;
END;
$$;
REVOKE ALL ON FUNCTION public.intro_outcome_observe_connection(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_outcome_observe_connection(uuid) TO service_role, authenticated;

-- Mark progressed (requester or intermediary).
CREATE OR REPLACE FUNCTION public.intro_outcome_mark_progressed(
  p_outcome_id uuid,
  p_note text DEFAULT NULL
) RETURNS public.introduction_outcomes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o public.introduction_outcomes;
  actor uuid := auth.uid();
  src text;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'INTRO_OUTCOME_FORBIDDEN'; END IF;
  SELECT * INTO o FROM public.introduction_outcomes WHERE id = p_outcome_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INTRO_OUTCOME_NOT_FOUND'; END IF;
  IF o.status <> 'pending' THEN RAISE EXCEPTION 'INTRO_OUTCOME_NOT_PENDING'; END IF;
  IF o.expires_at < now() THEN RAISE EXCEPTION 'INTRO_OUTCOME_EXPIRED'; END IF;

  IF actor = o.requester_user_id THEN src := 'declared_requester';
  ELSIF actor = o.intermediary_user_id THEN src := 'declared_intermediary';
  ELSE RAISE EXCEPTION 'INTRO_OUTCOME_NOT_OWNED';
  END IF;

  IF p_note IS NOT NULL AND char_length(btrim(p_note)) > 500 THEN
    RAISE EXCEPTION 'INTRO_OUTCOME_NOTE_INVALID';
  END IF;

  UPDATE public.introduction_outcomes SET
    status = 'resolved',
    outcome_type = 'progressed',
    outcome_source = src,
    outcome_note = NULLIF(btrim(COALESCE(p_note, '')), ''),
    progressed_at = now(),
    resolved_at = now()
  WHERE id = o.id
  RETURNING * INTO o;
  RETURN o;
END;
$$;
REVOKE ALL ON FUNCTION public.intro_outcome_mark_progressed(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_outcome_mark_progressed(uuid, text) TO authenticated, service_role;

-- Mark no outcome (requester only in v1).
CREATE OR REPLACE FUNCTION public.intro_outcome_mark_no_outcome(
  p_outcome_id uuid
) RETURNS public.introduction_outcomes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o public.introduction_outcomes;
  actor uuid := auth.uid();
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'INTRO_OUTCOME_FORBIDDEN'; END IF;
  SELECT * INTO o FROM public.introduction_outcomes WHERE id = p_outcome_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INTRO_OUTCOME_NOT_FOUND'; END IF;
  IF o.status <> 'pending' THEN RAISE EXCEPTION 'INTRO_OUTCOME_NOT_PENDING'; END IF;
  IF actor <> o.requester_user_id THEN RAISE EXCEPTION 'INTRO_OUTCOME_NOT_OWNED'; END IF;

  UPDATE public.introduction_outcomes SET
    status = 'resolved',
    outcome_type = 'not_connected',
    outcome_source = 'declared_requester',
    resolved_at = now()
  WHERE id = o.id
  RETURNING * INTO o;
  RETURN o;
END;
$$;
REVOKE ALL ON FUNCTION public.intro_outcome_mark_no_outcome(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_outcome_mark_no_outcome(uuid) TO authenticated, service_role;

-- Lazy expiry: promote a single outcome if past window.
CREATE OR REPLACE FUNCTION public.intro_outcome_expire(
  p_outcome_id uuid
) RETURNS public.introduction_outcomes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o public.introduction_outcomes;
BEGIN
  SELECT * INTO o FROM public.introduction_outcomes WHERE id = p_outcome_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INTRO_OUTCOME_NOT_FOUND'; END IF;
  IF o.status <> 'pending' THEN RETURN o; END IF;
  IF o.expires_at > now() THEN RETURN o; END IF;
  UPDATE public.introduction_outcomes SET
    status = 'expired',
    outcome_type = 'closed_no_outcome',
    outcome_source = 'window_expired',
    resolved_at = now()
  WHERE id = o.id
  RETURNING * INTO o;
  RETURN o;
END;
$$;
REVOKE ALL ON FUNCTION public.intro_outcome_expire(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_outcome_expire(uuid) TO authenticated, service_role;

-- Bounded sweep for scheduled expiry.
CREATE OR REPLACE FUNCTION public.intro_outcome_expire_sweep(
  p_limit integer DEFAULT 200
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cnt integer := 0;
  r record;
BEGIN
  FOR r IN
    SELECT id FROM public.introduction_outcomes
     WHERE status = 'pending' AND expires_at <= now()
     ORDER BY expires_at ASC LIMIT GREATEST(1, LEAST(p_limit, 1000))
     FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.introduction_outcomes SET
      status = 'expired',
      outcome_type = 'closed_no_outcome',
      outcome_source = 'window_expired',
      resolved_at = now()
    WHERE id = r.id;
    cnt := cnt + 1;
  END LOOP;
  RETURN cnt;
END;
$$;
REVOKE ALL ON FUNCTION public.intro_outcome_expire_sweep(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_outcome_expire_sweep(integer) TO service_role;
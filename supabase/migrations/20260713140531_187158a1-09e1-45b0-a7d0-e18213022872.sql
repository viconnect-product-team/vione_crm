-- =====================================================================
-- BC-3.1A — Global Business Networking: schema, RLS, state machine.
-- ADDITIVE. Does NOT touch legacy `connections`, `net_*` RPCs, or members.
-- =====================================================================

-- 1. ENUMS -------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.global_connection_status AS ENUM
    ('pending','accepted','declined','cancelled','disconnected','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.global_connection_source_type AS ENUM
    ('business_card','saved_card','qr','nfc','event','meeting',
     'association','community','company','marketplace','manual','referral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABLE: user_connections ------------------------------------------
CREATE TABLE public.user_connections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_user_low       uuid GENERATED ALWAYS AS (least(requester_user_id, recipient_user_id)) STORED,
  pair_user_high      uuid GENERATED ALWAYS AS (greatest(requester_user_id, recipient_user_id)) STORED,
  status              public.global_connection_status NOT NULL DEFAULT 'pending',
  source_type         public.global_connection_source_type NOT NULL DEFAULT 'manual',
  source_id           uuid NULL,
  blocked_by_user_id  uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status_reason       text NULL,
  requested_at        timestamptz NOT NULL DEFAULT now(),
  responded_at        timestamptz NULL,
  disconnected_at     timestamptz NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_connections_no_self CHECK (requester_user_id <> recipient_user_id)
);

COMMENT ON TABLE public.user_connections IS
  'BC-3.1A Global user-to-user connections. Participant-private. Mutations only via global_connection_* functions.';

-- Deterministic pair uniqueness: one ACTIVE row per unordered pair.
CREATE UNIQUE INDEX user_connections_active_pair_uq
  ON public.user_connections (pair_user_low, pair_user_high)
  WHERE status IN ('pending','accepted','blocked');

-- 3. INDEXES ----------------------------------------------------------
CREATE INDEX user_connections_requester_status_idx ON public.user_connections (requester_user_id, status);
CREATE INDEX user_connections_recipient_status_idx ON public.user_connections (recipient_user_id, status);
CREATE INDEX user_connections_pair_idx ON public.user_connections (pair_user_low, pair_user_high);
CREATE INDEX user_connections_status_requested_idx ON public.user_connections (status, requested_at DESC);
CREATE INDEX user_connections_updated_idx ON public.user_connections (updated_at DESC);
CREATE INDEX user_connections_blocked_by_idx ON public.user_connections (blocked_by_user_id) WHERE blocked_by_user_id IS NOT NULL;

-- 4. AUDIT EVENTS -----------------------------------------------------
CREATE TABLE public.user_connection_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id       uuid NOT NULL REFERENCES public.user_connections(id) ON DELETE CASCADE,
  actor_user_id       uuid NOT NULL,
  counterpart_user_id uuid NOT NULL,
  transition          text NOT NULL,
  source_type         public.global_connection_source_type NULL,
  source_id           uuid NULL,
  mutation_key        text NULL,
  occurred_at         timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_connection_events_conn_idx ON public.user_connection_events (connection_id, occurred_at DESC);
CREATE INDEX user_connection_events_actor_idx ON public.user_connection_events (actor_user_id, occurred_at DESC);

COMMENT ON TABLE public.user_connection_events IS
  'BC-3.1A audit log of connection lifecycle transitions. No private card/note/contact data.';

-- 5. IDEMPOTENCY LEDGER ----------------------------------------------
CREATE TABLE public.global_connection_mutations (
  actor_user_id  uuid NOT NULL,
  mutation_key   text NOT NULL,
  operation      text NOT NULL,
  connection_id  uuid NULL,
  result         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_user_id, mutation_key)
);
COMMENT ON TABLE public.global_connection_mutations IS
  'BC-3.1A idempotency ledger for global_connection_* mutations.';

-- 6. GRANTS -----------------------------------------------------------
-- Participants read via RLS. No direct write for authenticated (funnel via functions).
GRANT SELECT ON public.user_connections TO authenticated;
GRANT ALL ON public.user_connections TO service_role;

GRANT SELECT ON public.user_connection_events TO authenticated;
GRANT ALL ON public.user_connection_events TO service_role;

GRANT ALL ON public.global_connection_mutations TO service_role;
-- NO anon grants anywhere. NO authenticated INSERT/UPDATE/DELETE.

-- 7. RLS --------------------------------------------------------------
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_connection_mutations ENABLE ROW LEVEL SECURITY;

-- Only participants may read a connection row.
CREATE POLICY user_connections_select_participant
  ON public.user_connections FOR SELECT TO authenticated
  USING (auth.uid() IN (requester_user_id, recipient_user_id));

-- Participants may read audit events they are part of.
CREATE POLICY user_connection_events_select_participant
  ON public.user_connection_events FOR SELECT TO authenticated
  USING (auth.uid() IN (actor_user_id, counterpart_user_id));

-- No policies grant authenticated INSERT/UPDATE/DELETE on any of the three
-- tables => all direct mutations are denied; only SECURITY DEFINER functions
-- can write. global_connection_mutations has no authenticated policy at all.

-- 8. updated_at trigger ----------------------------------------------
CREATE TRIGGER user_connections_set_updated_at
  BEFORE UPDATE ON public.user_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. IMMUTABILITY GUARD ----------------------------------------------
-- requester/recipient/pair fields can never change after insert.
CREATE OR REPLACE FUNCTION public.guard_user_connection_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.requester_user_id <> OLD.requester_user_id
     OR NEW.recipient_user_id <> OLD.recipient_user_id THEN
    RAISE EXCEPTION 'NETWORK_IMMUTABLE_FIELD';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER user_connections_immutable
  BEFORE UPDATE ON public.user_connections
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_connection_immutable();

-- 10. STATE-TRANSITION GUARD (defence in depth on top of functions) ---
CREATE OR REPLACE FUNCTION public.guard_user_connection_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE ok boolean := false;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  ok := CASE
    WHEN OLD.status = 'pending'  AND NEW.status IN ('accepted','declined','cancelled','blocked') THEN true
    WHEN OLD.status = 'accepted' AND NEW.status IN ('disconnected','blocked') THEN true
    WHEN OLD.status IN ('declined','cancelled','disconnected') AND NEW.status = 'blocked' THEN true
    ELSE false
  END;
  IF NOT ok THEN
    RAISE EXCEPTION 'NETWORK_INVALID_TRANSITION';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER user_connections_transition_guard
  BEFORE UPDATE ON public.user_connections
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_connection_transition();

-- 11. INTERNAL HELPERS ------------------------------------------------
-- Assert caller is an active platform user; returns uid.
CREATE OR REPLACE FUNCTION public.gn_require_user()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _status text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'NETWORK_AUTH_REQUIRED'; END IF;
  SELECT account_status INTO _status FROM public.user_profiles WHERE user_id = _uid;
  IF _status = 'suspended' THEN RAISE EXCEPTION 'NETWORK_ACCOUNT_SUSPENDED'; END IF;
  IF _status = 'deactivated' THEN RAISE EXCEPTION 'NETWORK_ACCOUNT_INACTIVE'; END IF;
  RETURN _uid;
END $$;

-- Record an audit event.
CREATE OR REPLACE FUNCTION public.gn_log_event(
  _conn uuid, _actor uuid, _counterpart uuid, _transition text,
  _source public.global_connection_source_type, _source_id uuid, _mkey text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.user_connection_events
    (connection_id, actor_user_id, counterpart_user_id, transition, source_type, source_id, mutation_key)
  VALUES (_conn, _actor, _counterpart, _transition, _source, _source_id, _mkey);
$$;

-- 12. MUTATION FUNCTIONS ---------------------------------------------

-- SEND REQUEST
CREATE OR REPLACE FUNCTION public.global_connection_send_request(
  _target_user_id uuid,
  _source_type text DEFAULT 'manual',
  _source_id uuid DEFAULT NULL,
  _mutation_key text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := public.gn_require_user();
  _src public.global_connection_source_type;
  _existing public.user_connections%ROWTYPE;
  _new_id uuid;
  _cached jsonb;
BEGIN
  IF _target_user_id = _uid THEN RAISE EXCEPTION 'NETWORK_SELF_CONNECTION'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _target_user_id) THEN
    RAISE EXCEPTION 'NETWORK_TARGET_NOT_FOUND';
  END IF;

  -- Idempotency
  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.global_connection_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  BEGIN
    _src := _source_type::public.global_connection_source_type;
  EXCEPTION WHEN invalid_text_representation THEN
    _src := 'manual';
  END;

  -- Lock any existing active row for this pair.
  SELECT * INTO _existing FROM public.user_connections
    WHERE pair_user_low = least(_uid, _target_user_id)
      AND pair_user_high = greatest(_uid, _target_user_id)
      AND status IN ('pending','accepted','blocked')
    FOR UPDATE;

  IF FOUND THEN
    IF _existing.status = 'blocked' THEN RAISE EXCEPTION 'NETWORK_BLOCKED'; END IF;
    IF _existing.status = 'pending' THEN RAISE EXCEPTION 'NETWORK_ALREADY_PENDING'; END IF;
    IF _existing.status = 'accepted' THEN RAISE EXCEPTION 'NETWORK_ALREADY_CONNECTED'; END IF;
  END IF;

  BEGIN
    INSERT INTO public.user_connections
      (requester_user_id, recipient_user_id, status, source_type, source_id, requested_at)
    VALUES (_uid, _target_user_id, 'pending', _src, _source_id, now())
    RETURNING id INTO _new_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'NETWORK_MUTATION_CONFLICT';
  END;

  PERFORM public.gn_log_event(_new_id, _uid, _target_user_id, 'connection_requested', _src, _source_id, _mutation_key);

  _cached := jsonb_build_object('connectionId', _new_id, 'status', 'pending');
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.global_connection_mutations (actor_user_id, mutation_key, operation, connection_id, result)
    VALUES (_uid, _mutation_key, 'send_request', _new_id, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- Shared transition helper for accept/decline/cancel/disconnect.
CREATE OR REPLACE FUNCTION public.gn_apply_transition(
  _conn uuid, _op text, _reason text, _mutation_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := public.gn_require_user();
  _row public.user_connections%ROWTYPE;
  _new_status public.global_connection_status;
  _counterpart uuid;
  _transition text;
  _cached jsonb;
BEGIN
  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.global_connection_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  SELECT * INTO _row FROM public.user_connections WHERE id = _conn FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NETWORK_CONNECTION_NOT_FOUND'; END IF;
  IF _uid NOT IN (_row.requester_user_id, _row.recipient_user_id) THEN
    RAISE EXCEPTION 'NETWORK_NOT_PARTICIPANT';
  END IF;
  _counterpart := CASE WHEN _uid = _row.requester_user_id THEN _row.recipient_user_id ELSE _row.requester_user_id END;

  IF _op = 'accept' THEN
    IF _row.status <> 'pending' THEN RAISE EXCEPTION 'NETWORK_INVALID_TRANSITION'; END IF;
    IF _uid <> _row.recipient_user_id THEN RAISE EXCEPTION 'NETWORK_NOT_RECIPIENT'; END IF;
    _new_status := 'accepted'; _transition := 'connection_accepted';
  ELSIF _op = 'decline' THEN
    IF _row.status <> 'pending' THEN RAISE EXCEPTION 'NETWORK_INVALID_TRANSITION'; END IF;
    IF _uid <> _row.recipient_user_id THEN RAISE EXCEPTION 'NETWORK_NOT_RECIPIENT'; END IF;
    _new_status := 'declined'; _transition := 'connection_declined';
  ELSIF _op = 'cancel' THEN
    IF _row.status <> 'pending' THEN RAISE EXCEPTION 'NETWORK_INVALID_TRANSITION'; END IF;
    IF _uid <> _row.requester_user_id THEN RAISE EXCEPTION 'NETWORK_NOT_REQUESTER'; END IF;
    _new_status := 'cancelled'; _transition := 'connection_cancelled';
  ELSIF _op = 'disconnect' THEN
    IF _row.status <> 'accepted' THEN RAISE EXCEPTION 'NETWORK_INVALID_TRANSITION'; END IF;
    _new_status := 'disconnected'; _transition := 'connection_disconnected';
  ELSE
    RAISE EXCEPTION 'NETWORK_INVALID_TRANSITION';
  END IF;

  UPDATE public.user_connections SET
    status = _new_status,
    status_reason = COALESCE(_reason, status_reason),
    responded_at = CASE WHEN _new_status IN ('accepted','declined') THEN now() ELSE responded_at END,
    disconnected_at = CASE WHEN _new_status = 'disconnected' THEN now() ELSE disconnected_at END
  WHERE id = _conn;

  PERFORM public.gn_log_event(_conn, _uid, _counterpart, _transition, _row.source_type, _row.source_id, _mutation_key);

  _cached := jsonb_build_object('connectionId', _conn, 'status', _new_status);
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.global_connection_mutations (actor_user_id, mutation_key, operation, connection_id, result)
    VALUES (_uid, _mutation_key, _op, _conn, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

CREATE OR REPLACE FUNCTION public.global_connection_accept(_connection_id uuid, _mutation_key text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.gn_apply_transition(_connection_id, 'accept', NULL, _mutation_key);
$$;

CREATE OR REPLACE FUNCTION public.global_connection_decline(_connection_id uuid, _reason text DEFAULT NULL, _mutation_key text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.gn_apply_transition(_connection_id, 'decline', _reason, _mutation_key);
$$;

CREATE OR REPLACE FUNCTION public.global_connection_cancel(_connection_id uuid, _mutation_key text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.gn_apply_transition(_connection_id, 'cancel', NULL, _mutation_key);
$$;

CREATE OR REPLACE FUNCTION public.global_connection_disconnect(_connection_id uuid, _reason text DEFAULT NULL, _mutation_key text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.gn_apply_transition(_connection_id, 'disconnect', _reason, _mutation_key);
$$;

-- BLOCK
CREATE OR REPLACE FUNCTION public.global_connection_block(
  _target_user_id uuid, _reason text DEFAULT NULL, _mutation_key text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := public.gn_require_user();
  _row public.user_connections%ROWTYPE;
  _conn uuid;
  _cached jsonb;
BEGIN
  IF _target_user_id = _uid THEN RAISE EXCEPTION 'NETWORK_SELF_CONNECTION'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _target_user_id) THEN
    RAISE EXCEPTION 'NETWORK_TARGET_NOT_FOUND';
  END IF;

  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.global_connection_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  SELECT * INTO _row FROM public.user_connections
    WHERE pair_user_low = least(_uid, _target_user_id)
      AND pair_user_high = greatest(_uid, _target_user_id)
      AND status IN ('pending','accepted','blocked')
    FOR UPDATE;

  IF FOUND THEN
    IF _row.status = 'blocked' THEN
      _conn := _row.id;
    ELSE
      UPDATE public.user_connections
        SET status = 'blocked', blocked_by_user_id = _uid, status_reason = COALESCE(_reason, status_reason)
        WHERE id = _row.id;
      _conn := _row.id;
    END IF;
  ELSE
    INSERT INTO public.user_connections
      (requester_user_id, recipient_user_id, status, source_type, blocked_by_user_id, status_reason)
    VALUES (_uid, _target_user_id, 'blocked', 'manual', _uid, _reason)
    RETURNING id INTO _conn;
  END IF;

  PERFORM public.gn_log_event(_conn, _uid, _target_user_id, 'connection_blocked', 'manual', NULL, _mutation_key);

  _cached := jsonb_build_object('connectionId', _conn, 'status', 'blocked');
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.global_connection_mutations (actor_user_id, mutation_key, operation, connection_id, result)
    VALUES (_uid, _mutation_key, 'block', _conn, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- 13. FUNCTION GRANTS -------------------------------------------------
REVOKE ALL ON FUNCTION public.global_connection_send_request(uuid, text, uuid, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.global_connection_accept(uuid, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.global_connection_decline(uuid, text, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.global_connection_cancel(uuid, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.global_connection_disconnect(uuid, text, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.global_connection_block(uuid, text, text) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.global_connection_send_request(uuid, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_connection_accept(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_connection_decline(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_connection_cancel(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_connection_disconnect(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_connection_block(uuid, text, text) TO authenticated;

-- Internal helpers: not callable directly by clients.
REVOKE ALL ON FUNCTION public.gn_require_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.gn_apply_transition(uuid, text, text, text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.gn_log_event(uuid, uuid, uuid, text, public.global_connection_source_type, uuid, text) FROM public, anon, authenticated;
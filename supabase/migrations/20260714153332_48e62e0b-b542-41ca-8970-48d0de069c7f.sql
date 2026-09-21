
-- BC-6.2 — Introduction Request Workflow
-- Additive: introduction_requests + SECURITY DEFINER RPCs.

CREATE TABLE IF NOT EXISTS public.introduction_requests (
  id                             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id              uuid NOT NULL,
  requester_person_node_id       uuid NOT NULL,
  intermediary_user_id           uuid NOT NULL,
  intermediary_person_node_id    uuid NOT NULL,
  target_person_node_id          uuid NOT NULL,
  path_id                        text NOT NULL,
  introduction_version           text NOT NULL,
  strength_version               text NOT NULL,
  status                         text NOT NULL DEFAULT 'pending',
  request_note                   text,
  path_snapshot                  jsonb NOT NULL,
  created_at                     timestamptz NOT NULL DEFAULT now(),
  updated_at                     timestamptz NOT NULL DEFAULT now(),
  responded_at                   timestamptz,
  cancelled_at                   timestamptz,
  expires_at                     timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  idempotency_key                text,
  version                        integer NOT NULL DEFAULT 1,
  CONSTRAINT ir_status_chk CHECK (status IN ('pending','accepted','declined','cancelled','expired')),
  CONSTRAINT ir_note_len_chk CHECK (request_note IS NULL OR length(request_note) <= 500),
  CONSTRAINT ir_distinct_r_i CHECK (requester_person_node_id <> intermediary_person_node_id),
  CONSTRAINT ir_distinct_r_t CHECK (requester_person_node_id <> target_person_node_id),
  CONSTRAINT ir_distinct_i_t CHECK (intermediary_person_node_id <> target_person_node_id),
  CONSTRAINT ir_distinct_users CHECK (requester_user_id <> intermediary_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ir_unique_pending_tuple
  ON public.introduction_requests (requester_user_id, intermediary_user_id, target_person_node_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS ir_unique_idem
  ON public.introduction_requests (requester_user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ir_by_intermediary ON public.introduction_requests (intermediary_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS ir_by_requester    ON public.introduction_requests (requester_user_id, status, created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.ir_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_ir_touch ON public.introduction_requests;
CREATE TRIGGER trg_ir_touch
  BEFORE UPDATE ON public.introduction_requests
  FOR EACH ROW EXECUTE FUNCTION public.ir_touch_updated_at();

-- Terminal immutability trigger — a request that reached a terminal status
-- cannot transition back to pending or to a different terminal.
CREATE OR REPLACE FUNCTION public.ir_enforce_terminal()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status IN ('accepted','declined','cancelled','expired')
     AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'INTRO_REQUEST_NOT_PENDING' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_ir_terminal ON public.introduction_requests;
CREATE TRIGGER trg_ir_terminal
  BEFORE UPDATE ON public.introduction_requests
  FOR EACH ROW EXECUTE FUNCTION public.ir_enforce_terminal();

-- Grants: authenticated reads only (RLS filters). All writes go through SECURITY DEFINER RPCs.
GRANT SELECT ON public.introduction_requests TO authenticated;
GRANT ALL ON public.introduction_requests TO service_role;

ALTER TABLE public.introduction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.introduction_requests FORCE ROW LEVEL SECURITY;

-- SELECT: requester or intermediary only.
CREATE POLICY ir_read_participant ON public.introduction_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_user_id OR auth.uid() = intermediary_user_id);

-- No direct INSERT/UPDATE/DELETE policies: writes must go through the SECURITY DEFINER RPCs below.

-- ---------- RPCs ----------

CREATE OR REPLACE FUNCTION public.intro_request_send(
  p_intermediary_user_id       uuid,
  p_intermediary_person_node_id uuid,
  p_target_person_node_id      uuid,
  p_path_id                    text,
  p_introduction_version       text,
  p_strength_version           text,
  p_path_snapshot              jsonb,
  p_request_note               text,
  p_idempotency_key            text
) RETURNS public.introduction_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_requester_node uuid;
  v_existing public.introduction_requests;
  v_row public.introduction_requests;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'INTRO_REQUEST_FORBIDDEN'; END IF;
  IF v_uid = p_intermediary_user_id THEN RAISE EXCEPTION 'INTRO_REQUEST_PATH_INVALID'; END IF;

  SELECT id INTO v_requester_node
    FROM public.graph_nodes
   WHERE node_kind = 'person'
     AND external_ref_type = 'user_profile'
     AND external_ref_id::text = v_uid::text
   LIMIT 1;
  IF v_requester_node IS NULL THEN RAISE EXCEPTION 'INTRO_REQUEST_PATH_INVALID'; END IF;

  -- Idempotency: return prior row on replay.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing FROM public.introduction_requests
      WHERE requester_user_id = v_uid AND idempotency_key = p_idempotency_key
      LIMIT 1;
    IF FOUND THEN RETURN v_existing; END IF;
  END IF;

  -- Duplicate-active collapse.
  SELECT * INTO v_existing FROM public.introduction_requests
    WHERE requester_user_id = v_uid
      AND intermediary_user_id = p_intermediary_user_id
      AND target_person_node_id = p_target_person_node_id
      AND status = 'pending'
    LIMIT 1;
  IF FOUND THEN RETURN v_existing; END IF;

  INSERT INTO public.introduction_requests(
    requester_user_id, requester_person_node_id,
    intermediary_user_id, intermediary_person_node_id,
    target_person_node_id,
    path_id, introduction_version, strength_version,
    status, request_note, path_snapshot, idempotency_key
  ) VALUES (
    v_uid, v_requester_node,
    p_intermediary_user_id, p_intermediary_person_node_id,
    p_target_person_node_id,
    p_path_id, p_introduction_version, p_strength_version,
    'pending', NULLIF(btrim(p_request_note), ''), p_path_snapshot, p_idempotency_key
  ) RETURNING * INTO v_row;
  RETURN v_row;
EXCEPTION WHEN unique_violation THEN
  SELECT * INTO v_existing FROM public.introduction_requests
    WHERE requester_user_id = v_uid
      AND ((p_idempotency_key IS NOT NULL AND idempotency_key = p_idempotency_key)
        OR (intermediary_user_id = p_intermediary_user_id
            AND target_person_node_id = p_target_person_node_id
            AND status = 'pending'))
    LIMIT 1;
  IF FOUND THEN RETURN v_existing; END IF;
  RAISE EXCEPTION 'INTRO_REQUEST_IDEMPOTENCY_CONFLICT';
END; $$;

CREATE OR REPLACE FUNCTION public.intro_request_accept(p_id uuid)
RETURNS public.introduction_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_row public.introduction_requests;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'INTRO_REQUEST_FORBIDDEN'; END IF;
  SELECT * INTO v_row FROM public.introduction_requests WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INTRO_REQUEST_NOT_FOUND'; END IF;
  IF v_row.intermediary_user_id <> v_uid THEN RAISE EXCEPTION 'INTRO_REQUEST_NOT_OWNED'; END IF;
  IF v_row.status = 'accepted' THEN RETURN v_row; END IF; -- idempotent replay
  IF v_row.status <> 'pending' THEN RAISE EXCEPTION 'INTRO_REQUEST_NOT_PENDING'; END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    UPDATE public.introduction_requests SET status = 'expired' WHERE id = p_id RETURNING * INTO v_row;
    RAISE EXCEPTION 'INTRO_REQUEST_EXPIRED';
  END IF;
  UPDATE public.introduction_requests
     SET status = 'accepted', responded_at = now()
   WHERE id = p_id RETURNING * INTO v_row;
  RETURN v_row;
END; $$;

CREATE OR REPLACE FUNCTION public.intro_request_decline(p_id uuid)
RETURNS public.introduction_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_row public.introduction_requests;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'INTRO_REQUEST_FORBIDDEN'; END IF;
  SELECT * INTO v_row FROM public.introduction_requests WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INTRO_REQUEST_NOT_FOUND'; END IF;
  IF v_row.intermediary_user_id <> v_uid THEN RAISE EXCEPTION 'INTRO_REQUEST_NOT_OWNED'; END IF;
  IF v_row.status = 'declined' THEN RETURN v_row; END IF;
  IF v_row.status <> 'pending' THEN RAISE EXCEPTION 'INTRO_REQUEST_NOT_PENDING'; END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    UPDATE public.introduction_requests SET status = 'expired' WHERE id = p_id RETURNING * INTO v_row;
    RAISE EXCEPTION 'INTRO_REQUEST_EXPIRED';
  END IF;
  UPDATE public.introduction_requests
     SET status = 'declined', responded_at = now()
   WHERE id = p_id RETURNING * INTO v_row;
  RETURN v_row;
END; $$;

CREATE OR REPLACE FUNCTION public.intro_request_cancel(p_id uuid)
RETURNS public.introduction_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_row public.introduction_requests;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'INTRO_REQUEST_FORBIDDEN'; END IF;
  SELECT * INTO v_row FROM public.introduction_requests WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INTRO_REQUEST_NOT_FOUND'; END IF;
  IF v_row.requester_user_id <> v_uid THEN RAISE EXCEPTION 'INTRO_REQUEST_NOT_OWNED'; END IF;
  IF v_row.status = 'cancelled' THEN RETURN v_row; END IF;
  IF v_row.status <> 'pending' THEN RAISE EXCEPTION 'INTRO_REQUEST_NOT_PENDING'; END IF;
  UPDATE public.introduction_requests
     SET status = 'cancelled', cancelled_at = now()
   WHERE id = p_id RETURNING * INTO v_row;
  RETURN v_row;
END; $$;

REVOKE ALL ON FUNCTION public.intro_request_send(uuid,uuid,uuid,text,text,text,jsonb,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.intro_request_accept(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.intro_request_decline(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.intro_request_cancel(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.intro_request_send(uuid,uuid,uuid,text,text,text,jsonb,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intro_request_accept(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intro_request_decline(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intro_request_cancel(uuid) TO authenticated;

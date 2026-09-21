
-- BC-6.3 — Introduction Delivery
CREATE TABLE IF NOT EXISTS public.introduction_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  introduction_request_id uuid NOT NULL REFERENCES public.introduction_requests(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL,
  requester_person_node_id uuid NOT NULL,
  intermediary_user_id uuid NOT NULL,
  intermediary_person_node_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  target_person_node_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('delivered','acknowledged','revoked','expired')),
  delivery_note text CHECK (delivery_note IS NULL OR char_length(delivery_note) <= 500),
  delivery_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  acknowledged_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  idempotency_key text,
  version integer NOT NULL DEFAULT 1
);

-- One active (delivered) delivery per request; terminal rows may accumulate as audit.
CREATE UNIQUE INDEX IF NOT EXISTS idx_intro_deliveries_active_request
  ON public.introduction_deliveries(introduction_request_id)
  WHERE status = 'delivered';

CREATE INDEX IF NOT EXISTS idx_intro_deliveries_target
  ON public.introduction_deliveries(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intro_deliveries_intermediary
  ON public.introduction_deliveries(intermediary_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intro_deliveries_requester
  ON public.introduction_deliveries(requester_user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_intro_deliveries_idem
  ON public.introduction_deliveries(intermediary_user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Terminal-state immutability trigger.
CREATE OR REPLACE FUNCTION public.id_enforce_terminal()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status IN ('acknowledged','revoked','expired') AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_TERMINAL' USING ERRCODE = '22023';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS id_enforce_terminal ON public.introduction_deliveries;
CREATE TRIGGER id_enforce_terminal
  BEFORE UPDATE ON public.introduction_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.id_enforce_terminal();

GRANT SELECT ON public.introduction_deliveries TO authenticated;
GRANT ALL ON public.introduction_deliveries TO service_role;

ALTER TABLE public.introduction_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.introduction_deliveries FORCE ROW LEVEL SECURITY;

CREATE POLICY id_select_intermediary ON public.introduction_deliveries
  FOR SELECT TO authenticated
  USING (auth.uid() = intermediary_user_id);

CREATE POLICY id_select_target ON public.introduction_deliveries
  FOR SELECT TO authenticated
  USING (auth.uid() = target_user_id);

CREATE POLICY id_select_requester ON public.introduction_deliveries
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_user_id);

-- No direct authenticated writes; only SECURITY DEFINER RPCs may mutate.

-- ==========================================================================
-- RPC: intro_delivery_deliver
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.intro_delivery_deliver(
  p_introduction_request_id uuid,
  p_delivery_note text,
  p_delivery_snapshot jsonb,
  p_idempotency_key text
) RETURNS public.introduction_deliveries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req public.introduction_requests%ROWTYPE;
  v_target_user_id uuid;
  v_row public.introduction_deliveries%ROWTYPE;
  v_existing public.introduction_deliveries%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  -- Idempotency replay.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing FROM public.introduction_deliveries
      WHERE intermediary_user_id = v_uid AND idempotency_key = p_idempotency_key
      LIMIT 1;
    IF FOUND THEN RETURN v_existing; END IF;
  END IF;

  SELECT * INTO v_req FROM public.introduction_requests
    WHERE id = p_introduction_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_REQUEST_NOT_ACCEPTED' USING ERRCODE = '22023';
  END IF;
  IF v_req.intermediary_user_id <> v_uid THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_NOT_OWNED' USING ERRCODE = '42501';
  END IF;
  IF v_req.status <> 'accepted' THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_REQUEST_NOT_ACCEPTED' USING ERRCODE = '22023';
  END IF;

  -- Resolve target user id from graph_nodes (person → user_profile external ref).
  SELECT (external_ref_id)::uuid INTO v_target_user_id
    FROM public.graph_nodes
   WHERE id = v_req.target_person_node_id
     AND node_kind = 'person'
     AND external_ref_type = 'user_profile'
     AND status = 'active';
  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_TARGET_UNAVAILABLE' USING ERRCODE = '22023';
  END IF;

  -- Duplicate active delivery check.
  IF EXISTS (
    SELECT 1 FROM public.introduction_deliveries
     WHERE introduction_request_id = p_introduction_request_id
       AND status = 'delivered'
  ) THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_ALREADY_EXISTS' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.introduction_deliveries(
    introduction_request_id, requester_user_id, requester_person_node_id,
    intermediary_user_id, intermediary_person_node_id,
    target_user_id, target_person_node_id,
    status, delivery_note, delivery_snapshot,
    delivered_at, idempotency_key
  ) VALUES (
    p_introduction_request_id, v_req.requester_user_id, v_req.requester_person_node_id,
    v_req.intermediary_user_id, v_req.intermediary_person_node_id,
    v_target_user_id, v_req.target_person_node_id,
    'delivered', NULLIF(btrim(p_delivery_note), ''), COALESCE(p_delivery_snapshot, '{}'::jsonb),
    now(), p_idempotency_key
  ) RETURNING * INTO v_row;

  RETURN v_row;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'INTRO_DELIVERY_ALREADY_EXISTS' USING ERRCODE = '23505';
END $$;

-- ==========================================================================
-- RPC: intro_delivery_acknowledge
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.intro_delivery_acknowledge(p_id uuid)
RETURNS public.introduction_deliveries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.introduction_deliveries%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_row FROM public.introduction_deliveries WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_NOT_FOUND' USING ERRCODE = '22023';
  END IF;
  IF v_row.target_user_id <> v_uid THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_NOT_OWNED' USING ERRCODE = '42501';
  END IF;
  IF v_row.status = 'acknowledged' THEN
    RETURN v_row; -- idempotent
  END IF;
  IF v_row.status = 'expired' OR (v_row.expires_at IS NOT NULL AND v_row.expires_at < now()) THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_EXPIRED' USING ERRCODE = '22023';
  END IF;
  IF v_row.status <> 'delivered' THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_NOT_DELIVERED' USING ERRCODE = '22023';
  END IF;
  UPDATE public.introduction_deliveries
     SET status = 'acknowledged', acknowledged_at = now()
   WHERE id = p_id
   RETURNING * INTO v_row;
  RETURN v_row;
END $$;

-- ==========================================================================
-- RPC: intro_delivery_revoke
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.intro_delivery_revoke(p_id uuid)
RETURNS public.introduction_deliveries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.introduction_deliveries%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_row FROM public.introduction_deliveries WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_NOT_FOUND' USING ERRCODE = '22023';
  END IF;
  IF v_row.intermediary_user_id <> v_uid THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_NOT_OWNED' USING ERRCODE = '42501';
  END IF;
  IF v_row.status = 'revoked' THEN
    RETURN v_row; -- idempotent
  END IF;
  IF v_row.status = 'acknowledged' THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_CANNOT_REVOKE' USING ERRCODE = '22023';
  END IF;
  IF v_row.status <> 'delivered' THEN
    RAISE EXCEPTION 'INTRO_DELIVERY_CANNOT_REVOKE' USING ERRCODE = '22023';
  END IF;
  UPDATE public.introduction_deliveries
     SET status = 'revoked', revoked_at = now()
   WHERE id = p_id
   RETURNING * INTO v_row;
  RETURN v_row;
END $$;

REVOKE ALL ON FUNCTION public.intro_delivery_deliver(uuid, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.intro_delivery_acknowledge(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.intro_delivery_revoke(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intro_delivery_deliver(uuid, text, jsonb, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.intro_delivery_acknowledge(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.intro_delivery_revoke(uuid) TO authenticated, service_role;


-- BC-9.0 Turn B1 — AI persistence & gateway foundation
-- Force RLS + SECURITY DEFINER RPCs; direct client writes blocked by absence of INSERT/UPDATE policies.

-- ============================================================
-- 1. business_connect_ai_requests
-- ============================================================
CREATE TABLE public.business_connect_ai_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_scope_opaque text NOT NULL,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability text NOT NULL,
  scope_type text NOT NULL,
  scope_ref text,
  idempotency_signature text NOT NULL,
  user_idempotency_key text,
  context_hash text NOT NULL,
  prompt_version text NOT NULL,
  policy_version text NOT NULL,
  model_policy_class text NOT NULL,
  source_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  status_reason text,
  canonical_result_id uuid,
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz NOT NULL,
  timeout_ms integer NOT NULL,
  token_budget integer NOT NULL,
  estimated_cost_millicents integer,
  actual_cost_millicents integer,
  latency_ms integer,
  provider_id text,
  model_id text,
  cache_hit boolean NOT NULL DEFAULT false,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bcai_req_status_ck CHECK (status IN
    ('pending','running','completed','failed','cancelled','expired')),
  CONSTRAINT bcai_req_policy_ck CHECK (model_policy_class IN
    ('cloud_general','cloud_private','local_private','unavailable')),
  CONSTRAINT bcai_req_capability_ck CHECK (capability IN
    ('relationship_briefing','meeting_preparation','introduction_draft',
     'follow_up_draft','next_action_suggestion','opportunity_signal_summary',
     'network_query','work_hub_assistant'))
);

CREATE UNIQUE INDEX ux_bcai_req_idempotency
  ON public.business_connect_ai_requests (idempotency_signature);
CREATE INDEX ix_bcai_req_requester_created
  ON public.business_connect_ai_requests (requester_id, created_at DESC);
CREATE INDEX ix_bcai_req_status
  ON public.business_connect_ai_requests (status)
  WHERE status IN ('pending','running');

GRANT SELECT ON public.business_connect_ai_requests TO authenticated;
GRANT ALL ON public.business_connect_ai_requests TO service_role;
ALTER TABLE public.business_connect_ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_connect_ai_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY bcai_req_owner_read ON public.business_connect_ai_requests
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid());
-- No INSERT/UPDATE/DELETE policies: all writes must go through SECURITY DEFINER RPCs.

-- ============================================================
-- 2. business_connect_ai_results
-- ============================================================
CREATE TABLE public.business_connect_ai_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.business_connect_ai_requests(id) ON DELETE CASCADE,
  tenant_scope_opaque text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability text NOT NULL,
  status text NOT NULL DEFAULT 'generated',
  payload jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  context_hash text NOT NULL,
  source_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_version text NOT NULL,
  policy_version text NOT NULL,
  model_policy_class text NOT NULL,
  provider_id text,
  model_id text,
  is_canonical boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  reviewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejected_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bcai_res_status_ck CHECK (status IN
    ('generated','reviewed','accepted','rejected','expired'))
);

CREATE UNIQUE INDEX ux_bcai_res_canonical
  ON public.business_connect_ai_results (request_id)
  WHERE is_canonical;
CREATE INDEX ix_bcai_res_owner_created
  ON public.business_connect_ai_results (owner_id, created_at DESC);
CREATE INDEX ix_bcai_res_lookup
  ON public.business_connect_ai_results (owner_id, capability, context_hash)
  WHERE is_canonical AND status IN ('generated','reviewed','accepted');

GRANT SELECT ON public.business_connect_ai_results TO authenticated;
GRANT ALL ON public.business_connect_ai_results TO service_role;
ALTER TABLE public.business_connect_ai_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_connect_ai_results FORCE ROW LEVEL SECURITY;
CREATE POLICY bcai_res_owner_read ON public.business_connect_ai_results
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

ALTER TABLE public.business_connect_ai_requests
  ADD CONSTRAINT bcai_req_canonical_fk
  FOREIGN KEY (canonical_result_id)
  REFERENCES public.business_connect_ai_results(id) ON DELETE SET NULL;

-- ============================================================
-- 3. business_connect_ai_result_feedback
-- ============================================================
CREATE TABLE public.business_connect_ai_result_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid NOT NULL REFERENCES public.business_connect_ai_results(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_scope_opaque text NOT NULL,
  action text NOT NULL,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bcai_fb_action_ck CHECK (action IN ('accept','reject','report','review')),
  CONSTRAINT bcai_fb_unique UNIQUE (result_id, owner_id, action)
);

GRANT SELECT ON public.business_connect_ai_result_feedback TO authenticated;
GRANT ALL ON public.business_connect_ai_result_feedback TO service_role;
ALTER TABLE public.business_connect_ai_result_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_connect_ai_result_feedback FORCE ROW LEVEL SECURITY;
CREATE POLICY bcai_fb_owner_read ON public.business_connect_ai_result_feedback
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================
-- 4. business_connect_ai_tool_invocations
-- ============================================================
CREATE TABLE public.business_connect_ai_tool_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.business_connect_ai_requests(id) ON DELETE CASCADE,
  tenant_scope_opaque text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  iteration integer NOT NULL,
  status text NOT NULL,
  input_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  latency_ms integer,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bcai_tool_status_ck CHECK (status IN ('ok','failed','skipped','denied'))
);
CREATE INDEX ix_bcai_tool_request ON public.business_connect_ai_tool_invocations (request_id, iteration);

GRANT SELECT ON public.business_connect_ai_tool_invocations TO authenticated;
GRANT ALL ON public.business_connect_ai_tool_invocations TO service_role;
ALTER TABLE public.business_connect_ai_tool_invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_connect_ai_tool_invocations FORCE ROW LEVEL SECURITY;
CREATE POLICY bcai_tool_owner_read ON public.business_connect_ai_tool_invocations
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================
-- Rate-limit counters (atomic quota)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.business_connect_ai_rate_counters (
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability text NOT NULL,
  window_start_utc date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_id, capability, window_start_utc)
);
GRANT SELECT ON public.business_connect_ai_rate_counters TO authenticated;
GRANT ALL ON public.business_connect_ai_rate_counters TO service_role;
ALTER TABLE public.business_connect_ai_rate_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_connect_ai_rate_counters FORCE ROW LEVEL SECURITY;
CREATE POLICY bcai_rate_owner_read ON public.business_connect_ai_rate_counters
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.bcai_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

CREATE TRIGGER trg_bcai_req_touch BEFORE UPDATE ON public.business_connect_ai_requests
  FOR EACH ROW EXECUTE FUNCTION public.bcai_touch_updated_at();
CREATE TRIGGER trg_bcai_res_touch BEFORE UPDATE ON public.business_connect_ai_results
  FOR EACH ROW EXECUTE FUNCTION public.bcai_touch_updated_at();

-- ============================================================
-- Status-transition validator (request)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bcai_validate_request_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF OLD.status = 'pending'   AND NEW.status IN ('running','cancelled','expired','failed') THEN RETURN NEW; END IF;
  IF OLD.status = 'running'   AND NEW.status IN ('completed','failed','cancelled','expired') THEN RETURN NEW; END IF;
  IF OLD.status IN ('completed','failed','cancelled','expired') THEN
    RAISE EXCEPTION 'BC-9.0 request transition forbidden: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RAISE EXCEPTION 'BC-9.0 request transition unknown: % -> %', OLD.status, NEW.status
    USING ERRCODE = 'check_violation';
END $$;
CREATE TRIGGER trg_bcai_req_transition BEFORE UPDATE OF status
  ON public.business_connect_ai_requests
  FOR EACH ROW EXECUTE FUNCTION public.bcai_validate_request_transition();

-- ============================================================
-- Status-transition validator (result)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bcai_validate_result_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF OLD.status = 'generated' AND NEW.status IN ('reviewed','accepted','rejected','expired') THEN RETURN NEW; END IF;
  IF OLD.status = 'reviewed'  AND NEW.status IN ('accepted','rejected','expired') THEN RETURN NEW; END IF;
  IF OLD.status IN ('accepted','rejected','expired') THEN
    RAISE EXCEPTION 'BC-9.0 result transition forbidden: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RAISE EXCEPTION 'BC-9.0 result transition unknown: % -> %', OLD.status, NEW.status
    USING ERRCODE = 'check_violation';
END $$;
CREATE TRIGGER trg_bcai_res_transition BEFORE UPDATE OF status
  ON public.business_connect_ai_results
  FOR EACH ROW EXECUTE FUNCTION public.bcai_validate_result_transition();

-- ============================================================
-- RPC: claim (idempotent create) — returns id + is_new
-- ============================================================
CREATE OR REPLACE FUNCTION public.bcai_claim_request(
  p_capability text,
  p_scope_type text,
  p_scope_ref text,
  p_idempotency_signature text,
  p_user_idempotency_key text,
  p_context_hash text,
  p_prompt_version text,
  p_policy_version text,
  p_model_policy_class text,
  p_source_versions jsonb,
  p_timeout_ms integer,
  p_token_budget integer,
  p_expires_at timestamptz,
  p_tenant_scope_opaque text,
  p_estimated_cost_millicents integer
)
RETURNS TABLE (request_id uuid, is_new boolean, existing_status text, canonical_result_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
  v_status text;
  v_canonical uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'BUSINESS_CONNECT_AI_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.business_connect_ai_requests (
    tenant_scope_opaque, requester_id, capability, scope_type, scope_ref,
    idempotency_signature, user_idempotency_key,
    context_hash, prompt_version, policy_version, model_policy_class,
    source_versions, expires_at, timeout_ms, token_budget, estimated_cost_millicents
  ) VALUES (
    p_tenant_scope_opaque, v_uid, p_capability, p_scope_type, p_scope_ref,
    p_idempotency_signature, p_user_idempotency_key,
    p_context_hash, p_prompt_version, p_policy_version, p_model_policy_class,
    COALESCE(p_source_versions,'{}'::jsonb), p_expires_at, p_timeout_ms, p_token_budget, p_estimated_cost_millicents
  )
  ON CONFLICT (idempotency_signature) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    RETURN QUERY SELECT v_id, true, 'pending'::text, NULL::uuid;
    RETURN;
  END IF;

  SELECT r.id, r.status, r.canonical_result_id
    INTO v_id, v_status, v_canonical
  FROM public.business_connect_ai_requests r
  WHERE r.idempotency_signature = p_idempotency_signature
    AND r.requester_id = v_uid;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'BUSINESS_CONNECT_AI_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY SELECT v_id, false, v_status, v_canonical;
END $$;

REVOKE ALL ON FUNCTION public.bcai_claim_request(
  text,text,text,text,text,text,text,text,text,jsonb,integer,integer,timestamptz,text,integer
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bcai_claim_request(
  text,text,text,text,text,text,text,text,text,jsonb,integer,integer,timestamptz,text,integer
) TO authenticated, service_role;

-- ============================================================
-- RPC: transition request status
-- ============================================================
CREATE OR REPLACE FUNCTION public.bcai_transition_request(
  p_request_id uuid,
  p_next_status text,
  p_reason text,
  p_provider_id text,
  p_model_id text,
  p_latency_ms integer,
  p_actual_cost_millicents integer,
  p_error_code text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'BUSINESS_CONNECT_AI_UNAUTHENTICATED' USING ERRCODE='42501'; END IF;
  UPDATE public.business_connect_ai_requests
     SET status = p_next_status,
         status_reason = COALESCE(p_reason, status_reason),
         started_at = CASE WHEN p_next_status = 'running' AND started_at IS NULL THEN now() ELSE started_at END,
         finished_at = CASE WHEN p_next_status IN ('completed','failed','cancelled','expired') THEN now() ELSE finished_at END,
         provider_id = COALESCE(p_provider_id, provider_id),
         model_id = COALESCE(p_model_id, model_id),
         latency_ms = COALESCE(p_latency_ms, latency_ms),
         actual_cost_millicents = COALESCE(p_actual_cost_millicents, actual_cost_millicents),
         error_code = COALESCE(p_error_code, error_code)
   WHERE id = p_request_id AND requester_id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BUSINESS_CONNECT_AI_FORBIDDEN' USING ERRCODE='42501';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.bcai_transition_request(uuid,text,text,text,text,integer,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bcai_transition_request(uuid,text,text,text,text,integer,integer,text)
  TO authenticated, service_role;

-- ============================================================
-- RPC: record result (atomically link canonical)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bcai_record_result(
  p_request_id uuid,
  p_payload jsonb,
  p_meta jsonb,
  p_context_hash text,
  p_source_versions jsonb,
  p_prompt_version text,
  p_policy_version text,
  p_model_policy_class text,
  p_provider_id text,
  p_model_id text,
  p_expires_at timestamptz,
  p_cache_hit boolean
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req record;
  v_res_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'BUSINESS_CONNECT_AI_UNAUTHENTICATED' USING ERRCODE='42501'; END IF;

  SELECT * INTO v_req FROM public.business_connect_ai_requests
   WHERE id = p_request_id AND requester_id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'BUSINESS_CONNECT_AI_FORBIDDEN' USING ERRCODE='42501'; END IF;

  -- If canonical already exists (concurrent winner), return it and do not insert a new canonical.
  IF v_req.canonical_result_id IS NOT NULL THEN
    RETURN v_req.canonical_result_id;
  END IF;

  INSERT INTO public.business_connect_ai_results (
    request_id, tenant_scope_opaque, owner_id, capability, payload, meta,
    context_hash, source_versions, prompt_version, policy_version, model_policy_class,
    provider_id, model_id, is_canonical, expires_at
  ) VALUES (
    p_request_id, v_req.tenant_scope_opaque, v_uid, v_req.capability, p_payload, COALESCE(p_meta,'{}'::jsonb),
    p_context_hash, COALESCE(p_source_versions,'{}'::jsonb), p_prompt_version, p_policy_version, p_model_policy_class,
    p_provider_id, p_model_id, true, p_expires_at
  )
  ON CONFLICT ON CONSTRAINT ux_bcai_res_canonical DO NOTHING
  RETURNING id INTO v_res_id;

  IF v_res_id IS NULL THEN
    -- concurrent race: another writer set canonical first; return theirs
    SELECT id INTO v_res_id FROM public.business_connect_ai_results
     WHERE request_id = p_request_id AND is_canonical LIMIT 1;
  ELSE
    UPDATE public.business_connect_ai_requests
       SET canonical_result_id = v_res_id, cache_hit = p_cache_hit
     WHERE id = p_request_id AND canonical_result_id IS NULL;
  END IF;

  RETURN v_res_id;
END $$;
REVOKE ALL ON FUNCTION public.bcai_record_result(uuid,jsonb,jsonb,text,jsonb,text,text,text,text,text,timestamptz,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bcai_record_result(uuid,jsonb,jsonb,text,jsonb,text,text,text,text,text,timestamptz,boolean)
  TO authenticated, service_role;

-- ============================================================
-- RPC: accept / reject result — owner-scoped, non-mutating on domain
-- ============================================================
CREATE OR REPLACE FUNCTION public.bcai_accept_result(p_result_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'BUSINESS_CONNECT_AI_UNAUTHENTICATED' USING ERRCODE='42501'; END IF;
  UPDATE public.business_connect_ai_results
     SET status = 'accepted', accepted_at = COALESCE(accepted_at, now())
   WHERE id = p_result_id
     AND owner_id = v_uid
     AND status IN ('generated','reviewed');
  IF NOT FOUND THEN
    -- idempotent when already accepted; forbidden when not owner or terminal-other
    IF EXISTS (SELECT 1 FROM public.business_connect_ai_results
                 WHERE id = p_result_id AND owner_id = v_uid AND status = 'accepted') THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'BUSINESS_CONNECT_AI_FORBIDDEN' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.business_connect_ai_result_feedback (result_id, owner_id, tenant_scope_opaque, action)
  SELECT p_result_id, v_uid, tenant_scope_opaque, 'accept'
    FROM public.business_connect_ai_results WHERE id = p_result_id
  ON CONFLICT ON CONSTRAINT bcai_fb_unique DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.bcai_accept_result(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bcai_accept_result(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.bcai_reject_result(p_result_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'BUSINESS_CONNECT_AI_UNAUTHENTICATED' USING ERRCODE='42501'; END IF;
  UPDATE public.business_connect_ai_results
     SET status = 'rejected', rejected_at = COALESCE(rejected_at, now()), rejected_reason = COALESCE(p_reason, rejected_reason)
   WHERE id = p_result_id
     AND owner_id = v_uid
     AND status IN ('generated','reviewed');
  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM public.business_connect_ai_results
                 WHERE id = p_result_id AND owner_id = v_uid AND status = 'rejected') THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'BUSINESS_CONNECT_AI_FORBIDDEN' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.business_connect_ai_result_feedback (result_id, owner_id, tenant_scope_opaque, action, reason)
  SELECT p_result_id, v_uid, tenant_scope_opaque, 'reject', p_reason
    FROM public.business_connect_ai_results WHERE id = p_result_id
  ON CONFLICT ON CONSTRAINT bcai_fb_unique DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.bcai_reject_result(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bcai_reject_result(uuid,text) TO authenticated, service_role;

-- ============================================================
-- RPC: atomic rate-limit increment
-- ============================================================
CREATE OR REPLACE FUNCTION public.bcai_increment_rate(
  p_capability text, p_daily_limit integer
)
RETURNS TABLE (allowed boolean, current_count integer, daily_limit integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_day date := (now() AT TIME ZONE 'utc')::date;
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'BUSINESS_CONNECT_AI_UNAUTHENTICATED' USING ERRCODE='42501'; END IF;

  INSERT INTO public.business_connect_ai_rate_counters (requester_id, capability, window_start_utc, count)
       VALUES (v_uid, p_capability, v_day, 1)
  ON CONFLICT (requester_id, capability, window_start_utc)
  DO UPDATE SET count = public.business_connect_ai_rate_counters.count + 1,
                updated_at = now()
  RETURNING count INTO v_count;

  IF v_count > p_daily_limit THEN
    -- rollback the increment atomically
    UPDATE public.business_connect_ai_rate_counters
       SET count = count - 1
     WHERE requester_id = v_uid AND capability = p_capability AND window_start_utc = v_day;
    RETURN QUERY SELECT false, v_count - 1, p_daily_limit;
  ELSE
    RETURN QUERY SELECT true, v_count, p_daily_limit;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.bcai_increment_rate(text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bcai_increment_rate(text,integer) TO authenticated, service_role;

-- ============================================================
-- RPC: record tool invocation
-- ============================================================
CREATE OR REPLACE FUNCTION public.bcai_record_tool_invocation(
  p_request_id uuid,
  p_tool_name text,
  p_iteration integer,
  p_status text,
  p_input_summary jsonb,
  p_output_summary jsonb,
  p_latency_ms integer,
  p_error_code text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tenant text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'BUSINESS_CONNECT_AI_UNAUTHENTICATED' USING ERRCODE='42501'; END IF;
  SELECT tenant_scope_opaque INTO v_tenant FROM public.business_connect_ai_requests
   WHERE id = p_request_id AND requester_id = v_uid;
  IF v_tenant IS NULL THEN RAISE EXCEPTION 'BUSINESS_CONNECT_AI_FORBIDDEN' USING ERRCODE='42501'; END IF;
  INSERT INTO public.business_connect_ai_tool_invocations
    (request_id, tenant_scope_opaque, owner_id, tool_name, iteration, status,
     input_summary, output_summary, latency_ms, error_code)
  VALUES (p_request_id, v_tenant, v_uid, p_tool_name, p_iteration, p_status,
     COALESCE(p_input_summary,'{}'::jsonb), COALESCE(p_output_summary,'{}'::jsonb),
     p_latency_ms, p_error_code)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.bcai_record_tool_invocation(uuid,text,integer,text,jsonb,jsonb,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bcai_record_tool_invocation(uuid,text,integer,text,jsonb,jsonb,integer,text)
  TO authenticated, service_role;

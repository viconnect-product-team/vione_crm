
-- 1) Fix mutable search_path on our functions
ALTER FUNCTION public._intro_analytics_scopes(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.intro_analytics_confidence_from_snapshot(jsonb) SET search_path = public;
ALTER FUNCTION public.intro_analytics_depth_from_snapshot(jsonb) SET search_path = public;
ALTER FUNCTION public.outcome_event_dispatches_touch() SET search_path = public;
ALTER FUNCTION public.outcome_event_is_supported(text) SET search_path = public;

-- 2) Revoke EXECUTE from anon and PUBLIC on all SECURITY DEFINER functions in public schema.
--    They stay callable by authenticated and service_role.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon;',
                   r.proname, r.args);
  END LOOP;
END $$;

-- 3) Replace always-true INSERT/UPDATE/DELETE/ALL policies.

-- 3a) Service-role-only ALL policies are redundant (service_role bypasses RLS). Drop them.
DROP POLICY IF EXISTS "intro_ops_alerts_service_all" ON public.introduction_ops_alerts;
DROP POLICY IF EXISTS "intro_ops_job_runs_service_all" ON public.introduction_ops_job_runs;
DROP POLICY IF EXISTS "intro_ops_consumer_runs_service_all" ON public.introduction_ops_consumer_runs;
DROP POLICY IF EXISTS "Service role manages embeddings" ON public.business_relationship_memory_embeddings;

-- 3b) Demo requests: keep public submissions but require basic shape validation.
DROP POLICY IF EXISTS "Anyone can submit a demo request" ON public.demo_requests;
CREATE POLICY "Anyone can submit a demo request"
  ON public.demo_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 200
    AND length(btrim(organization)) BETWEEN 1 AND 200
    AND length(btrim(email)) BETWEEN 3 AND 320
    AND position('@' in email) > 1
  );

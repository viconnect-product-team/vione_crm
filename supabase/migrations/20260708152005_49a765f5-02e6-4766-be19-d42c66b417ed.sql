CREATE TABLE public.ai_request_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL,
  user_id UUID,
  association_id UUID,
  capability TEXT,
  permission_level TEXT,
  provider TEXT,
  model TEXT,
  used_fallback BOOLEAN NOT NULL DEFAULT false,
  fallback_reason TEXT,
  provider_latency_ms INTEGER,
  total_latency_ms INTEGER,
  source_types TEXT[] NOT NULL DEFAULT '{}',
  source_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_request_audit_request_id_idx ON public.ai_request_audit (request_id);
CREATE INDEX ai_request_audit_created_at_idx ON public.ai_request_audit (created_at DESC);
CREATE INDEX ai_request_audit_user_id_idx ON public.ai_request_audit (user_id);

GRANT SELECT ON public.ai_request_audit TO authenticated;
GRANT ALL ON public.ai_request_audit TO service_role;

ALTER TABLE public.ai_request_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can read AI audit"
ON public.ai_request_audit FOR SELECT TO authenticated
USING (public.is_platform_admin());
-- 1) Table
CREATE TABLE public.renewal_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('payment', 'idempotent_noop', 'failure')),
  reference TEXT NOT NULL,
  method TEXT,
  amount_paid BIGINT NOT NULL DEFAULT 0,
  invoice_no TEXT,
  previous_term_end DATE,
  new_term_end DATE,
  previous_renewed_at DATE,
  error_code TEXT,
  error_message TEXT,
  user_agent TEXT,
  ip_address TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_renewal_audit_member ON public.renewal_audit_log (member_id, created_at DESC);
CREATE INDEX idx_renewal_audit_assoc ON public.renewal_audit_log (association_id, created_at DESC);
CREATE INDEX idx_renewal_audit_event ON public.renewal_audit_log (event_type, created_at DESC);

-- 2) GRANTs (writes are performed by service_role from the server fn only)
GRANT SELECT ON public.renewal_audit_log TO authenticated;
GRANT ALL ON public.renewal_audit_log TO service_role;

-- 3) RLS
ALTER TABLE public.renewal_audit_log ENABLE ROW LEVEL SECURITY;

-- 4) Policies (SELECT only for end users; writes stay on service_role)
CREATE POLICY "renewal_audit_select_own"
ON public.renewal_audit_log
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_assoc_role(association_id, 'admin'::app_role)
  OR is_platform_admin()
);
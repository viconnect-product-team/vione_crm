CREATE TABLE public.role_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid,
  actor_email text,
  target_user_id uuid,
  target_email text,
  action text NOT NULL,
  old_role text,
  new_role text,
  association_id uuid,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.role_audit_log TO authenticated;
GRANT ALL ON public.role_audit_log TO service_role;

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view role audit log"
ON public.role_audit_log
FOR SELECT
TO authenticated
USING (public.is_platform_admin());

CREATE INDEX idx_role_audit_log_created_at ON public.role_audit_log (created_at DESC);
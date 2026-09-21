CREATE TABLE public.member_account_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id TEXT NOT NULL,
  member_name TEXT,
  action TEXT NOT NULL,
  actor_id UUID,
  actor_email TEXT,
  old_user_id UUID,
  new_user_id UUID,
  target_email TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.member_account_audit TO authenticated;
GRANT ALL ON public.member_account_audit TO service_role;

ALTER TABLE public.member_account_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view member account audit"
  ON public.member_account_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_platform_admin());

CREATE INDEX idx_member_account_audit_member ON public.member_account_audit (member_id, created_at DESC);
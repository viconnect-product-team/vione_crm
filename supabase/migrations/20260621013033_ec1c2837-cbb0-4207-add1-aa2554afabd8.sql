DROP POLICY IF EXISTS member_checkins_insert_auth ON public.member_checkins;
CREATE POLICY member_checkins_insert_admin ON public.member_checkins
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());
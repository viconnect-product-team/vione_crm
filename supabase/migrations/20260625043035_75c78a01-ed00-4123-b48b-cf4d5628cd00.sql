-- 1. messages: remove overly-permissive realtime policies that let any authenticated
--    user read/insert any message. The scoped policies remain and still apply to Realtime.
DROP POLICY IF EXISTS authenticated_can_use_realtime ON public.messages;
DROP POLICY IF EXISTS authenticated_can_send_realtime ON public.messages;

-- 2. email_campaigns: restrict reads to admins / platform admins only (administrative data)
DROP POLICY IF EXISTS email_campaigns_select_auth ON public.email_campaigns;
CREATE POLICY email_campaigns_admin_select ON public.email_campaigns
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());

-- 3. notifications: admins read everything; regular members only see sent broadcasts
DROP POLICY IF EXISTS notifications_select_auth ON public.notifications;
CREATE POLICY notifications_admin_select ON public.notifications
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_platform_admin());
CREATE POLICY notifications_member_sent_select ON public.notifications
  FOR SELECT TO authenticated
  USING (status = 'sent');

-- 4. Remove anon/PUBLIC EXECUTE on all SECURITY DEFINER helper functions.
--    authenticated keeps its explicit grants where required for RLS / RPC.
REVOKE EXECUTE ON FUNCTION public.check_and_increment_sync_rate(text, integer, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_association_id() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_member_id() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_assoc_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_member_of(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_active_association(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_member_code() FROM anon, PUBLIC;
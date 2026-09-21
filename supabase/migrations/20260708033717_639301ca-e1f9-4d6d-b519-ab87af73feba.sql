-- Tighten user_roles writes: only platform_admin may grant/revoke global roles.
-- Removes the over-permissive ALL policy that let any global admin escalate
-- (e.g. self-grant platform_admin). Read paths and platform write paths unchanged.

DROP POLICY IF EXISTS user_roles_admin_write ON public.user_roles;

-- Ensure a platform-only UPDATE policy exists (INSERT/DELETE platform policies already present).
DROP POLICY IF EXISTS user_roles_platform_update ON public.user_roles;
CREATE POLICY user_roles_platform_update ON public.user_roles
  FOR UPDATE TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());
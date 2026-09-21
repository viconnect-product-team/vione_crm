DROP POLICY IF EXISTS "Authenticated can read settings" ON public.app_settings;
CREATE POLICY "Platform admins can read settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (public.is_platform_admin());
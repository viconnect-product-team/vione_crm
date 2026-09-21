CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  );
$$;

-- associations: platform admin full control
CREATE POLICY associations_platform_select ON public.associations
  FOR SELECT TO authenticated USING (public.is_platform_admin());
CREATE POLICY associations_platform_insert ON public.associations
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY associations_platform_update ON public.associations
  FOR UPDATE TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY associations_platform_delete ON public.associations
  FOR DELETE TO authenticated USING (public.is_platform_admin());

-- memberships: platform admin full control
CREATE POLICY memberships_platform_select ON public.memberships
  FOR SELECT TO authenticated USING (public.is_platform_admin());
CREATE POLICY memberships_platform_insert ON public.memberships
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY memberships_platform_update ON public.memberships
  FOR UPDATE TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY memberships_platform_delete ON public.memberships
  FOR DELETE TO authenticated USING (public.is_platform_admin());

-- user_roles: platform admin can view/manage global roles
CREATE POLICY user_roles_platform_select ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_platform_admin());
CREATE POLICY user_roles_platform_insert ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY user_roles_platform_delete ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_platform_admin());

-- Business-card admin permission tiers: full / moderator / viewer.
-- Full admins are derived automatically (platform admins + association admins).
-- moderator/viewer tiers are explicit grants stored per user.
CREATE TABLE public.bc_admin_grants (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bc_admin_grants_level_chk CHECK (level IN ('full','moderator','viewer'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bc_admin_grants TO authenticated;
GRANT ALL ON public.bc_admin_grants TO service_role;

ALTER TABLE public.bc_admin_grants ENABLE ROW LEVEL SECURITY;

-- Resolve a user's effective business-card admin level.
-- Returns 'full' | 'moderator' | 'viewer' | 'none'.
CREATE OR REPLACE FUNCTION public.bc_admin_level(_uid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _uid IS NULL THEN 'none'
    WHEN public.is_platform_admin() THEN 'full'
    WHEN EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = _uid AND role = 'admin'
    ) THEN 'full'
    ELSE COALESCE(
      (SELECT level FROM public.bc_admin_grants WHERE user_id = _uid),
      'none'
    )
  END;
$$;

-- Convenience wrapper for the current user (used by RLS + clients).
CREATE OR REPLACE FUNCTION public.my_bc_admin_level()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.bc_admin_level(auth.uid());
$$;

-- Users can read their own grant; full admins can read/manage all grants.
CREATE POLICY "Read own bc grant" ON public.bc_admin_grants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.bc_admin_level(auth.uid()) = 'full');

CREATE POLICY "Full admins manage bc grants" ON public.bc_admin_grants
  FOR ALL TO authenticated
  USING (public.bc_admin_level(auth.uid()) = 'full')
  WITH CHECK (public.bc_admin_level(auth.uid()) = 'full');

CREATE TRIGGER update_bc_admin_grants_updated_at
  BEFORE UPDATE ON public.bc_admin_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

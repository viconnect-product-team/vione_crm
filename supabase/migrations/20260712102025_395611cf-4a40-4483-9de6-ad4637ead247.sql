
CREATE OR REPLACE FUNCTION public.bc_admin_level(_uid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _uid IS NULL THEN 'none'
    -- Platform admins are always full (they manage grants).
    WHEN public.is_platform_admin() THEN 'full'
    -- An explicit grant restricts (or sets) the level for the user.
    WHEN EXISTS (SELECT 1 FROM public.bc_admin_grants WHERE user_id = _uid)
      THEN (SELECT level FROM public.bc_admin_grants WHERE user_id = _uid)
    -- Association admins default to full when no explicit grant exists.
    WHEN EXISTS (
      SELECT 1 FROM public.memberships WHERE user_id = _uid AND role = 'admin'
    ) THEN 'full'
    ELSE 'none'
  END;
$$;

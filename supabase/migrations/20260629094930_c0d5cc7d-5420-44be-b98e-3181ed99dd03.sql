-- Safe, role-aware peer reader for Networking.
-- Returns only non-sensitive fields for members of the caller's ACTIVE association.
-- Regular members can see peers (base members RLS stays admin-only / self-only).
CREATE OR REPLACE FUNCTION public.list_peers()
RETURNS TABLE (
  id text,
  code text,
  name text,
  type text,
  level text,
  industry text,
  region text,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.code, m.name, m.type::text, m.level::text,
         m.industry::text, m.region::text, m.status::text
  FROM public.members m
  WHERE m.association_id = public.current_association_id()
    AND public.is_member_of(m.association_id)
  ORDER BY m.name ASC;
$$;

REVOKE ALL ON FUNCTION public.list_peers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_peers() TO authenticated;
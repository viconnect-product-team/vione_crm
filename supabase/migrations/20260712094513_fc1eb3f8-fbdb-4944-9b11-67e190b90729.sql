-- Link the signed-in account to a member profile (email must match), safely via security definer.
CREATE OR REPLACE FUNCTION public.list_my_linkable_members()
RETURNS TABLE(
  id text,
  code text,
  name text,
  email text,
  association_id uuid,
  association_name text,
  already_linked boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.code, m.name, m.email, m.association_id, a.name,
         (m.user_id IS NOT NULL) AS already_linked
  FROM public.members m
  JOIN public.associations a ON a.id = m.association_id
  WHERE lower(m.email) = lower((SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
    AND (m.user_id IS NULL OR m.user_id = auth.uid())
  ORDER BY m.name ASC;
$$;

CREATE OR REPLACE FUNCTION public.link_my_member_profile(_member_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _m public.members%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT u.email INTO _email FROM auth.users u WHERE u.id = _uid;
  SELECT * INTO _m FROM public.members WHERE id = _member_id;

  IF _m.id IS NULL THEN RAISE EXCEPTION 'Member not found'; END IF;
  IF _m.user_id IS NOT NULL AND _m.user_id <> _uid THEN
    RAISE EXCEPTION 'Member already linked to another account';
  END IF;
  IF _email IS NULL OR lower(_m.email) <> lower(_email) THEN
    RAISE EXCEPTION 'Email does not match member record';
  END IF;

  -- Ensure the user has a membership in the member's association.
  INSERT INTO public.memberships (user_id, association_id, role, is_default)
  VALUES (_uid, _m.association_id, 'member', false)
  ON CONFLICT (user_id, association_id) DO NOTHING;

  UPDATE public.members SET user_id = _uid, updated_at = now() WHERE id = _member_id;

  -- Make this association active so current_member_id() resolves to it.
  UPDATE public.memberships
  SET is_default = (association_id = _m.association_id)
  WHERE user_id = _uid;

  RETURN _member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unlink_my_member_profile(_member_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.members SET user_id = NULL, updated_at = now()
  WHERE id = _member_id AND user_id = _uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_linkable_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_my_member_profile(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlink_my_member_profile(text) TO authenticated;
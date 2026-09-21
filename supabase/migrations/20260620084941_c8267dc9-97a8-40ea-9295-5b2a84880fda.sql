CREATE OR REPLACE FUNCTION public.set_active_association(_association_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_member_of(_association_id) THEN
    RAISE EXCEPTION 'Not a member of this association';
  END IF;

  UPDATE public.memberships
  SET is_default = (association_id = _association_id)
  WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_active_association(uuid) TO authenticated;
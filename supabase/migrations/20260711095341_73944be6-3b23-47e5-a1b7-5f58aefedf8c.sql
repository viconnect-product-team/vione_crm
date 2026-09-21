CREATE OR REPLACE FUNCTION public.validate_business_card()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $func$
BEGIN
  IF NEW.status NOT IN ('draft','published','hidden','suspended','archived') THEN
    RAISE EXCEPTION 'Invalid card status';
  END IF;
  IF NEW.public_mode NOT IN ('public','members_only','private') THEN
    RAISE EXCEPTION 'Invalid public_mode';
  END IF;
  IF NEW.card_kind NOT IN ('primary','secondary') THEN
    RAISE EXCEPTION 'Invalid card_kind';
  END IF;
  NEW.slug := trim(both '-' from lower(regexp_replace(coalesce(NEW.slug,''), '[^a-zA-Z0-9-]+', '-', 'g')));
  IF NEW.slug = '' THEN RAISE EXCEPTION 'Slug cannot be empty'; END IF;
  RETURN NEW;
END $func$;

CREATE TRIGGER trg_business_card_validate
  BEFORE INSERT OR UPDATE ON public.member_business_cards
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_card();

CREATE OR REPLACE FUNCTION public.owns_business_card(_card_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.member_business_cards c
    WHERE c.id = _card_id AND c.member_id = public.current_member_id()
  );
$func$;

CREATE OR REPLACE FUNCTION public.manages_business_card(_card_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.member_business_cards c
    WHERE c.id = _card_id AND public.is_assoc_manager(c.association_id)
  );
$func$;

REVOKE EXECUTE ON FUNCTION public.owns_business_card(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.manages_business_card(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.owns_business_card(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.manages_business_card(uuid) TO authenticated, service_role;
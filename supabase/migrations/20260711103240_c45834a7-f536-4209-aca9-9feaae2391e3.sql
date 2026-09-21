CREATE OR REPLACE FUNCTION public.is_public_business_card(_card_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_business_cards c
    WHERE c.id = _card_id
      AND c.status = 'published'
      AND c.public_mode = 'public'
  )
$$;

REVOKE ALL ON FUNCTION public.is_public_business_card(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_business_card(uuid) TO anon, authenticated;

GRANT SELECT ON public.member_business_cards TO anon;
CREATE POLICY "Public reads published public cards"
ON public.member_business_cards
FOR SELECT
TO anon, authenticated
USING (status = 'published' AND public_mode = 'public');

GRANT SELECT ON public.business_card_skills TO anon;
CREATE POLICY "Public reads skills of public cards"
ON public.business_card_skills
FOR SELECT
TO anon, authenticated
USING (public.is_public_business_card(card_id));

GRANT SELECT ON public.business_card_services TO anon;
CREATE POLICY "Public reads services of public cards"
ON public.business_card_services
FOR SELECT
TO anon, authenticated
USING (public.is_public_business_card(card_id));

GRANT SELECT ON public.business_card_needs TO anon;
CREATE POLICY "Public reads needs of public cards"
ON public.business_card_needs
FOR SELECT
TO anon, authenticated
USING (public.is_public_business_card(card_id));
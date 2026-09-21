REVOKE EXECUTE ON FUNCTION public.owns_business_card(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.manages_business_card(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.validate_business_card() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.validate_business_card_interaction() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.validate_business_card_lead() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.owns_business_card(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manages_business_card(uuid) TO authenticated;
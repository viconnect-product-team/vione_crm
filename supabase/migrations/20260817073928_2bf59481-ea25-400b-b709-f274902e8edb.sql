ALTER TABLE public.business_identity_showcase_items
  DROP CONSTRAINT IF EXISTS business_identity_showcase_items_kind_check;
ALTER TABLE public.business_identity_showcase_items
  ADD CONSTRAINT business_identity_showcase_items_kind_check
  CHECK (kind = ANY (ARRAY['business_area','client','metric','interest','client_metric']));
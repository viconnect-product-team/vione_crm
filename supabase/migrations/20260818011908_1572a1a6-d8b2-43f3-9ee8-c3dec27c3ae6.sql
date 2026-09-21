ALTER TABLE public.guest_contacts DROP CONSTRAINT guest_contacts_source_xor;
ALTER TABLE public.guest_contacts ADD CONSTRAINT guest_contacts_source_xor CHECK (
  (source = 'business_card_scan' AND num_nonnulls(source_card_id, source_identity_id) = 0)
  OR (source <> 'business_card_scan' AND num_nonnulls(source_card_id, source_identity_id) = 1)
);
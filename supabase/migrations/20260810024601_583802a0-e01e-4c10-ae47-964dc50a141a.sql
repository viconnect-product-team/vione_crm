ALTER TABLE public.guest_contacts ALTER COLUMN source_card_id DROP NOT NULL;

ALTER TABLE public.guest_contacts
  ADD COLUMN IF NOT EXISTS source_identity_id uuid REFERENCES public.business_identities(id) ON DELETE CASCADE;

ALTER TABLE public.guest_contacts DROP CONSTRAINT IF EXISTS guest_contacts_source_xor;
ALTER TABLE public.guest_contacts ADD CONSTRAINT guest_contacts_source_xor
  CHECK (num_nonnulls(source_card_id, source_identity_id) = 1);

CREATE UNIQUE INDEX IF NOT EXISTS guest_contacts_identity_token_uq
  ON public.guest_contacts (source_identity_id, client_token)
  WHERE source_identity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS guest_contacts_identity_idx
  ON public.guest_contacts (source_identity_id)
  WHERE source_identity_id IS NOT NULL;
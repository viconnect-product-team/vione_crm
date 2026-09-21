ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS public_card_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_card_requires_active_member boolean NOT NULL DEFAULT true;
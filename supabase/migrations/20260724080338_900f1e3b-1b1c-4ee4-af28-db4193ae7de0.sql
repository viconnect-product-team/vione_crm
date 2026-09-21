ALTER TABLE public.member_business_cards
  ADD COLUMN IF NOT EXISTS display_name_en TEXT,
  ADD COLUMN IF NOT EXISTS professional_title_en TEXT,
  ADD COLUMN IF NOT EXISTS company_name_en TEXT,
  ADD COLUMN IF NOT EXISTS headline_en TEXT,
  ADD COLUMN IF NOT EXISTS bio_en TEXT;
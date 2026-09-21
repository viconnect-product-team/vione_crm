ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS brand_primary text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS about text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS landing_published boolean NOT NULL DEFAULT false;

-- Public can read only published associations (used to render per-association landing pages)
DROP POLICY IF EXISTS "Public can view published associations" ON public.associations;
CREATE POLICY "Public can view published associations"
ON public.associations
FOR SELECT
TO anon
USING (landing_published = true);

GRANT SELECT ON public.associations TO anon;
-- Add banner_url to associations table for community custom background / cover image
ALTER TABLE public.associations ADD COLUMN IF NOT EXISTS banner_url text;

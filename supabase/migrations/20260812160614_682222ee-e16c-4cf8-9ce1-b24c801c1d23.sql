ALTER TABLE public.opportunity_interests
  ADD COLUMN IF NOT EXISTS interest_level text NOT NULL DEFAULT 'high';

ALTER TABLE public.opportunity_interests
  DROP CONSTRAINT IF EXISTS opportunity_interests_interest_level_check;

ALTER TABLE public.opportunity_interests
  ADD CONSTRAINT opportunity_interests_interest_level_check
  CHECK (interest_level IN ('high','low'));
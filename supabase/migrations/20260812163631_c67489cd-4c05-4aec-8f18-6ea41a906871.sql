ALTER TABLE public.community_opportunity_followups
  ALTER COLUMN remind_at DROP NOT NULL;

ALTER TABLE public.community_opportunity_followups
  ADD COLUMN IF NOT EXISTS progress TEXT NOT NULL DEFAULT 'planned'
    CHECK (progress IN ('planned','messaged','replied','closed'));
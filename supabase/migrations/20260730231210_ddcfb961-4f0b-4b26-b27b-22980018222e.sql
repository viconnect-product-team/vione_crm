ALTER TABLE public.demo_requests
  ADD COLUMN IF NOT EXISTS cta_source text,
  ADD COLUMN IF NOT EXISTS cta_intent text;

CREATE INDEX IF NOT EXISTS demo_requests_cta_source_idx ON public.demo_requests (cta_source);
CREATE INDEX IF NOT EXISTS demo_requests_created_at_idx ON public.demo_requests (created_at DESC);
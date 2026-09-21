CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id text NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  reviewer_id text NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL DEFAULT '',
  rating integer NOT NULL,
  comment text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_seller_id ON public.reviews(seller_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (true);
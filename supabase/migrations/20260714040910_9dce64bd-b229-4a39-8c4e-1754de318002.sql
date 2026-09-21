-- BC-3.0 Saved Business Cards Platform: Collections + organization fields.

-- 1) Collections table (owner-scoped groupings of saved cards).
CREATE TABLE public.saved_card_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'custom',
  color TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_card_collections TO authenticated;
GRANT ALL ON public.saved_card_collections TO service_role;

ALTER TABLE public.saved_card_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their own collections"
  ON public.saved_card_collections FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_saved_card_collections_updated_at
  BEFORE UPDATE ON public.saved_card_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Organization fields on the saved-card edge (additive; RLS unchanged).
ALTER TABLE public.saved_business_cards
  ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.saved_card_collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_opened TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_saved_business_cards_collection
  ON public.saved_business_cards (owner_user_id, collection_id);
CREATE INDEX IF NOT EXISTS idx_saved_business_cards_archived
  ON public.saved_business_cards (owner_user_id, archived);
-- BC-3.0 Saved Business Cards Foundation — additive alignment.
-- Extends existing saved_business_cards / saved_card_collections and adds the
-- canonical normalized tag tables + source contract. Additive & migration-safe.

-- 1) Source contract (validated text via CHECK; keeps existing text column).
ALTER TABLE public.saved_business_cards
  ADD COLUMN IF NOT EXISTS source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS open_count bigint NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saved_business_cards_source_contract'
  ) THEN
    UPDATE public.saved_business_cards
      SET source = 'unknown'
      WHERE source IS NULL OR source NOT IN (
        'public_card','share_link','qr','nfc','wallet','association',
        'business_connect','manual_url','internal','unknown',
        'profile','url','import'
      );
    ALTER TABLE public.saved_business_cards
      ADD CONSTRAINT saved_business_cards_source_contract
      CHECK (source IN (
        'public_card','share_link','qr','nfc','wallet','association',
        'business_connect','manual_url','internal','unknown',
        'profile','url','import'
      )) NOT VALID;
    ALTER TABLE public.saved_business_cards
      VALIDATE CONSTRAINT saved_business_cards_source_contract;
  END IF;
END $$;

-- 2) Collection canonical columns (additive).
ALTER TABLE public.saved_card_collections
  ADD COLUMN IF NOT EXISTS normalized_name text,
  ADD COLUMN IF NOT EXISTS system_key text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

UPDATE public.saved_card_collections
  SET normalized_name = lower(btrim(name))
  WHERE normalized_name IS NULL;
UPDATE public.saved_card_collections
  SET system_key = slug
  WHERE is_system = true AND system_key IS NULL;
UPDATE public.saved_card_collections
  SET sort_order = position
  WHERE sort_order = 0 AND position <> 0;

ALTER TABLE public.saved_card_collections
  ALTER COLUMN normalized_name SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_card_collections_owner_norm_active
  ON public.saved_card_collections (owner_user_id, normalized_name)
  WHERE archived_at IS NULL;

-- 3) Normalized user-private tag catalog.
CREATE TABLE IF NOT EXISTS public.saved_card_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  normalized_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, normalized_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_card_tags TO authenticated;
GRANT ALL ON public.saved_card_tags TO service_role;
ALTER TABLE public.saved_card_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner selects own tags" ON public.saved_card_tags
  FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "Owner inserts own tags" ON public.saved_card_tags
  FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Owner updates own tags" ON public.saved_card_tags
  FOR UPDATE TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Owner deletes own tags" ON public.saved_card_tags
  FOR DELETE TO authenticated USING (owner_user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_saved_card_tags_owner ON public.saved_card_tags (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_card_tags_norm ON public.saved_card_tags (normalized_name);

-- 4) Saved-card <-> tag junction (owner integrity enforced by RLS).
CREATE TABLE IF NOT EXISTS public.saved_business_card_tags (
  saved_card_id uuid NOT NULL REFERENCES public.saved_business_cards(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.saved_card_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (saved_card_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_business_card_tags TO authenticated;
GRANT ALL ON public.saved_business_card_tags TO service_role;
ALTER TABLE public.saved_business_card_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner selects own card-tag links" ON public.saved_business_card_tags
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.saved_business_cards s
            WHERE s.id = saved_card_id AND s.owner_user_id = auth.uid())
  );
CREATE POLICY "Owner inserts own card-tag links" ON public.saved_business_card_tags
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.saved_business_cards s
            WHERE s.id = saved_card_id AND s.owner_user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.saved_card_tags t
            WHERE t.id = tag_id AND t.owner_user_id = auth.uid())
  );
CREATE POLICY "Owner deletes own card-tag links" ON public.saved_business_card_tags
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.saved_business_cards s
            WHERE s.id = saved_card_id AND s.owner_user_id = auth.uid())
  );
CREATE INDEX IF NOT EXISTS idx_sbc_tags_tag ON public.saved_business_card_tags (tag_id);

-- 5) Cross-owner collection guard.
CREATE OR REPLACE FUNCTION public.sc_guard_collection_owner()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.collection_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.saved_card_collections c
      WHERE c.id = NEW.collection_id AND c.owner_user_id = NEW.owner_user_id
    ) THEN
      RAISE EXCEPTION 'SC_COLLECTION_OWNER_MISMATCH';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sc_guard_collection_owner ON public.saved_business_cards;
CREATE TRIGGER trg_sc_guard_collection_owner
  BEFORE INSERT OR UPDATE OF collection_id, owner_user_id ON public.saved_business_cards
  FOR EACH ROW EXECUTE FUNCTION public.sc_guard_collection_owner();

-- 6) Performance indexes for canonical read paths.
CREATE INDEX IF NOT EXISTS idx_sbc_owner_open_count
  ON public.saved_business_cards (owner_user_id, open_count DESC);
CREATE INDEX IF NOT EXISTS idx_sbc_owner_last_opened
  ON public.saved_business_cards (owner_user_id, last_opened DESC);
CREATE INDEX IF NOT EXISTS idx_sbc_owner_saved_at
  ON public.saved_business_cards (owner_user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_sbc_target_card_id
  ON public.saved_business_cards (target_card_id);

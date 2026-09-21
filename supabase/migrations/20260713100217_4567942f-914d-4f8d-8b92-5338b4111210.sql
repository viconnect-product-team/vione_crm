-- BC-2.4 — Saved Business Cards & Relationship Foundation.
-- First layer of the Business Relationship Graph. Stores a RELATIONSHIP EDGE
-- (owner -> target card) plus owner-only private metadata. It NEVER duplicates
-- or snapshots profile data; the profile is always read live via the card id.

CREATE TABLE public.saved_business_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_card_id uuid NOT NULL REFERENCES public.member_business_cards(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  favorite boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  notes text,
  -- Owner-only private relationship metadata (future graph foundation).
  first_met_at date,
  met_at text,
  reminder_at timestamptz,
  -- How the relationship was created: profile | qr | nfc | url | import.
  source text NOT NULL DEFAULT 'profile',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, target_card_id)
);

CREATE INDEX sbc_owner_idx ON public.saved_business_cards (owner_user_id, saved_at DESC);
CREATE INDEX sbc_owner_favorite_idx ON public.saved_business_cards (owner_user_id, favorite) WHERE favorite = true;
CREATE INDEX sbc_target_idx ON public.saved_business_cards (target_card_id);
CREATE INDEX sbc_tags_idx ON public.saved_business_cards USING gin (tags);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_business_cards TO authenticated;
GRANT ALL ON public.saved_business_cards TO service_role;

ALTER TABLE public.saved_business_cards ENABLE ROW LEVEL SECURITY;

-- Owner-only: the relationship (and all its private metadata) is visible and
-- mutable ONLY by the user who created it. No anon, no cross-user, no cross-tenant.
CREATE POLICY "Owners read their saved cards"
  ON public.saved_business_cards FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners create their saved cards"
  ON public.saved_business_cards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners update their saved cards"
  ON public.saved_business_cards FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners delete their saved cards"
  ON public.saved_business_cards FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id);

-- Validate source values with a trigger (avoids an immutable CHECK on evolving vocab).
CREATE OR REPLACE FUNCTION public.validate_saved_business_card()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.source NOT IN ('profile','qr','nfc','url','import') THEN
    RAISE EXCEPTION 'Invalid saved card source: %', NEW.source;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_saved_business_card_trg
  BEFORE INSERT OR UPDATE ON public.saved_business_cards
  FOR EACH ROW EXECUTE FUNCTION public.validate_saved_business_card();

CREATE TRIGGER update_saved_business_cards_updated_at
  BEFORE UPDATE ON public.saved_business_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
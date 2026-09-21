-- BC-2.5 — Relationship Intelligence Engine.
-- Additive only. Extends saved_business_cards with private intelligence
-- metadata + timeline timestamps, and adds an owner-scoped relationship_events
-- history table. No profile data is duplicated; targets still resolve live.

-- 1) Timeline + intelligence metadata on the relationship edge (all private).
ALTER TABLE public.saved_business_cards
  ADD COLUMN IF NOT EXISTS last_viewed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_scan_at    timestamptz,
  ADD COLUMN IF NOT EXISTS company         text,
  ADD COLUMN IF NOT EXISTS industry        text,
  ADD COLUMN IF NOT EXISTS interest        text,
  ADD COLUMN IF NOT EXISTS meeting_place   text,
  ADD COLUMN IF NOT EXISTS event           text,
  ADD COLUMN IF NOT EXISTS referral        text,
  ADD COLUMN IF NOT EXISTS importance      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labels          text[]  NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS color           text,
  ADD COLUMN IF NOT EXISTS priority        text,
  ADD COLUMN IF NOT EXISTS birthday        date,
  ADD COLUMN IF NOT EXISTS anniversary     date;

-- 2) Relationship history / timeline events (append-only, owner-scoped).
CREATE TABLE IF NOT EXISTS public.relationship_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_card_id uuid NOT NULL REFERENCES public.member_business_cards(id) ON DELETE CASCADE,
  event_type     text NOT NULL,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rel_events_owner_target_idx
  ON public.relationship_events (owner_user_id, target_card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rel_events_owner_created_idx
  ON public.relationship_events (owner_user_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.relationship_events TO authenticated;
GRANT ALL ON public.relationship_events TO service_role;

ALTER TABLE public.relationship_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their relationship events"
  ON public.relationship_events FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "Owners append their relationship events"
  ON public.relationship_events FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owners delete their relationship events"
  ON public.relationship_events FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());

-- 3) Validate event_type via trigger (avoids brittle CHECK constraints).
CREATE OR REPLACE FUNCTION public.validate_relationship_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type NOT IN (
    'saved','viewed','shared','contact','scan','meeting','wallet',
    'qr','nfc','tag_updated','favorite','note_edited','metadata_updated'
  ) THEN
    RAISE EXCEPTION 'Invalid relationship event type: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_relationship_event
  BEFORE INSERT ON public.relationship_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_relationship_event();
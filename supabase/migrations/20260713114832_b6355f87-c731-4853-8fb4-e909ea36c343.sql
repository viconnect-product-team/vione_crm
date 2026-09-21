CREATE TABLE public.business_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_id uuid NOT NULL REFERENCES public.saved_business_cards(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  title text,
  note text,
  location text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_interactions_owner ON public.business_interactions (owner_user_id);
CREATE INDEX idx_business_interactions_relationship ON public.business_interactions (relationship_id, occurred_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_interactions TO authenticated;
GRANT ALL ON public.business_interactions TO service_role;

ALTER TABLE public.business_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their own interactions"
  ON public.business_interactions FOR ALL
  TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE OR REPLACE FUNCTION public.validate_business_interaction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.interaction_type NOT IN (
    'meeting','call','email','qr_scan','nfc_tap','wallet_save','website_visit',
    'referral','business_lunch','conference','event','demo','proposal',
    'contract','follow_up','other'
  ) THEN
    RAISE EXCEPTION 'Invalid interaction_type: %', NEW.interaction_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_business_interaction_trigger
  BEFORE INSERT OR UPDATE ON public.business_interactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_interaction();

CREATE TRIGGER update_business_interactions_updated_at
  BEFORE UPDATE ON public.business_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
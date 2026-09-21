CREATE OR REPLACE FUNCTION public.validate_business_card_interaction()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $func$
BEGIN
  IF NEW.interaction_type NOT IN (
    'view','unique_view','share','save_contact','call','email','website',
    'connect','message','meeting','appointment','marketplace_open',
    'opportunity_open','product_click','service_click','need_click',
    'social_click','qr_scan','nfc_open','lead','report'
  ) THEN
    RAISE EXCEPTION 'Invalid interaction_type';
  END IF;
  RETURN NEW;
END $func$;

CREATE OR REPLACE FUNCTION public.validate_business_card_lead()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $func$
BEGIN
  IF NEW.lead_type NOT IN ('contact','meeting','product','partnership','other') THEN
    RAISE EXCEPTION 'Invalid lead_type';
  END IF;
  IF NEW.status NOT IN ('new','contacted','qualified','closed','archived') THEN
    RAISE EXCEPTION 'Invalid lead status';
  END IF;
  RETURN NEW;
END $func$;

CREATE TABLE public.business_card_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.member_business_cards(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  viewer_member_id text,
  viewer_user_id uuid,
  session_hash text,
  source text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_card_interactions_card_idx ON public.business_card_interactions (card_id, created_at);
GRANT SELECT ON public.business_card_interactions TO authenticated;
GRANT ALL ON public.business_card_interactions TO service_role;
ALTER TABLE public.business_card_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interactions owner read" ON public.business_card_interactions
  FOR SELECT TO authenticated
  USING (public.owns_business_card(card_id) OR public.manages_business_card(card_id));
CREATE TRIGGER trg_business_card_interaction_validate
  BEFORE INSERT OR UPDATE ON public.business_card_interactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_card_interaction();

CREATE TABLE public.business_card_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.member_business_cards(id) ON DELETE CASCADE,
  owner_member_id text NOT NULL,
  requester_member_id text,
  requester_name text NOT NULL,
  requester_email text,
  requester_phone text,
  message text,
  lead_type text NOT NULL DEFAULT 'contact',
  status text NOT NULL DEFAULT 'new',
  preferred_time timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_card_leads_card_idx ON public.business_card_leads (card_id);
CREATE INDEX business_card_leads_owner_idx ON public.business_card_leads (owner_member_id);
GRANT SELECT, UPDATE ON public.business_card_leads TO authenticated;
GRANT ALL ON public.business_card_leads TO service_role;
ALTER TABLE public.business_card_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leads owner read" ON public.business_card_leads
  FOR SELECT TO authenticated
  USING (owner_member_id = public.current_member_id()
         OR requester_member_id = public.current_member_id()
         OR public.is_assoc_manager(association_id));
CREATE POLICY "Leads owner update" ON public.business_card_leads
  FOR UPDATE TO authenticated
  USING (owner_member_id = public.current_member_id() OR public.is_assoc_manager(association_id))
  WITH CHECK (owner_member_id = public.current_member_id() OR public.is_assoc_manager(association_id));
CREATE TRIGGER trg_business_card_lead_validate
  BEFORE INSERT OR UPDATE ON public.business_card_leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_card_lead();
CREATE TRIGGER trg_business_card_lead_updated
  BEFORE UPDATE ON public.business_card_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.business_card_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  card_id uuid REFERENCES public.member_business_cards(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  actor_user_id uuid,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_card_audit_card_idx ON public.business_card_audit (card_id);
GRANT SELECT ON public.business_card_audit TO authenticated;
GRANT ALL ON public.business_card_audit TO service_role;
ALTER TABLE public.business_card_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit owner or manager read" ON public.business_card_audit
  FOR SELECT TO authenticated
  USING (
    public.is_assoc_manager(association_id)
    OR (card_id IS NOT NULL AND public.owns_business_card(card_id))
  );
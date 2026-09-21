CREATE TABLE public.business_card_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.member_business_cards(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_card_skills_card_idx ON public.business_card_skills (card_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_card_skills TO authenticated;
GRANT ALL ON public.business_card_skills TO service_role;
ALTER TABLE public.business_card_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills owner all" ON public.business_card_skills
  FOR ALL TO authenticated
  USING (public.owns_business_card(card_id))
  WITH CHECK (public.owns_business_card(card_id));
CREATE POLICY "Skills manager read" ON public.business_card_skills
  FOR SELECT TO authenticated USING (public.manages_business_card(card_id));

CREATE TABLE public.business_card_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.member_business_cards(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  link_url text,
  product_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_card_services_card_idx ON public.business_card_services (card_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_card_services TO authenticated;
GRANT ALL ON public.business_card_services TO service_role;
ALTER TABLE public.business_card_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services owner all" ON public.business_card_services
  FOR ALL TO authenticated
  USING (public.owns_business_card(card_id))
  WITH CHECK (public.owns_business_card(card_id));
CREATE POLICY "Services manager read" ON public.business_card_services
  FOR SELECT TO authenticated USING (public.manages_business_card(card_id));

CREATE TABLE public.business_card_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.member_business_cards(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_card_needs_card_idx ON public.business_card_needs (card_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_card_needs TO authenticated;
GRANT ALL ON public.business_card_needs TO service_role;
ALTER TABLE public.business_card_needs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Needs owner all" ON public.business_card_needs
  FOR ALL TO authenticated
  USING (public.owns_business_card(card_id))
  WITH CHECK (public.owns_business_card(card_id));
CREATE POLICY "Needs manager read" ON public.business_card_needs
  FOR SELECT TO authenticated USING (public.manages_business_card(card_id));
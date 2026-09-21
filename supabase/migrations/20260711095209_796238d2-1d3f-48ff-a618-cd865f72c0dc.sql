CREATE TABLE public.member_business_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  member_id text NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_business_cards TO authenticated;
GRANT ALL ON public.member_business_cards TO service_role;
ALTER TABLE public.member_business_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own cards" ON public.member_business_cards
  FOR SELECT TO authenticated USING (member_id = public.current_member_id());
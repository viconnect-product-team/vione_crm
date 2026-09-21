CREATE TABLE public.business_identity_showcase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('business_area','client')),
  title text NOT NULL,
  subtitle text,
  logo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_identity_showcase_items TO authenticated;
GRANT ALL ON public.business_identity_showcase_items TO service_role;

ALTER TABLE public.business_identity_showcase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages own showcase items"
ON public.business_identity_showcase_items FOR ALL TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE INDEX idx_bis_owner_kind ON public.business_identity_showcase_items (owner_user_id, kind, sort_order);

CREATE TRIGGER update_bis_updated_at BEFORE UPDATE ON public.business_identity_showcase_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
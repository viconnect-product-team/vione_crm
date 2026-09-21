CREATE TABLE public.bc_customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  normalized_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, normalized_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bc_customer_tags TO authenticated;
GRANT ALL ON public.bc_customer_tags TO service_role;

ALTER TABLE public.bc_customer_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their customer tags"
ON public.bc_customer_tags FOR ALL TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE TRIGGER bc_customer_tags_touch
BEFORE UPDATE ON public.bc_customer_tags
FOR EACH ROW EXECUTE FUNCTION public.bc5a_touch_updated_at();

CREATE TABLE public.bc_customer_tag_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.bc_customers(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.bc_customer_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, tag_id)
);

CREATE INDEX bc_customer_tag_links_owner_idx ON public.bc_customer_tag_links (owner_user_id);
CREATE INDEX bc_customer_tag_links_tag_idx ON public.bc_customer_tag_links (tag_id);

GRANT SELECT, INSERT, DELETE ON public.bc_customer_tag_links TO authenticated;
GRANT ALL ON public.bc_customer_tag_links TO service_role;

ALTER TABLE public.bc_customer_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their customer tag links"
ON public.bc_customer_tag_links FOR ALL TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);
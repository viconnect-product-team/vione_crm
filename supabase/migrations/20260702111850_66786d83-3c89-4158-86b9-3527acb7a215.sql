CREATE TABLE public.association_benefits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  desc_vi TEXT NOT NULL DEFAULT '',
  desc_en TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.association_benefits TO authenticated;
GRANT ALL ON public.association_benefits TO service_role;

ALTER TABLE public.association_benefits ENABLE ROW LEVEL SECURITY;

-- Members of the association can view its benefits
CREATE POLICY "Members can view association benefits"
ON public.association_benefits FOR SELECT
TO authenticated
USING (public.is_member_of(association_id));

-- Association admins / platform admins can manage benefits
CREATE POLICY "Assoc admins manage benefits"
ON public.association_benefits FOR ALL
TO authenticated
USING (public.has_assoc_role(association_id, 'admin') OR public.is_platform_admin())
WITH CHECK (public.has_assoc_role(association_id, 'admin') OR public.is_platform_admin());

CREATE INDEX idx_association_benefits_assoc ON public.association_benefits(association_id, sort_order);

CREATE TRIGGER update_association_benefits_updated_at
BEFORE UPDATE ON public.association_benefits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default benefits for existing associations
INSERT INTO public.association_benefits (association_id, title_vi, title_en, desc_vi, desc_en, sort_order)
SELECT a.id, x.title_vi, x.title_en, x.desc_vi, x.desc_en, x.sort_order
FROM public.associations a
CROSS JOIN (VALUES
  ('Tham dự sự kiện', 'Event access', 'miễn phí & ưu đãi', 'free & discounted', 0),
  ('Kết nối hơn', 'Networking', '1000+ doanh nghiệp', '1000+ businesses', 1),
  ('Quảng bá thương hiệu', 'Brand promotion', 'trên kênh Hiệp hội', 'on association channels', 2)
) AS x(title_vi, title_en, desc_vi, desc_en, sort_order);
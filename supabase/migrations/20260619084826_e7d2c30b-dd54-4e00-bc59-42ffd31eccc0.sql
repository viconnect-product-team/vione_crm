CREATE TABLE public.perks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text,
  partner text,
  summary text,
  description text,
  discount text,
  icon text,
  link text,
  valid_until date,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perks TO authenticated;
GRANT ALL ON public.perks TO service_role;

ALTER TABLE public.perks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active perks"
ON public.perks FOR SELECT TO authenticated
USING (status = 'active');

CREATE POLICY "Admins manage perks"
ON public.perks FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_perks_updated_at
BEFORE UPDATE ON public.perks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.perks (title, category, partner, summary, description, discount, icon, link, sort_order) VALUES
('Ưu đãi phòng họp cao cấp', 'Văn phòng', 'UNICOM Office', 'Giảm 20% chi phí thuê phòng họp cho hội viên.', 'Hội viên được giảm 20% khi đặt phòng họp tại hệ thống UNICOM Office trên toàn quốc. Áp dụng cho tất cả các gói thuê theo giờ và theo ngày. Xuất trình thẻ hội viên khi thanh toán.', '-20%', 'Briefcase', 'https://unicom.vn', 1),
('Tư vấn pháp lý miễn phí', 'Pháp lý', 'Luật UNI', 'Miễn phí 2 giờ tư vấn pháp lý doanh nghiệp mỗi tháng.', 'Mỗi hội viên được hưởng 2 giờ tư vấn pháp lý miễn phí hàng tháng về hợp đồng, lao động, thuế và sở hữu trí tuệ. Đặt lịch trước tối thiểu 24 giờ.', 'Miễn phí', 'Scale', 'https://unicom.vn', 2),
('Gói phần mềm kế toán', 'Công nghệ', 'UNI Soft', 'Giảm 30% năm đầu khi đăng ký phần mềm kế toán.', 'Áp dụng cho hội viên đăng ký mới phần mềm kế toán UNI Soft. Giảm 30% phí thuê bao năm đầu tiên, hỗ trợ cài đặt và đào tạo miễn phí.', '-30%', 'Calculator', 'https://unicom.vn', 3),
('Ưu đãi khách sạn đối tác', 'Du lịch', 'UNI Travel', 'Giá phòng ưu đãi tại hệ thống khách sạn đối tác.', 'Hội viên nhận mức giá ưu đãi đặc biệt khi đặt phòng tại các khách sạn đối tác của hiệp hội. Hỗ trợ đặt phòng nhanh qua tổng đài.', '-15%', 'Hotel', 'https://unicom.vn', 4);
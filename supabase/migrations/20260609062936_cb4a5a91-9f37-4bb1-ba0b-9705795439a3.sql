CREATE TABLE public.opportunities (
  id TEXT NOT NULL PRIMARY KEY,
  poster_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  budget_min BIGINT,
  budget_max BIGINT,
  region TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  views INTEGER NOT NULL DEFAULT 0,
  emoji TEXT NOT NULL DEFAULT '💡',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Opportunities are viewable by everyone" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage opportunities" ON public.opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.opportunity_interests (
  id TEXT NOT NULL PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.opportunity_interests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_interests TO authenticated;
GRANT ALL ON public.opportunity_interests TO service_role;

ALTER TABLE public.opportunity_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interests are viewable by everyone" ON public.opportunity_interests FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage interests" ON public.opportunity_interests FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.opportunities (id, poster_id, title, description, type, budget_min, budget_max, region, industry, deadline, status, views, emoji, created_at) VALUES
  ('o-1', 'vba-0002', 'Tìm đối tác phân phối nông sản hữu cơ tại miền Bắc', 'Doanh nghiệp đang mở rộng kênh phân phối nông sản hữu cơ đạt chuẩn VietGAP. Tìm đối tác có hệ thống siêu thị, cửa hàng tiện lợi tại Hà Nội và các tỉnh phía Bắc. Cam kết nguồn cung ổn định, chiết khấu hấp dẫn cho hội viên.', 'opp.type.distribution', 500000000, 2000000000, 'Miền Bắc', 'Nông nghiệp - Thực phẩm', now() + interval '30 days', 'open', 124, '🌱', now() - interval '2 days'),
  ('o-2', 'vba-0003', 'Kêu gọi đầu tư dự án Logistics thông minh', 'Dự án nền tảng quản lý chuỗi cung ứng ứng dụng AI/IoT, đã có MVP và 3 khách hàng doanh nghiệp lớn. Cần huy động vòng Series A để mở rộng thị trường Đông Nam Á. Ưu tiên hội viên hiệp hội tham gia với điều khoản đặc biệt.', 'opp.type.investment', 5000000000, 20000000000, 'Toàn quốc', 'Công nghệ - Logistics', now() + interval '60 days', 'open', 312, '🚀', now() - interval '5 days'),
  ('o-3', 'vba-0004', 'Cần nhà cung cấp linh kiện cơ khí CNC số lượng lớn', 'Doanh nghiệp sản xuất thiết bị công nghiệp cần đối tác cung ứng linh kiện CNC độ chính xác cao, đơn hàng định kỳ hàng tháng. Ưu tiên hội viên có chứng nhận ISO 9001 và năng lực giao hàng đúng hạn.', 'opp.type.supply', 200000000, NULL, 'Miền Nam', 'Sản xuất - Cơ khí', now() + interval '14 days', 'open', 78, '⚙️', now() - interval '1 days'),
  ('o-4', 'vba-0005', 'Liên minh xuất khẩu sang thị trường EU', 'Tổ chức nhóm doanh nghiệp hội viên cùng xuất khẩu sang EU, chia sẻ chi phí logistics, kho bãi và tư vấn pháp lý CE/REACH. Đã có đối tác phân phối tại Đức và Pháp.', 'opp.type.partnership', NULL, NULL, 'Toàn quốc', 'Xuất nhập khẩu', now() + interval '45 days', 'open', 256, '🌍', now() - interval '8 days'),
  ('o-5', 'vba-0001', 'Cơ hội thuê mặt bằng kinh doanh F&B Quận 1', 'Sang nhượng/cho thuê mặt bằng 180m² mặt tiền đường lớn Quận 1, phù hợp F&B, showroom, văn phòng cao cấp. Ưu đãi đặc biệt cho hội viên hiệp hội.', 'opp.type.demand', 80000000, 150000000, 'TP. Hồ Chí Minh', 'Bất động sản', now() + interval '21 days', 'open', 189, '🏙️', now() - interval '3 days');
CREATE TABLE public.news (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  author text NOT NULL,
  published_at text NOT NULL DEFAULT '—',
  views integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('published','draft','scheduled')),
  excerpt text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news" ON public.news FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage news" ON public.news FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.news (code, title, category, author, published_at, views, status, excerpt) VALUES
('NW-001','Kinh tế Việt Nam Q1/2026 tăng trưởng 6.8%','Kinh tế','Nguyễn Thu Hà','2026-04-30',4820,'published','Theo Tổng cục Thống kê, GDP Q1 đạt mức tăng trưởng cao nhất 5 năm.'),
('NW-002','Chuyển đổi số doanh nghiệp - Cơ hội và thách thức','Công nghệ','Trần Minh Đức','2026-04-25',3120,'published','Báo cáo mới nhất về tiến trình CDS trong khối doanh nghiệp tư nhân.'),
('NW-003','Hội thảo xúc tiến thương mại Việt - EU','Sự kiện','Lê Phương Anh','2026-04-20',2240,'published','Tổng kết hội thảo với hơn 300 doanh nghiệp tham dự.'),
('NW-004','Chính sách thuế mới hiệu lực từ 01/07/2026','Pháp lý','Phạm Quốc Anh','2026-05-15',0,'scheduled','Tổng quan các thay đổi quan trọng cần lưu ý.'),
('NW-005','Xu hướng ESG trong báo cáo doanh nghiệp','Quản trị','Hoàng Minh Tuấn','—',0,'draft','Bản nháp đang biên tập.');
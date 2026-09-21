CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  audience text NOT NULL CHECK (audience IN ('all','members','sponsors','staff')),
  channel text NOT NULL CHECK (channel IN ('inapp','email','sms')),
  sent_at text NOT NULL DEFAULT '—',
  reach integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('sent','scheduled','draft')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage notifications" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.notifications (code, title, body, audience, channel, sent_at, reach, status) VALUES
('N-001','Mở đăng ký Diễn đàn 2026','Đăng ký sớm nhận ưu đãi 20%','members','email','2026-04-30',1820,'sent'),
('N-002','Nhắc nộp hội phí Q2','Vui lòng hoàn tất trước 15/05','members','email','2026-04-28',420,'sent'),
('N-003','Thư mời tài trợ','Cơ hội tài trợ Hội nghị 2026','sponsors','email','2026-05-10',0,'scheduled'),
('N-004','Họp BCH tháng 5','Lịch họp 18/05/2026','staff','inapp','2026-04-25',35,'sent'),
('N-005','Cập nhật điều lệ','Bản dự thảo mới','all','inapp','—',0,'draft');
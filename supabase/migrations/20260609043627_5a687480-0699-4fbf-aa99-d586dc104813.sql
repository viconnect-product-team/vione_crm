CREATE TABLE public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  "user" text NOT NULL,
  action text NOT NULL,
  target text NOT NULL,
  category text NOT NULL CHECK (category IN ('auth','member','fee','event','system')),
  at text NOT NULL,
  ip text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.activity_log TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read activity_log" ON public.activity_log FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage activity_log" ON public.activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_activity_log_updated_at BEFORE UPDATE ON public.activity_log FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.activity_log (code, "user", action, target, category, at, ip) VALUES
('L-001','admin@vba.vn','Đăng nhập','Hệ thống','auth','2026-05-03 09:12','203.162.4.12'),
('L-002','ha.nguyen@vba.vn','Tạo hóa đơn','INV-2026-VBA-0008','fee','2026-05-03 10:24','203.162.4.18'),
('L-003','duc.tran@vba.vn','Cập nhật hội viên','VBA-0003','member','2026-05-02 16:45','203.162.4.22'),
('L-004','anh.le@vba.vn','Tạo sự kiện','Workshop CDS','event','2026-05-02 14:10','203.162.4.30'),
('L-005','system','Sao lưu dữ liệu','Database','system','2026-05-02 02:00','internal'),
('L-006','admin@vba.vn','Đổi quyền','User: tuan.hoang','auth','2026-05-01 11:20','203.162.4.12'),
('L-007','ha.nguyen@vba.vn','Đánh dấu đã thu','INV-2026-VBA-0002','fee','2026-05-01 09:50','203.162.4.18');
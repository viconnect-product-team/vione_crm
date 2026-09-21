CREATE TABLE public.attendees (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  initials text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  badges text[] NOT NULL DEFAULT '{}',
  membership text NOT NULL DEFAULT 'memberLevel.small',
  checked_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.attendees TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendees TO authenticated;
GRANT ALL ON public.attendees TO service_role;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read attendees" ON public.attendees FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage attendees" ON public.attendees TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_attendees_updated_at BEFORE UPDATE ON public.attendees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.checkin_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendee_id text NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
  result text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.checkin_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkin_logs TO authenticated;
GRANT ALL ON public.checkin_logs TO service_role;
ALTER TABLE public.checkin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read checkin_logs" ON public.checkin_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage checkin_logs" ON public.checkin_logs TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.attendees (id, name, initials, title, company, phone, badges, membership, checked_in) VALUES
('VBA-2026-001','Nguyễn Minh Quân','MQ','CEO & Founder','TechViet Solutions JSC','+84 901 234 567','{vip,speaker}','memberLevel.large',false),
('VBA-2026-002','Trần Thị Hương Lan','HL','Marketing Director','Saigon Logistics Group','+84 912 555 880','{sponsor}','memberLevel.medium',true),
('VBA-2026-003','Phạm Đức Anh','PA','Managing Partner','Anh Pham Consulting','+84 934 121 008','{member}','memberLevel.small',false),
('VBA-2026-004','Lê Hoàng Nam','LN','Head of Strategy','Hanoi Industrial Corp','+84 988 776 110','{vip}','memberLevel.large',false);
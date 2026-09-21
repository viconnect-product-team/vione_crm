CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  peer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (peer_id)
);

GRANT SELECT ON public.connections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Connections are viewable by everyone" ON public.connections FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage connections" ON public.connections FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by everyone" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage messages" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.connections (peer_id, status) VALUES
  ('vba-0002', 'connected'),
  ('vba-0003', 'connected'),
  ('vba-0005', 'pending_incoming'),
  ('vba-0004', 'pending_outgoing');

INSERT INTO public.messages (from_id, to_id, text, created_at) VALUES
  ('vba-0002', 'vba-0001', 'Chào anh, mình muốn trao đổi về cơ hội hợp tác xuất nhập khẩu.', now() - interval '26 hours'),
  ('vba-0001', 'vba-0002', 'Chào anh Trần! Rất vui được kết nối, mình sẵn sàng trao đổi thêm.', now() - interval '25 hours'),
  ('vba-0003', 'vba-0001', 'Bên mình có dự án chuyển đổi số mới, hẹn cafe tuần này nhé?', now() - interval '4 hours');
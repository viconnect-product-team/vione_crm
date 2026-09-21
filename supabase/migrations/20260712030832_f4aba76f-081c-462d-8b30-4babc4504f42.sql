ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS qr_fields text[] NOT NULL DEFAULT ARRAY['registration_code']::text[];

CREATE TABLE IF NOT EXISTS public.event_ticket_types (
  id text NOT NULL PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  association_id uuid NOT NULL DEFAULT current_association_id() REFERENCES public.associations(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_ticket_types_event ON public.event_ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_event_ticket_types_association ON public.event_ticket_types(association_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_ticket_types TO authenticated;
GRANT ALL ON public.event_ticket_types TO service_role;

ALTER TABLE public.event_ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_ticket_types_select_assoc" ON public.event_ticket_types
  FOR SELECT TO authenticated
  USING (is_member_of(association_id));

CREATE POLICY "event_ticket_types_admin_insert" ON public.event_ticket_types
  FOR INSERT TO authenticated
  WITH CHECK (has_assoc_role(association_id, 'admin'::app_role) OR is_platform_admin());

CREATE POLICY "event_ticket_types_admin_update" ON public.event_ticket_types
  FOR UPDATE TO authenticated
  USING (has_assoc_role(association_id, 'admin'::app_role) OR is_platform_admin())
  WITH CHECK (has_assoc_role(association_id, 'admin'::app_role) OR is_platform_admin());

CREATE POLICY "event_ticket_types_admin_delete" ON public.event_ticket_types
  FOR DELETE TO authenticated
  USING (has_assoc_role(association_id, 'admin'::app_role) OR is_platform_admin());

CREATE TRIGGER update_event_ticket_types_updated_at
  BEFORE UPDATE ON public.event_ticket_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
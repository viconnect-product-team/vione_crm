CREATE TABLE public.card_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  display_company TEXT,
  photo_url TEXT,
  show_name BOOLEAN NOT NULL DEFAULT true,
  show_company BOOLEAN NOT NULL DEFAULT true,
  show_photo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_settings TO authenticated;
GRANT ALL ON public.card_settings TO service_role;

ALTER TABLE public.card_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_settings_select_own" ON public.card_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "card_settings_insert_own" ON public.card_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "card_settings_update_own" ON public.card_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "card_settings_delete_own" ON public.card_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_card_settings_updated_at
  BEFORE UPDATE ON public.card_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
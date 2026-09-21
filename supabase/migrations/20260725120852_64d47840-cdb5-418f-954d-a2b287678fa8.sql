
CREATE TABLE public.card_ai_import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thumbnail text NOT NULL,
  suggestion jsonb NOT NULL,
  template_id text,
  qr_background text,
  applied_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX card_ai_import_history_user_created_idx
  ON public.card_ai_import_history(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_ai_import_history TO authenticated;
GRANT ALL ON public.card_ai_import_history TO service_role;

ALTER TABLE public.card_ai_import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_ai_history_select_own"
  ON public.card_ai_import_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "card_ai_history_insert_own"
  ON public.card_ai_import_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "card_ai_history_update_own"
  ON public.card_ai_import_history FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "card_ai_history_delete_own"
  ON public.card_ai_import_history FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

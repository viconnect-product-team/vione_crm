CREATE TABLE public.business_relationship_moment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id uuid NOT NULL REFERENCES public.business_relationship_moments(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  label text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','cancelled')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brmr_label_len CHECK (label IS NULL OR char_length(label) <= 200)
);

CREATE INDEX brmr_owner_remind_idx
  ON public.business_relationship_moment_reminders (owner_user_id, status, remind_at);
CREATE INDEX brmr_moment_idx
  ON public.business_relationship_moment_reminders (moment_id, remind_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_relationship_moment_reminders TO authenticated;
GRANT ALL ON public.business_relationship_moment_reminders TO service_role;

ALTER TABLE public.business_relationship_moment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brmr_select_own" ON public.business_relationship_moment_reminders
  FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "brmr_insert_own" ON public.business_relationship_moment_reminders
  FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "brmr_update_own" ON public.business_relationship_moment_reminders
  FOR UPDATE TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "brmr_delete_own" ON public.business_relationship_moment_reminders
  FOR DELETE TO authenticated USING (owner_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.brmr_validate_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.business_relationship_moments m
    WHERE m.id = NEW.moment_id AND m.owner_user_id = NEW.owner_user_id
  ) THEN
    RAISE EXCEPTION 'moment_not_owned';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER brmr_validate_reminder_trg
BEFORE INSERT OR UPDATE ON public.business_relationship_moment_reminders
FOR EACH ROW EXECUTE FUNCTION public.brmr_validate_reminder();
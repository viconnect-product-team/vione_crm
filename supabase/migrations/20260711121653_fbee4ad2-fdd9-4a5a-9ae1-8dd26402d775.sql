CREATE TABLE public.broadcast_notification_dismissals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_id)
);

GRANT SELECT, INSERT, DELETE ON public.broadcast_notification_dismissals TO authenticated;
GRANT ALL ON public.broadcast_notification_dismissals TO service_role;

ALTER TABLE public.broadcast_notification_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own broadcast dismissals"
  ON public.broadcast_notification_dismissals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_broadcast_dismissals_user ON public.broadcast_notification_dismissals (user_id);
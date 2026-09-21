GRANT SELECT, INSERT, UPDATE ON public.bc_dm_threads TO authenticated;
GRANT ALL ON public.bc_dm_threads TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.bc_dm_messages TO authenticated;
GRANT ALL ON public.bc_dm_messages TO service_role;

CREATE INDEX IF NOT EXISTS bc_dm_threads_low_idx ON public.bc_dm_threads (pair_user_low, last_message_at DESC);
CREATE INDEX IF NOT EXISTS bc_dm_threads_high_idx ON public.bc_dm_threads (pair_user_high, last_message_at DESC);
CREATE INDEX IF NOT EXISTS bc_dm_messages_thread_idx ON public.bc_dm_messages (thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bc_dm_messages_unread_idx ON public.bc_dm_messages (thread_id, sender_user_id) WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION public.bc_dm_guard_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.bc_dm_threads%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.bc_dm_threads WHERE id = NEW.thread_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'DM_THREAD_NOT_FOUND';
  END IF;
  IF NEW.sender_user_id <> t.pair_user_low AND NEW.sender_user_id <> t.pair_user_high THEN
    RAISE EXCEPTION 'DM_PAIR_NOT_AUTHORIZED';
  END IF;
  IF NOT public.bc_dm_pair_allowed(t.pair_user_low, t.pair_user_high) THEN
    RAISE EXCEPTION 'DM_PAIR_NOT_AUTHORIZED';
  END IF;
  NEW.read_at := NULL;
  NEW.retracted_at := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bc_dm_messages_guard_insert ON public.bc_dm_messages;
CREATE TRIGGER bc_dm_messages_guard_insert
BEFORE INSERT ON public.bc_dm_messages
FOR EACH ROW EXECUTE FUNCTION public.bc_dm_guard_message_insert();
CREATE TABLE public.bc_dm_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_user_low uuid NOT NULL,
  pair_user_high uuid NOT NULL,
  created_by uuid NOT NULL,
  last_message_at timestamptz,
  last_message_preview text,
  last_message_sender_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bc_dm_pair_order CHECK (pair_user_low < pair_user_high),
  CONSTRAINT bc_dm_pair_unique UNIQUE (pair_user_low, pair_user_high)
);

CREATE TABLE public.bc_dm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.bc_dm_threads(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  client_token uuid NOT NULL,
  read_at timestamptz,
  retracted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bc_dm_message_token_unique UNIQUE (thread_id, sender_user_id, client_token)
);

GRANT SELECT, INSERT, UPDATE ON public.bc_dm_threads TO authenticated;
GRANT ALL ON public.bc_dm_threads TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.bc_dm_messages TO authenticated;
GRANT ALL ON public.bc_dm_messages TO service_role;

ALTER TABLE public.bc_dm_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bc_dm_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.bc_dm_is_participant(_thread_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.bc_dm_threads t
    where t.id = _thread_id
      and _user_id in (t.pair_user_low, t.pair_user_high)
  )
$$;

REVOKE EXECUTE ON FUNCTION public.bc_dm_is_participant(uuid, uuid) FROM anon;

CREATE POLICY "Participants read own threads"
  ON public.bc_dm_threads FOR SELECT TO authenticated
  USING (auth.uid() IN (pair_user_low, pair_user_high));
CREATE POLICY "Participants create own threads"
  ON public.bc_dm_threads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND auth.uid() IN (pair_user_low, pair_user_high));
CREATE POLICY "Participants update own threads"
  ON public.bc_dm_threads FOR UPDATE TO authenticated
  USING (auth.uid() IN (pair_user_low, pair_user_high))
  WITH CHECK (auth.uid() IN (pair_user_low, pair_user_high));

CREATE POLICY "Participants read thread messages"
  ON public.bc_dm_messages FOR SELECT TO authenticated
  USING (public.bc_dm_is_participant(thread_id, auth.uid()));
CREATE POLICY "Participants send messages"
  ON public.bc_dm_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_user_id
    AND public.bc_dm_is_participant(thread_id, auth.uid())
  );
CREATE POLICY "Participants update thread messages"
  ON public.bc_dm_messages FOR UPDATE TO authenticated
  USING (public.bc_dm_is_participant(thread_id, auth.uid()))
  WITH CHECK (public.bc_dm_is_participant(thread_id, auth.uid()));

CREATE INDEX bc_dm_threads_low_idx ON public.bc_dm_threads (pair_user_low, last_message_at DESC);
CREATE INDEX bc_dm_threads_high_idx ON public.bc_dm_threads (pair_user_high, last_message_at DESC);
CREATE INDEX bc_dm_messages_thread_idx ON public.bc_dm_messages (thread_id, created_at DESC);

-- Hai người phải là kết nối đã chấp nhận và không chặn nhau.
CREATE OR REPLACE FUNCTION public.bc_dm_pair_allowed(_low uuid, _high uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.user_connections c
    where c.pair_user_low = _low
      and c.pair_user_high = _high
      and c.status = 'accepted'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.bc_dm_pair_allowed(uuid, uuid) FROM anon;

CREATE OR REPLACE FUNCTION public.bc_dm_validate_thread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if not public.bc_dm_pair_allowed(NEW.pair_user_low, NEW.pair_user_high) then
    raise exception 'DM_PAIR_NOT_AUTHORIZED';
  end if;
  return NEW;
end
$$;

CREATE TRIGGER bc_dm_validate_thread_trg
  BEFORE INSERT ON public.bc_dm_threads
  FOR EACH ROW EXECUTE FUNCTION public.bc_dm_validate_thread();

CREATE OR REPLACE FUNCTION public.bc_dm_after_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  t public.bc_dm_threads%rowtype;
begin
  select * into t from public.bc_dm_threads where id = NEW.thread_id;
  if not found then
    raise exception 'DM_THREAD_NOT_FOUND';
  end if;
  if NEW.sender_user_id not in (t.pair_user_low, t.pair_user_high) then
    raise exception 'DM_PAIR_NOT_AUTHORIZED';
  end if;
  if not public.bc_dm_pair_allowed(t.pair_user_low, t.pair_user_high) then
    raise exception 'DM_PAIR_NOT_AUTHORIZED';
  end if;

  update public.bc_dm_threads
     set last_message_at = NEW.created_at,
         last_message_preview = left(NEW.body, 140),
         last_message_sender_id = NEW.sender_user_id,
         updated_at = now()
   where id = NEW.thread_id;
  return NEW;
end
$$;

CREATE TRIGGER bc_dm_after_message_trg
  AFTER INSERT ON public.bc_dm_messages
  FOR EACH ROW EXECUTE FUNCTION public.bc_dm_after_message();

-- Chỉ cho phép cập nhật read_at (người nhận) và retracted_at (người gửi).
CREATE OR REPLACE FUNCTION public.bc_dm_guard_message_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  if NEW.thread_id <> OLD.thread_id
     or NEW.sender_user_id <> OLD.sender_user_id
     or NEW.body <> OLD.body
     or NEW.created_at <> OLD.created_at
     or NEW.client_token <> OLD.client_token then
    raise exception 'DM_MESSAGE_IMMUTABLE';
  end if;
  if NEW.retracted_at is distinct from OLD.retracted_at and auth.uid() <> OLD.sender_user_id then
    raise exception 'DM_MESSAGE_IMMUTABLE';
  end if;
  if NEW.read_at is distinct from OLD.read_at and auth.uid() = OLD.sender_user_id then
    raise exception 'DM_MESSAGE_IMMUTABLE';
  end if;
  return NEW;
end
$$;

CREATE TRIGGER bc_dm_guard_message_update_trg
  BEFORE UPDATE ON public.bc_dm_messages
  FOR EACH ROW EXECUTE FUNCTION public.bc_dm_guard_message_update();
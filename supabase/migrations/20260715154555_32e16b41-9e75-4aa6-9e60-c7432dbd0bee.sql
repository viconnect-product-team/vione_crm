-- ============================================================
-- BC-7.9 Turn B — Meeting Follow-up Domain Foundation
-- Additive. Introduces per-meeting follow-up action items with
-- ownership eligibility, deterministic state machine, optimistic
-- concurrency, idempotency, exactly-once events, FORCE RLS and
-- no direct DML policies (writes only via SECURITY DEFINER).
-- ============================================================

-- ---------- 1. TABLE ----------
CREATE TABLE public.business_meeting_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.business_meetings(id) ON DELETE CASCADE,
  outcome_id uuid REFERENCES public.business_meeting_outcomes(id) ON DELETE SET NULL,
  created_by_user_id uuid NOT NULL,
  owner_user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  due_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  client_request_id text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bmfu_status_ck  CHECK (status   IN ('open','in_progress','completed','cancelled')),
  CONSTRAINT bmfu_priority_ck CHECK (priority IN ('low','normal','high','urgent')),
  CONSTRAINT bmfu_title_len_ck CHECK (length(btrim(title)) BETWEEN 1 AND 240),
  CONSTRAINT bmfu_desc_len_ck  CHECK (description IS NULL OR length(description) <= 4000),
  CONSTRAINT bmfu_version_pos_ck CHECK (version >= 1),
  CONSTRAINT bmfu_completed_consistency_ck CHECK (
    (status = 'completed' AND completed_at IS NOT NULL AND cancelled_at IS NULL)
    OR (status = 'cancelled' AND cancelled_at IS NOT NULL AND completed_at IS NULL)
    OR (status IN ('open','in_progress') AND completed_at IS NULL AND cancelled_at IS NULL)
  )
);

CREATE UNIQUE INDEX bmfu_meeting_creator_client_req_uniq
  ON public.business_meeting_follow_ups (meeting_id, created_by_user_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

CREATE INDEX bmfu_meeting_idx  ON public.business_meeting_follow_ups (meeting_id);
CREATE INDEX bmfu_owner_idx    ON public.business_meeting_follow_ups (owner_user_id);
CREATE INDEX bmfu_outcome_idx  ON public.business_meeting_follow_ups (outcome_id) WHERE outcome_id IS NOT NULL;
CREATE INDEX bmfu_status_due_idx ON public.business_meeting_follow_ups (status, due_at) WHERE status IN ('open','in_progress');

-- ---------- 2. updated_at trigger ----------
CREATE TRIGGER bmfu_updated_at BEFORE UPDATE ON public.business_meeting_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 3. IMMUTABILITY GUARD (belt-and-braces vs service_role misuse) ----------
CREATE OR REPLACE FUNCTION public.bmfu_guard_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.meeting_id IS DISTINCT FROM OLD.meeting_id THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_STATE';
  END IF;
  IF NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_STATE';
  END IF;
  IF OLD.status IN ('completed','cancelled')
     AND (
       NEW.status       IS DISTINCT FROM OLD.status
       OR NEW.title       IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.priority    IS DISTINCT FROM OLD.priority
       OR NEW.due_at      IS DISTINCT FROM OLD.due_at
       OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
       OR NEW.outcome_id  IS DISTINCT FROM OLD.outcome_id
     ) THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_TERMINAL';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER bmfu_guard_immutable_trg BEFORE UPDATE ON public.business_meeting_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.bmfu_guard_immutable();

-- ---------- 4. SAME-MEETING OUTCOME LINK GUARD ----------
CREATE OR REPLACE FUNCTION public.bmfu_guard_outcome_meeting()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _om uuid;
BEGIN
  IF NEW.outcome_id IS NULL THEN RETURN NEW; END IF;
  SELECT meeting_id INTO _om FROM public.business_meeting_outcomes WHERE id = NEW.outcome_id;
  IF _om IS NULL OR _om <> NEW.meeting_id THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_OUTCOME';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER bmfu_outcome_meeting_ins_trg BEFORE INSERT ON public.business_meeting_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.bmfu_guard_outcome_meeting();
CREATE TRIGGER bmfu_outcome_meeting_upd_trg BEFORE UPDATE OF outcome_id ON public.business_meeting_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.bmfu_guard_outcome_meeting();

-- Block DELETE always (writes go via cancel RPC).
CREATE OR REPLACE FUNCTION public.bmfu_block_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'MEETING_FOLLOW_UP_TERMINAL';
END $$;

CREATE TRIGGER bmfu_block_delete_trg BEFORE DELETE ON public.business_meeting_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.bmfu_block_delete();

-- ---------- 5. RLS ----------
ALTER TABLE public.business_meeting_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_follow_ups FORCE ROW LEVEL SECURITY;

CREATE POLICY bmfu_select ON public.business_meeting_follow_ups
  FOR SELECT TO authenticated
  USING (
    public.bm_is_participant(meeting_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.business_meetings m
      WHERE m.id = meeting_id AND m.organizer_user_id = auth.uid()
    )
    OR public.is_platform_admin()
  );
-- No INSERT/UPDATE/DELETE policies: writes only via SECURITY DEFINER RPCs below.

-- ---------- 6. GRANTS ----------
GRANT SELECT ON public.business_meeting_follow_ups TO authenticated;
GRANT ALL    ON public.business_meeting_follow_ups TO service_role;

-- ---------- 7. HELPERS ----------
-- Owner eligibility: organizer or currently-active meeting participant.
CREATE OR REPLACE FUNCTION public.bmfu_owner_eligible(_meeting uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.business_meetings m
              WHERE m.id = _meeting AND m.organizer_user_id = _user)
    OR EXISTS (SELECT 1 FROM public.business_meeting_participants p
                 WHERE p.meeting_id = _meeting AND p.user_id = _user AND p.left_at IS NULL);
$$;

-- Actor authorisation: organizer, or currently-active participant of the meeting.
CREATE OR REPLACE FUNCTION public.bmfu_actor_authorised(_meeting uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.bmfu_owner_eligible(_meeting, _user);
$$;

CREATE OR REPLACE FUNCTION public.bmfu_is_organizer(_meeting uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.business_meetings m
                   WHERE m.id = _meeting AND m.organizer_user_id = _user);
$$;

-- ---------- 8. RPCS ----------

-- 8.1 CREATE
CREATE OR REPLACE FUNCTION public.business_meeting_follow_up_create(
  _meeting_id uuid,
  _title text,
  _owner_user_id uuid,
  _description text DEFAULT NULL,
  _priority text DEFAULT 'normal',
  _due_at timestamptz DEFAULT NULL,
  _outcome_id uuid DEFAULT NULL,
  _client_request_id text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_org boolean;
  _title2 text;
  _desc2 text;
  _cri text;
  _existing record;
  _row record;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.business_meetings WHERE id = _meeting_id) THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_NOT_FOUND';
  END IF;

  IF NOT public.bmfu_actor_authorised(_meeting_id, _uid) THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN';
  END IF;

  _is_org := public.bmfu_is_organizer(_meeting_id, _uid);

  -- Owner authority: participants may only self-own; organizers may assign any eligible.
  IF _owner_user_id IS NULL THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_OWNER';
  END IF;
  IF NOT _is_org AND _owner_user_id <> _uid THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN';
  END IF;
  IF NOT public.bmfu_owner_eligible(_meeting_id, _owner_user_id) THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_OWNER';
  END IF;

  -- Priority
  IF _priority NOT IN ('low','normal','high','urgent') THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_PRIORITY';
  END IF;

  -- Title / description normalization
  _title2 := btrim(COALESCE(_title,''));
  IF length(_title2) < 1 OR length(_title2) > 240 THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_TITLE';
  END IF;
  _desc2 := NULLIF(btrim(COALESCE(_description,'')), '');
  IF _desc2 IS NOT NULL AND length(_desc2) > 4000 THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_TITLE';
  END IF;

  -- Same-meeting outcome
  IF _outcome_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.business_meeting_outcomes o
       WHERE o.id = _outcome_id AND o.meeting_id = _meeting_id
    ) THEN
      RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_OUTCOME';
    END IF;
  END IF;

  _cri := NULLIF(btrim(COALESCE(_client_request_id, '')), '');

  -- Idempotency replay
  IF _cri IS NOT NULL THEN
    SELECT * INTO _existing FROM public.business_meeting_follow_ups
      WHERE meeting_id = _meeting_id AND created_by_user_id = _uid AND client_request_id = _cri;
    IF FOUND THEN RETURN to_jsonb(_existing); END IF;
  END IF;

  INSERT INTO public.business_meeting_follow_ups
    (meeting_id, outcome_id, created_by_user_id, owner_user_id, title, description,
     status, priority, due_at, version, client_request_id)
  VALUES
    (_meeting_id, _outcome_id, _uid, _owner_user_id, _title2, _desc2,
     'open', _priority, _due_at, 1, _cri)
  RETURNING * INTO _row;

  PERFORM public.bm_log_event(
    _meeting_id, _uid, 'business_meeting_follow_up_created', NULL, NULL,
    'follow_up_create:' || _row.id::text,
    jsonb_build_object(
      'followUpId', _row.id,
      'meetingId',  _row.meeting_id,
      'outcomeId',  _row.outcome_id,
      'status',     _row.status,
      'priority',   _row.priority,
      'version',    _row.version,
      'dueAt',      _row.due_at
    )
  );

  RETURN to_jsonb(_row);
END $$;

-- 8.2 UPDATE
CREATE OR REPLACE FUNCTION public.business_meeting_follow_up_update(
  _follow_up_id uuid,
  _expected_version integer,
  _title text DEFAULT NULL,
  _description text DEFAULT NULL,
  _clear_description boolean DEFAULT false,
  _priority text DEFAULT NULL,
  _due_at timestamptz DEFAULT NULL,
  _clear_due_at boolean DEFAULT false,
  _owner_user_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
  _is_org boolean;
  _next_title text;
  _next_desc text;
  _next_priority text;
  _next_due timestamptz;
  _next_owner uuid;
  _changed boolean := false;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN'; END IF;

  SELECT * INTO _row FROM public.business_meeting_follow_ups WHERE id = _follow_up_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_FOLLOW_UP_NOT_FOUND'; END IF;

  IF NOT public.bmfu_actor_authorised(_row.meeting_id, _uid) THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN';
  END IF;
  _is_org := public.bmfu_is_organizer(_row.meeting_id, _uid);

  -- Edit authority: organizer OR owner OR creator (creator/owner policy)
  IF NOT _is_org AND _uid <> _row.owner_user_id AND _uid <> _row.created_by_user_id THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN';
  END IF;

  IF _row.status IN ('completed','cancelled') THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_TERMINAL';
  END IF;

  IF _row.version <> _expected_version THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_VERSION_CONFLICT';
  END IF;

  _next_title := _row.title;
  IF _title IS NOT NULL THEN
    _next_title := btrim(_title);
    IF length(_next_title) < 1 OR length(_next_title) > 240 THEN
      RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_TITLE';
    END IF;
    IF _next_title IS DISTINCT FROM _row.title THEN _changed := true; END IF;
  END IF;

  IF _clear_description THEN
    _next_desc := NULL;
    IF _row.description IS NOT NULL THEN _changed := true; END IF;
  ELSIF _description IS NOT NULL THEN
    _next_desc := NULLIF(btrim(_description), '');
    IF _next_desc IS NOT NULL AND length(_next_desc) > 4000 THEN
      RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_TITLE';
    END IF;
    IF _next_desc IS DISTINCT FROM _row.description THEN _changed := true; END IF;
  ELSE
    _next_desc := _row.description;
  END IF;

  _next_priority := _row.priority;
  IF _priority IS NOT NULL THEN
    IF _priority NOT IN ('low','normal','high','urgent') THEN
      RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_PRIORITY';
    END IF;
    IF _priority <> _row.priority THEN _changed := true; END IF;
    _next_priority := _priority;
  END IF;

  IF _clear_due_at THEN
    _next_due := NULL;
    IF _row.due_at IS NOT NULL THEN _changed := true; END IF;
  ELSIF _due_at IS NOT NULL THEN
    _next_due := _due_at;
    IF _next_due IS DISTINCT FROM _row.due_at THEN _changed := true; END IF;
  ELSE
    _next_due := _row.due_at;
  END IF;

  _next_owner := _row.owner_user_id;
  IF _owner_user_id IS NOT NULL AND _owner_user_id <> _row.owner_user_id THEN
    IF NOT _is_org THEN
      RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN';
    END IF;
    IF NOT public.bmfu_owner_eligible(_row.meeting_id, _owner_user_id) THEN
      RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_OWNER';
    END IF;
    _next_owner := _owner_user_id;
    _changed := true;
  END IF;

  IF NOT _changed THEN
    RETURN to_jsonb(_row);
  END IF;

  UPDATE public.business_meeting_follow_ups
     SET title = _next_title,
         description = _next_desc,
         priority = _next_priority,
         due_at = _next_due,
         owner_user_id = _next_owner,
         version = version + 1
   WHERE id = _row.id AND version = _expected_version
   RETURNING * INTO _row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_VERSION_CONFLICT';
  END IF;

  PERFORM public.bm_log_event(
    _row.meeting_id, _uid, 'business_meeting_follow_up_updated', NULL, NULL,
    'follow_up_update:' || _row.id::text || ':' || _row.version::text,
    jsonb_build_object(
      'followUpId', _row.id,
      'meetingId',  _row.meeting_id,
      'outcomeId',  _row.outcome_id,
      'status',     _row.status,
      'priority',   _row.priority,
      'version',    _row.version,
      'dueAt',      _row.due_at
    )
  );

  RETURN to_jsonb(_row);
END $$;

-- 8.3 SET STATUS (in_progress, completed)
CREATE OR REPLACE FUNCTION public.business_meeting_follow_up_set_status(
  _follow_up_id uuid,
  _expected_version integer,
  _target_status text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
  _is_org boolean;
  _evt text;
  _mkey text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN'; END IF;

  IF _target_status NOT IN ('in_progress','completed') THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_STATE';
  END IF;

  SELECT * INTO _row FROM public.business_meeting_follow_ups WHERE id = _follow_up_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_FOLLOW_UP_NOT_FOUND'; END IF;

  IF NOT public.bmfu_actor_authorised(_row.meeting_id, _uid) THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN';
  END IF;
  _is_org := public.bmfu_is_organizer(_row.meeting_id, _uid);

  IF NOT _is_org AND _uid <> _row.owner_user_id THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN';
  END IF;

  -- Idempotent completion replay
  IF _target_status = 'completed' AND _row.status = 'completed' THEN
    RETURN to_jsonb(_row);
  END IF;

  IF _row.status = 'cancelled' THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_TERMINAL';
  END IF;

  -- Allowed transitions
  IF NOT (
       (_row.status = 'open' AND _target_status IN ('in_progress','completed'))
    OR (_row.status = 'in_progress' AND _target_status = 'completed')
  ) THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_INVALID_STATE';
  END IF;

  IF _row.version <> _expected_version THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_VERSION_CONFLICT';
  END IF;

  IF _target_status = 'in_progress' THEN
    UPDATE public.business_meeting_follow_ups
       SET status = 'in_progress',
           version = version + 1
     WHERE id = _row.id AND version = _expected_version
     RETURNING * INTO _row;
    _evt  := 'business_meeting_follow_up_started';
    _mkey := 'follow_up_start:' || _row.id::text;
  ELSE
    UPDATE public.business_meeting_follow_ups
       SET status = 'completed',
           completed_at = now(),
           cancelled_at = NULL,
           version = version + 1
     WHERE id = _row.id AND version = _expected_version
     RETURNING * INTO _row;
    _evt  := 'business_meeting_follow_up_completed';
    _mkey := 'follow_up_complete:' || _row.id::text;
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_VERSION_CONFLICT';
  END IF;

  PERFORM public.bm_log_event(
    _row.meeting_id, _uid, _evt, NULL, NULL, _mkey,
    jsonb_build_object(
      'followUpId', _row.id,
      'meetingId',  _row.meeting_id,
      'outcomeId',  _row.outcome_id,
      'status',     _row.status,
      'priority',   _row.priority,
      'version',    _row.version,
      'dueAt',      _row.due_at
    )
  );

  RETURN to_jsonb(_row);
END $$;

-- 8.4 CANCEL
CREATE OR REPLACE FUNCTION public.business_meeting_follow_up_cancel(
  _follow_up_id uuid,
  _expected_version integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
  _is_org boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN'; END IF;

  SELECT * INTO _row FROM public.business_meeting_follow_ups WHERE id = _follow_up_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_FOLLOW_UP_NOT_FOUND'; END IF;

  IF NOT public.bmfu_actor_authorised(_row.meeting_id, _uid) THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN';
  END IF;
  _is_org := public.bmfu_is_organizer(_row.meeting_id, _uid);

  IF NOT _is_org AND _uid <> _row.owner_user_id THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_FORBIDDEN';
  END IF;

  -- Idempotent cancellation replay
  IF _row.status = 'cancelled' THEN
    RETURN to_jsonb(_row);
  END IF;

  IF _row.status = 'completed' THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_TERMINAL';
  END IF;

  IF _row.version <> _expected_version THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_VERSION_CONFLICT';
  END IF;

  UPDATE public.business_meeting_follow_ups
     SET status = 'cancelled',
         cancelled_at = now(),
         completed_at = NULL,
         version = version + 1
   WHERE id = _row.id AND version = _expected_version
   RETURNING * INTO _row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEETING_FOLLOW_UP_VERSION_CONFLICT';
  END IF;

  PERFORM public.bm_log_event(
    _row.meeting_id, _uid, 'business_meeting_follow_up_cancelled', NULL, NULL,
    'follow_up_cancel:' || _row.id::text,
    jsonb_build_object(
      'followUpId', _row.id,
      'meetingId',  _row.meeting_id,
      'outcomeId',  _row.outcome_id,
      'status',     _row.status,
      'priority',   _row.priority,
      'version',    _row.version,
      'dueAt',      _row.due_at
    )
  );

  RETURN to_jsonb(_row);
END $$;

-- ---------- 9. FUNCTION GRANTS ----------
REVOKE ALL ON FUNCTION public.business_meeting_follow_up_create(uuid,text,uuid,text,text,timestamptz,uuid,text)             FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_follow_up_update(uuid,integer,text,text,boolean,text,timestamptz,boolean,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_follow_up_set_status(uuid,integer,text)                                        FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_follow_up_cancel(uuid,integer)                                                 FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.business_meeting_follow_up_create(uuid,text,uuid,text,text,timestamptz,uuid,text)            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_follow_up_update(uuid,integer,text,text,boolean,text,timestamptz,boolean,uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_follow_up_set_status(uuid,integer,text)                                     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_follow_up_cancel(uuid,integer)                                              TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.bmfu_owner_eligible(uuid,uuid)    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bmfu_actor_authorised(uuid,uuid)  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bmfu_is_organizer(uuid,uuid)      FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.bmfu_owner_eligible(uuid,uuid)   TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.bmfu_actor_authorised(uuid,uuid) TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.bmfu_is_organizer(uuid,uuid)     TO authenticated, service_role;

-- ============================================================
-- BC-7.10 Turn A — Meeting Agenda Domain Foundation
-- Additive. Organizer-only mutations via SECURITY DEFINER RPCs.
-- Participant read via RLS. FORCE RLS, no direct DML policies.
-- ============================================================

-- ---------- 1. TABLE ----------
CREATE TABLE public.business_meeting_agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.business_meetings(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.business_meeting_agenda_items(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  position integer NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  estimated_minutes integer,
  owner_user_id uuid,
  linked_follow_up_id uuid REFERENCES public.business_meeting_follow_ups(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bmai_status_ck CHECK (status IN ('planned','in_discussion','discussed','skipped')),
  CONSTRAINT bmai_title_len_ck CHECK (char_length(title) >= 1 AND char_length(title) <= 240),
  CONSTRAINT bmai_desc_len_ck CHECK (description IS NULL OR char_length(description) <= 2000),
  CONSTRAINT bmai_position_pos_ck CHECK (position >= 0),
  CONSTRAINT bmai_version_pos_ck CHECK (version >= 1),
  CONSTRAINT bmai_est_min_ck CHECK (estimated_minutes IS NULL OR (estimated_minutes >= 0 AND estimated_minutes <= 24*60))
);

CREATE INDEX bmai_meeting_position_idx ON public.business_meeting_agenda_items (meeting_id, parent_id, position);
CREATE INDEX bmai_meeting_idx ON public.business_meeting_agenda_items (meeting_id);
CREATE INDEX bmai_owner_idx ON public.business_meeting_agenda_items (owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX bmai_follow_up_idx ON public.business_meeting_agenda_items (linked_follow_up_id) WHERE linked_follow_up_id IS NOT NULL;

-- ---------- 2. updated_at trigger ----------
CREATE TRIGGER bmai_updated_at BEFORE UPDATE ON public.business_meeting_agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 3. Structural guards ----------

-- Max 1 nesting level: parent_id must reference a top-level item (parent_id IS NULL).
CREATE OR REPLACE FUNCTION public.bmai_guard_nesting()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _parent_parent uuid; _parent_meeting uuid;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT parent_id, meeting_id INTO _parent_parent, _parent_meeting
      FROM public.business_meeting_agenda_items WHERE id = NEW.parent_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_NOT_FOUND'; END IF;
    IF _parent_parent IS NOT NULL THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
    END IF;
    IF _parent_meeting <> NEW.meeting_id THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER bmai_guard_nesting_trg BEFORE INSERT OR UPDATE ON public.business_meeting_agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.bmai_guard_nesting();

-- linked_follow_up_id must belong to the same meeting.
CREATE OR REPLACE FUNCTION public.bmai_guard_linked_follow_up()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _fu_meeting uuid;
BEGIN
  IF NEW.linked_follow_up_id IS NOT NULL THEN
    SELECT meeting_id INTO _fu_meeting FROM public.business_meeting_follow_ups
      WHERE id = NEW.linked_follow_up_id;
    IF NOT FOUND OR _fu_meeting <> NEW.meeting_id THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER bmai_guard_linked_follow_up_trg BEFORE INSERT OR UPDATE ON public.business_meeting_agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.bmai_guard_linked_follow_up();

-- meeting_id is immutable across updates; terminal status is terminal.
CREATE OR REPLACE FUNCTION public.bmai_guard_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.meeting_id IS DISTINCT FROM OLD.meeting_id THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
  END IF;
  IF OLD.status IN ('discussed','skipped') AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_INVALID_TRANSITION';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER bmai_guard_immutable_trg BEFORE UPDATE ON public.business_meeting_agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.bmai_guard_immutable();

-- Delete allowed only for planned items (RPC also checks; belt-and-braces).
CREATE OR REPLACE FUNCTION public.bmai_guard_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status <> 'planned' THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_INVALID_TRANSITION';
  END IF;
  RETURN OLD;
END $$;

CREATE TRIGGER bmai_guard_delete_trg BEFORE DELETE ON public.business_meeting_agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.bmai_guard_delete();

-- ---------- 4. RLS ----------
ALTER TABLE public.business_meeting_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_agenda_items FORCE ROW LEVEL SECURITY;

CREATE POLICY bmai_select ON public.business_meeting_agenda_items
  FOR SELECT TO authenticated
  USING (
    public.bm_is_participant(meeting_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.business_meetings m
      WHERE m.id = meeting_id AND m.organizer_user_id = auth.uid()
    )
    OR public.is_platform_admin()
  );

-- No INSERT/UPDATE/DELETE policies. All writes via SECURITY DEFINER RPCs.

-- ---------- 5. GRANTS ----------
GRANT SELECT ON public.business_meeting_agenda_items TO authenticated;
GRANT ALL    ON public.business_meeting_agenda_items TO service_role;

-- ---------- 6. HELPERS ----------

-- Agenda editing eligibility: allow while meeting is not cancelled.
CREATE OR REPLACE FUNCTION public.bmai_is_agenda_eligible(_status public.business_meeting_status)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT _status IS DISTINCT FROM 'cancelled';
$$;

-- Fetch and lock meeting; authorize organizer + agenda eligibility.
CREATE OR REPLACE FUNCTION public.bmai_authorize_organizer(_meeting_id uuid, _uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m record;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'MEETING_COLLABORATION_FORBIDDEN'; END IF;
  SELECT id, organizer_user_id, status INTO _m FROM public.business_meetings WHERE id = _meeting_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_NOT_FOUND'; END IF;
  IF _m.organizer_user_id <> _uid THEN RAISE EXCEPTION 'MEETING_COLLABORATION_FORBIDDEN'; END IF;
  IF NOT public.bmai_is_agenda_eligible(_m.status) THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_INVALID_STATE';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.bmai_authorize_organizer(uuid,uuid) FROM PUBLIC, anon, authenticated;

-- ---------- 7. RPCS ----------

-- 7.1 CREATE
CREATE OR REPLACE FUNCTION public.business_meeting_agenda_item_create(
  _meeting_id uuid,
  _title text,
  _description text DEFAULT NULL,
  _parent_id uuid DEFAULT NULL,
  _estimated_minutes integer DEFAULT NULL,
  _owner_user_id uuid DEFAULT NULL,
  _linked_follow_up_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _title_norm text;
  _desc_norm text;
  _next_pos integer;
  _row record;
BEGIN
  PERFORM public.bmai_authorize_organizer(_meeting_id, _uid);

  _title_norm := NULLIF(btrim(COALESCE(_title, '')), '');
  IF _title_norm IS NULL OR char_length(_title_norm) > 240 THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
  END IF;
  _desc_norm := NULLIF(btrim(COALESCE(_description, '')), '');
  IF _desc_norm IS NOT NULL AND char_length(_desc_norm) > 2000 THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
  END IF;

  SELECT COALESCE(MAX(position), -1) + 1 INTO _next_pos
    FROM public.business_meeting_agenda_items
    WHERE meeting_id = _meeting_id AND parent_id IS NOT DISTINCT FROM _parent_id;

  INSERT INTO public.business_meeting_agenda_items
    (meeting_id, parent_id, created_by_user_id, title, description,
     position, status, estimated_minutes, owner_user_id, linked_follow_up_id, version)
  VALUES
    (_meeting_id, _parent_id, _uid, _title_norm, _desc_norm,
     _next_pos, 'planned', _estimated_minutes, _owner_user_id, _linked_follow_up_id, 1)
  RETURNING * INTO _row;

  PERFORM public.bm_log_event(
    _meeting_id, _uid, 'business_meeting_agenda_item_created', NULL, NULL,
    'agenda_create:' || _row.id::text,
    jsonb_build_object(
      'agendaItemId', _row.id,
      'title', _row.title,
      'parentId', _row.parent_id,
      'position', _row.position
    )
  );

  RETURN to_jsonb(_row);
END $$;

-- 7.2 UPDATE (planned or in_discussion only)
CREATE OR REPLACE FUNCTION public.business_meeting_agenda_item_update(
  _item_id uuid,
  _expected_version integer,
  _title text DEFAULT NULL,
  _description text DEFAULT NULL,
  _clear_description boolean DEFAULT false,
  _estimated_minutes integer DEFAULT NULL,
  _clear_estimated_minutes boolean DEFAULT false,
  _owner_user_id uuid DEFAULT NULL,
  _clear_owner boolean DEFAULT false,
  _linked_follow_up_id uuid DEFAULT NULL,
  _clear_linked_follow_up boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
  _next_title text;
  _next_desc text;
  _next_est integer;
  _next_owner uuid;
  _next_fu uuid;
BEGIN
  SELECT * INTO _row FROM public.business_meeting_agenda_items WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_NOT_FOUND'; END IF;

  PERFORM public.bmai_authorize_organizer(_row.meeting_id, _uid);

  IF _row.status IN ('discussed','skipped') THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_INVALID_TRANSITION';
  END IF;
  IF _row.version <> _expected_version THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT';
  END IF;

  _next_title := _row.title;
  IF _title IS NOT NULL THEN
    _next_title := NULLIF(btrim(_title), '');
    IF _next_title IS NULL OR char_length(_next_title) > 240 THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
    END IF;
  END IF;

  IF _clear_description THEN
    _next_desc := NULL;
  ELSIF _description IS NOT NULL THEN
    _next_desc := NULLIF(btrim(_description), '');
    IF _next_desc IS NOT NULL AND char_length(_next_desc) > 2000 THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
    END IF;
  ELSE
    _next_desc := _row.description;
  END IF;

  IF _clear_estimated_minutes THEN
    _next_est := NULL;
  ELSIF _estimated_minutes IS NOT NULL THEN
    _next_est := _estimated_minutes;
  ELSE
    _next_est := _row.estimated_minutes;
  END IF;

  IF _clear_owner THEN
    _next_owner := NULL;
  ELSIF _owner_user_id IS NOT NULL THEN
    _next_owner := _owner_user_id;
  ELSE
    _next_owner := _row.owner_user_id;
  END IF;

  IF _clear_linked_follow_up THEN
    _next_fu := NULL;
  ELSIF _linked_follow_up_id IS NOT NULL THEN
    _next_fu := _linked_follow_up_id;
  ELSE
    _next_fu := _row.linked_follow_up_id;
  END IF;

  UPDATE public.business_meeting_agenda_items
    SET title = _next_title,
        description = _next_desc,
        estimated_minutes = _next_est,
        owner_user_id = _next_owner,
        linked_follow_up_id = _next_fu,
        version = version + 1
    WHERE id = _item_id AND version = _expected_version
    RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT'; END IF;

  RETURN to_jsonb(_row);
END $$;

-- 7.3 SET STATUS (frozen transitions)
CREATE OR REPLACE FUNCTION public.business_meeting_agenda_item_set_status(
  _item_id uuid,
  _expected_version integer,
  _next_status text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
  _valid boolean := false;
BEGIN
  SELECT * INTO _row FROM public.business_meeting_agenda_items WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_NOT_FOUND'; END IF;

  PERFORM public.bmai_authorize_organizer(_row.meeting_id, _uid);

  IF _row.version <> _expected_version THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT';
  END IF;

  -- Allowed transitions
  IF _row.status = 'planned'       AND _next_status IN ('in_discussion','discussed','skipped') THEN _valid := true;
  ELSIF _row.status = 'in_discussion' AND _next_status IN ('discussed','skipped')                 THEN _valid := true;
  END IF;
  IF NOT _valid THEN RAISE EXCEPTION 'MEETING_COLLABORATION_INVALID_TRANSITION'; END IF;

  UPDATE public.business_meeting_agenda_items
    SET status = _next_status,
        version = version + 1
    WHERE id = _item_id AND version = _expected_version
    RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT'; END IF;

  IF _next_status = 'discussed' THEN
    PERFORM public.bm_log_event(
      _row.meeting_id, _uid, 'business_meeting_agenda_item_discussed', NULL, NULL,
      'agenda_discussed:' || _row.id::text,
      jsonb_build_object(
        'agendaItemId', _row.id,
        'title', _row.title
      )
    );
  END IF;

  RETURN to_jsonb(_row);
END $$;

-- 7.4 REORDER (atomic, aggregate version guard via per-item expected_versions)
CREATE OR REPLACE FUNCTION public.business_meeting_agenda_reorder(
  _meeting_id uuid,
  _parent_id uuid,
  _ordered_ids uuid[],
  _expected_versions integer[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _i integer;
  _n integer;
  _row record;
BEGIN
  PERFORM public.bmai_authorize_organizer(_meeting_id, _uid);

  IF _ordered_ids IS NULL OR array_length(_ordered_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
  END IF;
  IF array_length(_ordered_ids, 1) <> array_length(_expected_versions, 1) THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
  END IF;

  _n := array_length(_ordered_ids, 1);

  -- Verify count matches current sibling set
  IF _n <> (
    SELECT count(*) FROM public.business_meeting_agenda_items
      WHERE meeting_id = _meeting_id AND parent_id IS NOT DISTINCT FROM _parent_id
  ) THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
  END IF;

  -- Lock all rows first, verify membership + versions
  FOR _i IN 1.._n LOOP
    SELECT * INTO _row FROM public.business_meeting_agenda_items
      WHERE id = _ordered_ids[_i] FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_NOT_FOUND'; END IF;
    IF _row.meeting_id <> _meeting_id OR (_row.parent_id IS DISTINCT FROM _parent_id) THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
    END IF;
    IF _row.version <> _expected_versions[_i] THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT';
    END IF;
  END LOOP;

  -- Two-phase update to sidestep uniqueness ambiguity: shift to negative
  -- positions first, then to final positions.
  FOR _i IN 1.._n LOOP
    UPDATE public.business_meeting_agenda_items
      SET position = -1 - _i, version = version + 1
      WHERE id = _ordered_ids[_i];
  END LOOP;
  FOR _i IN 1.._n LOOP
    UPDATE public.business_meeting_agenda_items
      SET position = _i - 1
      WHERE id = _ordered_ids[_i];
  END LOOP;

  RETURN jsonb_build_object('reordered', _n);
END $$;

-- 7.5 DELETE (planned only; belt-and-braces trigger also enforces)
CREATE OR REPLACE FUNCTION public.business_meeting_agenda_item_delete(
  _item_id uuid,
  _expected_version integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
BEGIN
  SELECT * INTO _row FROM public.business_meeting_agenda_items WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_NOT_FOUND'; END IF;

  PERFORM public.bmai_authorize_organizer(_row.meeting_id, _uid);

  IF _row.version <> _expected_version THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT';
  END IF;
  IF _row.status <> 'planned' THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_INVALID_TRANSITION';
  END IF;

  DELETE FROM public.business_meeting_agenda_items WHERE id = _item_id;

  RETURN jsonb_build_object('deleted', _item_id);
END $$;

-- ---------- 8. FUNCTION GRANTS ----------
REVOKE ALL ON FUNCTION public.business_meeting_agenda_item_create(uuid,text,text,uuid,integer,uuid,uuid)             FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_agenda_item_update(uuid,integer,text,text,boolean,integer,boolean,uuid,boolean,uuid,boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_agenda_item_set_status(uuid,integer,text)                              FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_agenda_reorder(uuid,uuid,uuid[],integer[])                             FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_agenda_item_delete(uuid,integer)                                       FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.business_meeting_agenda_item_create(uuid,text,text,uuid,integer,uuid,uuid)           TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_agenda_item_update(uuid,integer,text,text,boolean,integer,boolean,uuid,boolean,uuid,boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_agenda_item_set_status(uuid,integer,text)                            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_agenda_reorder(uuid,uuid,uuid[],integer[])                           TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_agenda_item_delete(uuid,integer)                                     TO authenticated, service_role;

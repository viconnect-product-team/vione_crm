
-- ============================================================
-- BC-7.10 Turn B — Meeting Notes Domains (Private + Shared)
-- Two separate security domains. FORCE RLS. No client DML policies
-- except owner-scoped SELECT. All mutations via SECURITY DEFINER RPCs.
-- ============================================================

-- ============================================================
-- 1. PRIVATE NOTES
-- ============================================================

CREATE TABLE public.business_meeting_private_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.business_meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bmpn_unique_owner UNIQUE (meeting_id, user_id),
  CONSTRAINT bmpn_content_len_ck CHECK (char_length(content) <= 20000),
  CONSTRAINT bmpn_version_pos_ck CHECK (version >= 1)
);

CREATE INDEX bmpn_meeting_user_idx
  ON public.business_meeting_private_notes (meeting_id, user_id);

CREATE TRIGGER bmpn_updated_at BEFORE UPDATE ON public.business_meeting_private_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Immutability guard: meeting_id and user_id are immutable across updates.
CREATE OR REPLACE FUNCTION public.bmpn_guard_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.meeting_id IS DISTINCT FROM OLD.meeting_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER bmpn_guard_immutable_trg BEFORE UPDATE
  ON public.business_meeting_private_notes
  FOR EACH ROW EXECUTE FUNCTION public.bmpn_guard_immutable();

ALTER TABLE public.business_meeting_private_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_private_notes FORCE ROW LEVEL SECURITY;

-- SELECT: owner only. Organizer and other participants have no read path.
CREATE POLICY bmpn_select_owner
  ON public.business_meeting_private_notes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies. All writes via SECURITY DEFINER RPC.

GRANT SELECT ON public.business_meeting_private_notes TO authenticated;
GRANT ALL    ON public.business_meeting_private_notes TO service_role;

-- Private note upsert. Enforces owner identity server-side, requires
-- expectedVersion for subsequent saves, and guards against concurrent
-- duplicate creates via UNIQUE(meeting_id, user_id).
CREATE OR REPLACE FUNCTION public.business_meeting_private_note_upsert(
  _meeting_id uuid,
  _content text,
  _expected_version integer DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _content_norm text;
  _row record;
  _meeting_exists boolean;
  _is_participant boolean;
  _is_organizer boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_FORBIDDEN';
  END IF;

  -- Meeting must exist. Writer must be a participant OR the organizer
  -- (organizer may not always be a participant row, but is authorized).
  SELECT true INTO _meeting_exists FROM public.business_meetings
    WHERE id = _meeting_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_NOT_FOUND';
  END IF;

  SELECT public.bm_is_participant(_meeting_id, _uid) INTO _is_participant;
  SELECT EXISTS (
    SELECT 1 FROM public.business_meetings
    WHERE id = _meeting_id AND organizer_user_id = _uid
  ) INTO _is_organizer;
  IF NOT (_is_participant OR _is_organizer) THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_FORBIDDEN';
  END IF;

  -- Normalize content.
  _content_norm := COALESCE(_content, '');
  IF char_length(_content_norm) > 20000 THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
  END IF;

  -- Try to read existing row.
  SELECT * INTO _row FROM public.business_meeting_private_notes
    WHERE meeting_id = _meeting_id AND user_id = _uid
    FOR UPDATE;

  IF NOT FOUND THEN
    -- First save. expected_version must be NULL or 0.
    IF _expected_version IS NOT NULL AND _expected_version <> 0 THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT';
    END IF;
    BEGIN
      INSERT INTO public.business_meeting_private_notes
        (meeting_id, user_id, content, version)
      VALUES (_meeting_id, _uid, _content_norm, 1)
      RETURNING * INTO _row;
    EXCEPTION WHEN unique_violation THEN
      -- Concurrent create landed first; treat as version conflict.
      RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT';
    END;
  ELSE
    IF _expected_version IS NULL THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT';
    END IF;
    IF _row.version <> _expected_version THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT';
    END IF;
    UPDATE public.business_meeting_private_notes
      SET content = _content_norm,
          version = version + 1
      WHERE id = _row.id AND version = _expected_version
      RETURNING * INTO _row;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT';
    END IF;
  END IF;

  -- No timeline / outbox events for private notes. No content in audit.
  RETURN to_jsonb(_row);
END $$;

REVOKE ALL ON FUNCTION public.business_meeting_private_note_upsert(uuid, text, integer)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_meeting_private_note_upsert(uuid, text, integer)
  TO authenticated;

-- ============================================================
-- 2. SHARED NOTES
-- ============================================================

CREATE TABLE public.business_meeting_shared_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL UNIQUE REFERENCES public.business_meetings(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  note_status text NOT NULL DEFAULT 'draft',
  updated_by_user_id uuid NOT NULL,
  published_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bmsn_status_ck CHECK (note_status IN ('draft','published')),
  CONSTRAINT bmsn_content_len_ck CHECK (char_length(content) <= 20000),
  CONSTRAINT bmsn_version_pos_ck CHECK (version >= 1)
);

CREATE INDEX bmsn_meeting_idx ON public.business_meeting_shared_notes (meeting_id);

CREATE TRIGGER bmsn_updated_at BEFORE UPDATE ON public.business_meeting_shared_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Immutability + terminal-status guard.
CREATE OR REPLACE FUNCTION public.bmsn_guard_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.meeting_id IS DISTINCT FROM OLD.meeting_id THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
  END IF;
  -- Published is terminal: no unpublish, no content edits after publish.
  IF OLD.note_status = 'published' THEN
    IF NEW.note_status <> 'published'
       OR NEW.content IS DISTINCT FROM OLD.content
       OR NEW.published_at IS DISTINCT FROM OLD.published_at THEN
      RAISE EXCEPTION 'MEETING_COLLABORATION_INVALID_TRANSITION';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER bmsn_guard_immutable_trg BEFORE UPDATE
  ON public.business_meeting_shared_notes
  FOR EACH ROW EXECUTE FUNCTION public.bmsn_guard_immutable();

ALTER TABLE public.business_meeting_shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_shared_notes FORCE ROW LEVEL SECURITY;

-- SELECT: meeting participants, organizer, platform admin.
CREATE POLICY bmsn_select
  ON public.business_meeting_shared_notes
  FOR SELECT TO authenticated
  USING (
    public.bm_is_participant(meeting_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.business_meetings m
      WHERE m.id = meeting_id AND m.organizer_user_id = auth.uid()
    )
    OR public.is_platform_admin()
  );

-- No client DML policies. All writes go through SECURITY DEFINER RPCs.

GRANT SELECT ON public.business_meeting_shared_notes TO authenticated;
GRANT ALL    ON public.business_meeting_shared_notes TO service_role;

-- Reuse agenda's authorization helper style: organizer only, meeting not cancelled.
CREATE OR REPLACE FUNCTION public.bmsn_authorize_organizer(_meeting_id uuid, _uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m record;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'MEETING_COLLABORATION_FORBIDDEN'; END IF;
  SELECT id, organizer_user_id, status INTO _m
    FROM public.business_meetings WHERE id = _meeting_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_NOT_FOUND'; END IF;
  IF _m.organizer_user_id <> _uid THEN RAISE EXCEPTION 'MEETING_COLLABORATION_FORBIDDEN'; END IF;
  IF _m.status = 'cancelled' THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_INVALID_STATE';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.bmsn_authorize_organizer(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Get-or-create shared note. Organizer only.
CREATE OR REPLACE FUNCTION public.business_meeting_shared_note_get_or_create(
  _meeting_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
BEGIN
  PERFORM public.bmsn_authorize_organizer(_meeting_id, _uid);

  SELECT * INTO _row FROM public.business_meeting_shared_notes
    WHERE meeting_id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN
    BEGIN
      INSERT INTO public.business_meeting_shared_notes
        (meeting_id, content, note_status, updated_by_user_id, version)
      VALUES (_meeting_id, '', 'draft', _uid, 1)
      RETURNING * INTO _row;
    EXCEPTION WHEN unique_violation THEN
      SELECT * INTO _row FROM public.business_meeting_shared_notes
        WHERE meeting_id = _meeting_id FOR UPDATE;
    END;
  END IF;
  RETURN to_jsonb(_row);
END $$;

REVOKE ALL ON FUNCTION public.business_meeting_shared_note_get_or_create(uuid)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_meeting_shared_note_get_or_create(uuid)
  TO authenticated;

-- Update draft. Organizer only. Blocked when published.
CREATE OR REPLACE FUNCTION public.business_meeting_shared_note_update(
  _meeting_id uuid,
  _expected_version integer,
  _content text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
  _content_norm text;
BEGIN
  PERFORM public.bmsn_authorize_organizer(_meeting_id, _uid);

  _content_norm := COALESCE(_content, '');
  IF char_length(_content_norm) > 20000 THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VALIDATION';
  END IF;

  SELECT * INTO _row FROM public.business_meeting_shared_notes
    WHERE meeting_id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_NOT_FOUND'; END IF;
  IF _row.note_status = 'published' THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_INVALID_TRANSITION';
  END IF;
  IF _row.version <> _expected_version THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT';
  END IF;

  UPDATE public.business_meeting_shared_notes
    SET content = _content_norm,
        updated_by_user_id = _uid,
        version = version + 1
    WHERE id = _row.id AND version = _expected_version
    RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT'; END IF;

  RETURN to_jsonb(_row);
END $$;

REVOKE ALL ON FUNCTION public.business_meeting_shared_note_update(uuid, integer, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_meeting_shared_note_update(uuid, integer, text)
  TO authenticated;

-- Publish shared note. Organizer only. draft → published (terminal).
CREATE OR REPLACE FUNCTION public.business_meeting_shared_note_publish(
  _meeting_id uuid,
  _expected_version integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
BEGIN
  PERFORM public.bmsn_authorize_organizer(_meeting_id, _uid);

  SELECT * INTO _row FROM public.business_meeting_shared_notes
    WHERE meeting_id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_NOT_FOUND'; END IF;
  IF _row.note_status = 'published' THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_INVALID_TRANSITION';
  END IF;
  IF _row.version <> _expected_version THEN
    RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT';
  END IF;

  UPDATE public.business_meeting_shared_notes
    SET note_status = 'published',
        published_at = now(),
        updated_by_user_id = _uid,
        version = version + 1
    WHERE id = _row.id AND version = _expected_version
    RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_COLLABORATION_VERSION_CONFLICT'; END IF;

  -- Emit shared-scope timeline event (no content included).
  PERFORM public.bm_log_event(
    _meeting_id, _uid, 'business_meeting_shared_notes_published', NULL, NULL,
    'shared_notes_published:' || _row.id::text,
    jsonb_build_object(
      'sharedNoteId', _row.id,
      'version', _row.version,
      'publishedAt', _row.published_at
    )
  );

  RETURN to_jsonb(_row);
END $$;

REVOKE ALL ON FUNCTION public.business_meeting_shared_note_publish(uuid, integer)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_meeting_shared_note_publish(uuid, integer)
  TO authenticated;


-- ============================================================
-- BC-7.9 Turn A — Meeting Outcome Domain Foundation
-- Additive. Introduces canonical outcome per meeting with
-- optimistic concurrency, idempotency, exactly-once events,
-- organizer-only authority, participant read via RLS, FORCE RLS
-- and no direct DML policies (writes only via SECURITY DEFINER).
-- ============================================================

-- ---------- 1. TABLE ----------
CREATE TABLE public.business_meeting_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.business_meetings(id) ON DELETE CASCADE,
  recorded_by_user_id uuid NOT NULL,
  outcome_type text NOT NULL,
  outcome_status text NOT NULL DEFAULT 'draft',
  summary text,
  finalized_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  client_request_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bmo_status_ck CHECK (outcome_status IN ('draft','finalized')),
  CONSTRAINT bmo_type_ck CHECK (outcome_type IN (
    'positive_progress','agreement_reached','opportunity_created',
    'follow_up_required','no_decision','blocked','not_a_fit',
    'completed_objective','informational','other'
  )),
  CONSTRAINT bmo_summary_len_ck CHECK (summary IS NULL OR length(summary) <= 2000),
  CONSTRAINT bmo_version_pos_ck CHECK (version >= 1),
  CONSTRAINT bmo_finalized_consistency_ck CHECK (
    (outcome_status = 'finalized' AND finalized_at IS NOT NULL)
    OR (outcome_status = 'draft' AND finalized_at IS NULL)
  ),
  CONSTRAINT bmo_meeting_unique UNIQUE (meeting_id)
);

-- Idempotency: repeated client_request_id resolves to same row per meeting.
CREATE UNIQUE INDEX bmo_meeting_client_req_unique
  ON public.business_meeting_outcomes (meeting_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

CREATE INDEX bmo_recorded_by_idx ON public.business_meeting_outcomes (recorded_by_user_id);

-- ---------- 2. updated_at trigger ----------
CREATE TRIGGER bmo_updated_at BEFORE UPDATE ON public.business_meeting_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 3. IMMUTABILITY GUARD ----------
-- meeting_id + recorded_by_user_id are immutable across updates.
-- Once finalized, only ordinary re-finalize path is allowed (no direct UPDATE,
-- but this guard is a belt-and-braces defence against service-role misuse).
CREATE OR REPLACE FUNCTION public.bmo_guard_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.meeting_id IS DISTINCT FROM OLD.meeting_id THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_INVALID_STATE';
  END IF;
  IF NEW.recorded_by_user_id IS DISTINCT FROM OLD.recorded_by_user_id THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_INVALID_STATE';
  END IF;
  IF OLD.outcome_status = 'finalized'
     AND (
       NEW.outcome_type IS DISTINCT FROM OLD.outcome_type
       OR NEW.summary IS DISTINCT FROM OLD.summary
       OR NEW.outcome_status IS DISTINCT FROM OLD.outcome_status
       OR NEW.finalized_at IS DISTINCT FROM OLD.finalized_at
     ) THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_FINALIZED';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER bmo_guard_immutable_trg BEFORE UPDATE ON public.business_meeting_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.bmo_guard_immutable();

-- Block DELETE always.
CREATE OR REPLACE FUNCTION public.bmo_block_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'MEETING_OUTCOME_FINALIZED';
END $$;

CREATE TRIGGER bmo_block_delete_trg BEFORE DELETE ON public.business_meeting_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.bmo_block_delete();

-- ---------- 4. RLS ----------
ALTER TABLE public.business_meeting_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_outcomes FORCE ROW LEVEL SECURITY;

-- Read: any participant (organizer or invitee) of the meeting; platform admin.
CREATE POLICY bmo_select ON public.business_meeting_outcomes
  FOR SELECT TO authenticated
  USING (
    public.bm_is_participant(meeting_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.business_meetings m
      WHERE m.id = meeting_id AND m.organizer_user_id = auth.uid()
    )
    OR public.is_platform_admin()
  );

-- No INSERT/UPDATE/DELETE policies: all writes must go via SECURITY DEFINER
-- functions below.

-- ---------- 5. GRANTS ----------
GRANT SELECT ON public.business_meeting_outcomes TO authenticated;
GRANT ALL    ON public.business_meeting_outcomes TO service_role;

-- ---------- 6. HELPERS ----------
CREATE OR REPLACE FUNCTION public.bmo_is_meeting_eligible(_status public.business_meeting_status)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  -- Turn A: only completed meetings are eligible in practice (in_progress is
  -- reserved in the spec but not an enum member yet). Extend defensively.
  SELECT _status = 'completed';
$$;

-- ---------- 7. RPCS ----------

-- 7.1 CREATE (organizer only, idempotent by client_request_id)
CREATE OR REPLACE FUNCTION public.business_meeting_outcome_create(
  _meeting_id uuid,
  _outcome_type text,
  _summary text DEFAULT NULL,
  _client_request_id text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _m record;
  _existing record;
  _row record;
  _summary text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'MEETING_OUTCOME_FORBIDDEN'; END IF;

  -- Type validation
  IF _outcome_type NOT IN (
    'positive_progress','agreement_reached','opportunity_created',
    'follow_up_required','no_decision','blocked','not_a_fit',
    'completed_objective','informational','other'
  ) THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_INVALID_TYPE';
  END IF;

  -- Summary normalisation
  _summary := NULLIF(btrim(COALESCE(_summary, '')), '');
  IF _summary IS NOT NULL AND length(_summary) > 2000 THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_INVALID_SUMMARY';
  END IF;

  -- Load meeting and authorize (organizer only)
  SELECT id, organizer_user_id, status INTO _m
    FROM public.business_meetings WHERE id = _meeting_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_OUTCOME_NOT_FOUND'; END IF;
  IF _m.organizer_user_id <> _uid THEN RAISE EXCEPTION 'MEETING_OUTCOME_FORBIDDEN'; END IF;
  IF NOT public.bmo_is_meeting_eligible(_m.status) THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_INVALID_STATE';
  END IF;

  -- Idempotency: same client_request_id → return existing
  IF _client_request_id IS NOT NULL THEN
    SELECT * INTO _existing FROM public.business_meeting_outcomes
      WHERE meeting_id = _meeting_id AND client_request_id = _client_request_id;
    IF FOUND THEN
      RETURN to_jsonb(_existing);
    END IF;
  END IF;

  -- One-per-meeting: fail if any other row exists
  IF EXISTS (SELECT 1 FROM public.business_meeting_outcomes WHERE meeting_id = _meeting_id) THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_ALREADY_EXISTS';
  END IF;

  INSERT INTO public.business_meeting_outcomes
    (meeting_id, recorded_by_user_id, outcome_type, outcome_status, summary,
     version, client_request_id)
  VALUES
    (_meeting_id, _uid, _outcome_type, 'draft', _summary, 1, _client_request_id)
  RETURNING * INTO _row;

  -- Exactly-once event: mutation_key scoped per meeting + operation + outcome id
  PERFORM public.bm_log_event(
    _meeting_id, _uid, 'business_meeting_outcome_created', NULL, NULL,
    'outcome_create:' || _row.id::text,
    jsonb_build_object(
      'outcomeId', _row.id,
      'outcomeType', _row.outcome_type,
      'outcomeStatus', _row.outcome_status,
      'version', _row.version
    )
  );

  RETURN to_jsonb(_row);
END $$;

-- 7.2 UPDATE (organizer only, draft only, optimistic concurrency)
CREATE OR REPLACE FUNCTION public.business_meeting_outcome_update(
  _meeting_id uuid,
  _expected_version integer,
  _outcome_type text DEFAULT NULL,
  _summary text DEFAULT NULL,
  _clear_summary boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _m record;
  _row record;
  _next_type text;
  _next_summary text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'MEETING_OUTCOME_FORBIDDEN'; END IF;

  SELECT id, organizer_user_id, status INTO _m
    FROM public.business_meetings WHERE id = _meeting_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_OUTCOME_NOT_FOUND'; END IF;
  IF _m.organizer_user_id <> _uid THEN RAISE EXCEPTION 'MEETING_OUTCOME_FORBIDDEN'; END IF;
  IF NOT public.bmo_is_meeting_eligible(_m.status) THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_INVALID_STATE';
  END IF;

  SELECT * INTO _row FROM public.business_meeting_outcomes
    WHERE meeting_id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_OUTCOME_NOT_FOUND'; END IF;
  IF _row.outcome_status = 'finalized' THEN RAISE EXCEPTION 'MEETING_OUTCOME_FINALIZED'; END IF;
  IF _row.version <> _expected_version THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_VERSION_CONFLICT';
  END IF;

  _next_type := COALESCE(_outcome_type, _row.outcome_type);
  IF _next_type NOT IN (
    'positive_progress','agreement_reached','opportunity_created',
    'follow_up_required','no_decision','blocked','not_a_fit',
    'completed_objective','informational','other'
  ) THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_INVALID_TYPE';
  END IF;

  IF _clear_summary THEN
    _next_summary := NULL;
  ELSIF _summary IS NOT NULL THEN
    _next_summary := NULLIF(btrim(_summary), '');
    IF _next_summary IS NOT NULL AND length(_next_summary) > 2000 THEN
      RAISE EXCEPTION 'MEETING_OUTCOME_INVALID_SUMMARY';
    END IF;
  ELSE
    _next_summary := _row.summary;
  END IF;

  UPDATE public.business_meeting_outcomes
    SET outcome_type = _next_type,
        summary = _next_summary,
        version = version + 1
    WHERE id = _row.id AND version = _expected_version
    RETURNING * INTO _row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_VERSION_CONFLICT';
  END IF;

  PERFORM public.bm_log_event(
    _meeting_id, _uid, 'business_meeting_outcome_updated', NULL, NULL,
    'outcome_update:' || _row.id::text || ':' || _row.version::text,
    jsonb_build_object(
      'outcomeId', _row.id,
      'outcomeType', _row.outcome_type,
      'outcomeStatus', _row.outcome_status,
      'version', _row.version
    )
  );

  RETURN to_jsonb(_row);
END $$;

-- 7.3 FINALIZE (organizer only, idempotent re-finalize)
CREATE OR REPLACE FUNCTION public.business_meeting_outcome_finalize(
  _meeting_id uuid,
  _expected_version integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _m record;
  _row record;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'MEETING_OUTCOME_FORBIDDEN'; END IF;

  SELECT id, organizer_user_id, status INTO _m
    FROM public.business_meetings WHERE id = _meeting_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_OUTCOME_NOT_FOUND'; END IF;
  IF _m.organizer_user_id <> _uid THEN RAISE EXCEPTION 'MEETING_OUTCOME_FORBIDDEN'; END IF;
  IF NOT public.bmo_is_meeting_eligible(_m.status) THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_INVALID_STATE';
  END IF;

  SELECT * INTO _row FROM public.business_meeting_outcomes
    WHERE meeting_id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_OUTCOME_NOT_FOUND'; END IF;

  -- Idempotent re-finalize: same canonical record, no version bump, no event.
  IF _row.outcome_status = 'finalized' THEN
    IF _row.version <> _expected_version THEN
      -- Accept either the pre-finalize expected version or the current version.
      IF _row.version <> _expected_version + 1 THEN
        RAISE EXCEPTION 'MEETING_OUTCOME_VERSION_CONFLICT';
      END IF;
    END IF;
    RETURN to_jsonb(_row);
  END IF;

  IF _row.version <> _expected_version THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_VERSION_CONFLICT';
  END IF;

  UPDATE public.business_meeting_outcomes
    SET outcome_status = 'finalized',
        finalized_at = now(),
        version = version + 1
    WHERE id = _row.id AND version = _expected_version
    RETURNING * INTO _row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEETING_OUTCOME_VERSION_CONFLICT';
  END IF;

  PERFORM public.bm_log_event(
    _meeting_id, _uid, 'business_meeting_outcome_finalized', NULL, NULL,
    'outcome_finalize:' || _row.id::text,
    jsonb_build_object(
      'outcomeId', _row.id,
      'outcomeType', _row.outcome_type,
      'outcomeStatus', _row.outcome_status,
      'version', _row.version
    )
  );

  RETURN to_jsonb(_row);
END $$;

-- ---------- 8. FUNCTION GRANTS ----------
REVOKE ALL ON FUNCTION public.business_meeting_outcome_create(uuid,text,text,text)       FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_outcome_update(uuid,integer,text,text,boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_outcome_finalize(uuid,integer)            FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.business_meeting_outcome_create(uuid,text,text,text)     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_outcome_update(uuid,integer,text,text,boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_outcome_finalize(uuid,integer)          TO authenticated, service_role;

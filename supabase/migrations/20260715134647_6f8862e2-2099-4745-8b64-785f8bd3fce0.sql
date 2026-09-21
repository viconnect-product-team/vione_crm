
-- BC-7.7 Turn B1 — Availability & Scheduling RPCs.

-- 1. Update availability preferences (owner only, versioned upsert)
CREATE OR REPLACE FUNCTION public.business_availability_preferences_update(
  _timezone text,
  _working_days int[],
  _working_hours jsonb,
  _minimum_notice_minutes int,
  _default_meeting_duration_minutes int,
  _buffer_before_minutes int,
  _buffer_after_minutes int,
  _expected_version int DEFAULT NULL
) RETURNS public.business_availability_preferences
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.business_availability_preferences;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'CALENDAR_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  IF _timezone IS NULL OR length(_timezone) = 0 OR length(_timezone) > 64 THEN
    RAISE EXCEPTION 'CALENDAR_INVALID_TIMEZONE' USING ERRCODE = '22023';
  END IF;
  IF _minimum_notice_minutes < 0 OR _minimum_notice_minutes > 10080 THEN
    RAISE EXCEPTION 'CALENDAR_INVALID_INPUT' USING ERRCODE = '22023';
  END IF;
  IF _default_meeting_duration_minutes < 15 OR _default_meeting_duration_minutes > 480 THEN
    RAISE EXCEPTION 'CALENDAR_INVALID_DURATION' USING ERRCODE = '22023';
  END IF;
  IF _buffer_before_minutes < 0 OR _buffer_before_minutes > 240
     OR _buffer_after_minutes < 0 OR _buffer_after_minutes > 240 THEN
    RAISE EXCEPTION 'CALENDAR_INVALID_INPUT' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row FROM public.business_availability_preferences WHERE user_id = v_uid FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.business_availability_preferences(
      user_id, timezone, working_days, working_hours,
      minimum_notice_minutes, default_meeting_duration_minutes,
      buffer_before_minutes, buffer_after_minutes, version
    ) VALUES (
      v_uid, _timezone, _working_days, _working_hours,
      _minimum_notice_minutes, _default_meeting_duration_minutes,
      _buffer_before_minutes, _buffer_after_minutes, 1
    ) RETURNING * INTO v_row;
    RETURN v_row;
  END IF;

  IF _expected_version IS NOT NULL AND v_row.version <> _expected_version THEN
    RAISE EXCEPTION 'CALENDAR_VERSION_CONFLICT' USING ERRCODE = '40001';
  END IF;

  UPDATE public.business_availability_preferences SET
    timezone = _timezone,
    working_days = _working_days,
    working_hours = _working_hours,
    minimum_notice_minutes = _minimum_notice_minutes,
    default_meeting_duration_minutes = _default_meeting_duration_minutes,
    buffer_before_minutes = _buffer_before_minutes,
    buffer_after_minutes = _buffer_after_minutes,
    version = v_row.version + 1,
    updated_at = now()
  WHERE user_id = v_uid
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

-- 2. Create meeting time proposals (organizer only)
CREATE OR REPLACE FUNCTION public.business_meeting_time_proposals_create(
  _meeting_id uuid,
  _proposals jsonb  -- [{start_at, end_at, timezone}]
) RETURNS SETOF public.business_meeting_time_proposals
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_meeting public.business_meetings;
  v_count int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'CALENDAR_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_meeting FROM public.business_meetings WHERE id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEETING_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  IF v_meeting.organizer_user_id <> v_uid THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  IF v_meeting.status NOT IN ('draft','proposed') THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_LOCKED' USING ERRCODE = '55000';
  END IF;
  v_count := jsonb_array_length(_proposals);
  IF v_count = 0 OR v_count > 5 THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_INVALID' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH ins AS (
    INSERT INTO public.business_meeting_time_proposals(
      meeting_id, proposed_by_user_id, start_at, end_at, timezone, status, version
    )
    SELECT
      _meeting_id, v_uid,
      (elem->>'start_at')::timestamptz,
      (elem->>'end_at')::timestamptz,
      elem->>'timezone',
      'active',
      1
    FROM jsonb_array_elements(_proposals) elem
    RETURNING *
  )
  SELECT * FROM ins;
END $$;

-- 3. Respond to a meeting time proposal (participant only)
CREATE OR REPLACE FUNCTION public.business_meeting_time_proposal_respond(
  _proposal_id uuid,
  _response text  -- 'available' | 'unavailable' | 'tentative'
) RETURNS public.business_meeting_time_proposal_responses
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_proposal public.business_meeting_time_proposals;
  v_participant_id uuid;
  v_row public.business_meeting_time_proposal_responses;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'CALENDAR_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  IF _response NOT IN ('available','unavailable','tentative') THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_INVALID' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_proposal FROM public.business_meeting_time_proposals WHERE id = _proposal_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  IF v_proposal.status <> 'active' THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_LOCKED' USING ERRCODE = '55000';
  END IF;
  SELECT id INTO v_participant_id FROM public.business_meeting_participants
    WHERE meeting_id = v_proposal.meeting_id AND user_id = v_uid AND left_at IS NULL;
  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.business_meeting_time_proposal_responses(proposal_id, participant_id, response, responded_at)
  VALUES (_proposal_id, v_participant_id, _response, now())
  ON CONFLICT (proposal_id, participant_id) DO UPDATE
    SET response = EXCLUDED.response, responded_at = now()
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

-- 4. Select a meeting time proposal (organizer only) — B1 structural
CREATE OR REPLACE FUNCTION public.business_meeting_time_proposal_select(
  _proposal_id uuid,
  _expected_meeting_version int DEFAULT NULL
) RETURNS public.business_meeting_time_proposals
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_meeting public.business_meetings;
  v_proposal public.business_meeting_time_proposals;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'CALENDAR_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_proposal FROM public.business_meeting_time_proposals WHERE id = _proposal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_meeting FROM public.business_meetings WHERE id = v_proposal.meeting_id FOR UPDATE;
  IF v_meeting.organizer_user_id <> v_uid THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  IF _expected_meeting_version IS NOT NULL
     AND coalesce(v_meeting.active_proposal_version, 0) <> _expected_meeting_version THEN
    RAISE EXCEPTION 'CALENDAR_VERSION_CONFLICT' USING ERRCODE = '40001';
  END IF;
  IF v_proposal.status <> 'active' THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_NOT_SELECTABLE' USING ERRCODE = '55000';
  END IF;

  UPDATE public.business_meeting_time_proposals
    SET status = 'withdrawn', updated_at = now()
    WHERE meeting_id = v_proposal.meeting_id AND id <> _proposal_id AND status = 'active';

  UPDATE public.business_meeting_time_proposals
    SET status = 'selected', updated_at = now(), version = version + 1
    WHERE id = _proposal_id
    RETURNING * INTO v_proposal;

  RETURN v_proposal;
END $$;

-- 5. Reconcile calendar sync (invoked by sync worker in B2)
CREATE OR REPLACE FUNCTION public.business_meeting_calendar_sync_reconcile(
  _meeting_id uuid,
  _participant_user_id uuid,
  _provider text,
  _sync_status text,
  _external_event_ref text DEFAULT NULL,
  _error_code text DEFAULT NULL
) RETURNS public.business_meeting_calendar_projections
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.business_meeting_calendar_projections;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'CALENDAR_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  -- Authority: caller must be the participant themselves OR service_role
  IF v_uid <> _participant_user_id AND current_setting('request.jwt.claims', true)::jsonb->>'role' <> 'service_role' THEN
    RAISE EXCEPTION 'CALENDAR_SYNC_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  IF _sync_status NOT IN ('pending','synced','retry_scheduled','failed','cancelled') THEN
    RAISE EXCEPTION 'CALENDAR_SYNC_FAILED' USING ERRCODE = '22023';
  END IF;
  IF _provider NOT IN ('google','microsoft','internal') THEN
    RAISE EXCEPTION 'CALENDAR_PROVIDER_UNAVAILABLE' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.business_meeting_calendar_projections(
    meeting_id, participant_user_id, provider, sync_status,
    external_event_ref, last_synced_at, last_error_code, retry_count
  ) VALUES (
    _meeting_id, _participant_user_id, _provider, _sync_status,
    _external_event_ref,
    CASE WHEN _sync_status = 'synced' THEN now() ELSE NULL END,
    _error_code,
    CASE WHEN _sync_status = 'retry_scheduled' THEN 1 ELSE 0 END
  )
  ON CONFLICT (meeting_id, participant_user_id) DO UPDATE SET
    provider = EXCLUDED.provider,
    sync_status = EXCLUDED.sync_status,
    external_event_ref = COALESCE(EXCLUDED.external_event_ref, public.business_meeting_calendar_projections.external_event_ref),
    last_synced_at = CASE WHEN EXCLUDED.sync_status = 'synced' THEN now() ELSE public.business_meeting_calendar_projections.last_synced_at END,
    last_error_code = EXCLUDED.last_error_code,
    retry_count = CASE WHEN EXCLUDED.sync_status = 'retry_scheduled'
                       THEN public.business_meeting_calendar_projections.retry_count + 1
                       ELSE public.business_meeting_calendar_projections.retry_count END,
    updated_at = now()
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

-- Uniqueness needed for the response upsert and the projection upsert
CREATE UNIQUE INDEX IF NOT EXISTS business_meeting_time_proposal_responses_unique
  ON public.business_meeting_time_proposal_responses(proposal_id, participant_id);

CREATE UNIQUE INDEX IF NOT EXISTS business_meeting_calendar_projections_unique
  ON public.business_meeting_calendar_projections(meeting_id, participant_user_id);

-- Revoke public execute; grant to authenticated + service_role
REVOKE ALL ON FUNCTION public.business_availability_preferences_update(text,int[],jsonb,int,int,int,int,int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.business_meeting_time_proposals_create(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.business_meeting_time_proposal_respond(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.business_meeting_time_proposal_select(uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.business_meeting_calendar_sync_reconcile(uuid, uuid, text, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.business_availability_preferences_update(text,int[],jsonb,int,int,int,int,int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_time_proposals_create(uuid, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_time_proposal_respond(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_time_proposal_select(uuid, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_meeting_calendar_sync_reconcile(uuid, uuid, text, text, text, text) TO authenticated, service_role;

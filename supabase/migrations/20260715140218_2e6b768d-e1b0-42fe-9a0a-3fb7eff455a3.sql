
-- ── 1. business_meetings: scheduling fields ────────────────────────────────
ALTER TABLE public.business_meetings
  ADD COLUMN IF NOT EXISTS scheduling_mode text NOT NULL DEFAULT 'unscheduled',
  ADD COLUMN IF NOT EXISTS scheduled_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_end_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_timezone text,
  ADD COLUMN IF NOT EXISTS selected_time_proposal_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'business_meetings_scheduling_mode_check'
  ) THEN
    ALTER TABLE public.business_meetings
      ADD CONSTRAINT business_meetings_scheduling_mode_check
      CHECK (scheduling_mode IN ('unscheduled','scheduled'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'business_meetings_selected_time_proposal_fkey'
  ) THEN
    ALTER TABLE public.business_meetings
      ADD CONSTRAINT business_meetings_selected_time_proposal_fkey
      FOREIGN KEY (selected_time_proposal_id)
      REFERENCES public.business_meeting_time_proposals(id)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- ── 2. business_meeting_time_proposals: idempotency key ────────────────────
ALTER TABLE public.business_meeting_time_proposals
  ADD COLUMN IF NOT EXISTS client_request_id text;

CREATE UNIQUE INDEX IF NOT EXISTS bmtp_client_request_unique
  ON public.business_meeting_time_proposals (meeting_id, proposed_by_user_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

-- Prevent duplicate active slots (same start/end) inside the same meeting.
CREATE UNIQUE INDEX IF NOT EXISTS bmtp_active_unique_slot
  ON public.business_meeting_time_proposals (meeting_id, start_at, end_at)
  WHERE status = 'active';

-- ── 3. business_meeting_calendar_projections: retry scheduling ─────────────
ALTER TABLE public.business_meeting_calendar_projections
  ADD COLUMN IF NOT EXISTS retry_after_at timestamptz,
  ADD COLUMN IF NOT EXISTS permanent_failure boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_bmcp_retry_due
  ON public.business_meeting_calendar_projections (retry_after_at)
  WHERE sync_status = 'retry_scheduled' AND permanent_failure = false;

-- ── 4. events: mutation_key uniqueness for exactly-once emission ───────────
CREATE UNIQUE INDEX IF NOT EXISTS bm_events_mutation_key_unique
  ON public.business_meeting_events (meeting_id, mutation_key)
  WHERE mutation_key IS NOT NULL;

-- ── 5. Rewrite business_meeting_time_proposals_create ──────────────────────
CREATE OR REPLACE FUNCTION public.business_meeting_time_proposals_create(
  _meeting_id uuid,
  _proposals jsonb,
  _client_request_id text DEFAULT NULL
)
RETURNS SETOF public.business_meeting_time_proposals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_meeting public.business_meetings;
  v_count int;
  v_dupes int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'CALENDAR_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  -- Idempotency: same organizer replays with same client_request_id → return
  -- previously created round instead of inserting a second one.
  IF _client_request_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.business_meeting_time_proposals
      WHERE meeting_id = _meeting_id
        AND proposed_by_user_id = v_uid
        AND client_request_id = _client_request_id
    ) THEN
      RETURN QUERY
        SELECT * FROM public.business_meeting_time_proposals
        WHERE meeting_id = _meeting_id
          AND proposed_by_user_id = v_uid
          AND client_request_id = _client_request_id
        ORDER BY start_at;
      RETURN;
    END IF;
  END IF;

  SELECT * INTO v_meeting FROM public.business_meetings
    WHERE id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEETING_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  IF v_meeting.organizer_user_id <> v_uid THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  IF v_meeting.status NOT IN ('draft','proposed') THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_LOCKED' USING ERRCODE = '55000';
  END IF;
  IF v_meeting.scheduling_mode = 'scheduled' THEN
    -- Rescheduling is deferred; a scheduled meeting cannot spawn a new round.
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_LOCKED' USING ERRCODE = '55000';
  END IF;

  v_count := jsonb_array_length(_proposals);
  IF v_count = 0 OR v_count > 5 THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_INVALID' USING ERRCODE = '22023';
  END IF;

  -- Reject duplicate (start,end) inside one request payload.
  SELECT count(*) - count(DISTINCT ((elem->>'start_at')||'|'||(elem->>'end_at')))
    INTO v_dupes
  FROM jsonb_array_elements(_proposals) elem;
  IF v_dupes > 0 THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_INVALID' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH ins AS (
    INSERT INTO public.business_meeting_time_proposals(
      meeting_id, proposed_by_user_id, start_at, end_at, timezone, status, version, client_request_id
    )
    SELECT
      _meeting_id, v_uid,
      (elem->>'start_at')::timestamptz,
      (elem->>'end_at')::timestamptz,
      elem->>'timezone',
      'active', 1, _client_request_id
    FROM jsonb_array_elements(_proposals) elem
    RETURNING *
  ),
  evt AS (
    INSERT INTO public.business_meeting_events (
      meeting_id, actor_user_id, event_type, source_type, metadata, mutation_key, occurred_at
    )
    SELECT
      _meeting_id, v_uid, 'business_meeting_time_proposals_created', 'manual'::business_meeting_source_type,
      jsonb_build_object('count', v_count),
      CASE WHEN _client_request_id IS NULL THEN NULL
           ELSE 'time_proposals_created:'||_client_request_id END,
      now()
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT * FROM ins;
END $$;

-- Backfill grants (RPC signature changed).
REVOKE ALL ON FUNCTION public.business_meeting_time_proposals_create(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_meeting_time_proposals_create(uuid, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_meeting_time_proposals_create(uuid, jsonb, text) TO service_role;

-- ── 6. Rewrite business_meeting_time_proposal_select ───────────────────────
CREATE OR REPLACE FUNCTION public.business_meeting_time_proposal_select(
  _proposal_id uuid,
  _expected_meeting_version integer DEFAULT NULL
)
RETURNS public.business_meeting_time_proposals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_meeting public.business_meetings;
  v_proposal public.business_meeting_time_proposals;
  v_required_count int;
  v_available_count int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'CALENDAR_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_proposal
    FROM public.business_meeting_time_proposals
    WHERE id = _proposal_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_meeting
    FROM public.business_meetings
    WHERE id = v_proposal.meeting_id
    FOR UPDATE;
  IF v_meeting.organizer_user_id <> v_uid THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  IF _expected_meeting_version IS NOT NULL
     AND coalesce(v_meeting.active_proposal_version, 0) <> _expected_meeting_version THEN
    RAISE EXCEPTION 'CALENDAR_VERSION_CONFLICT' USING ERRCODE = '40001';
  END IF;

  -- Idempotency: already-selected proposal returns as-is (no duplicate event).
  IF v_proposal.status = 'selected' THEN
    RETURN v_proposal;
  END IF;

  IF v_proposal.status <> 'active' THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_NOT_SELECTABLE' USING ERRCODE = '55000';
  END IF;

  IF v_meeting.status NOT IN ('draft','proposed','confirmed') THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_NOT_SELECTABLE' USING ERRCODE = '55000';
  END IF;
  -- Rescheduling deferred: cannot re-select on an already scheduled meeting
  -- with a different proposal.
  IF v_meeting.scheduling_mode = 'scheduled'
     AND v_meeting.selected_time_proposal_id IS NOT NULL
     AND v_meeting.selected_time_proposal_id <> _proposal_id THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_NOT_SELECTABLE' USING ERRCODE = '55000';
  END IF;

  -- Every REQUIRED, still-active participant (other than organizer) must
  -- have response='available' for this proposal.
  SELECT count(*) INTO v_required_count
    FROM public.business_meeting_participants
    WHERE meeting_id = v_meeting.id
      AND left_at IS NULL
      AND role = 'required'::business_meeting_participant_role;

  SELECT count(*) INTO v_available_count
    FROM public.business_meeting_participants p
    JOIN public.business_meeting_time_proposal_responses r
      ON r.proposal_id = _proposal_id AND r.participant_id = p.id
    WHERE p.meeting_id = v_meeting.id
      AND p.left_at IS NULL
      AND p.role = 'required'::business_meeting_participant_role
      AND r.response = 'available';

  IF v_required_count > 0 AND v_available_count < v_required_count THEN
    RAISE EXCEPTION 'MEETING_TIME_PROPOSAL_NOT_SELECTABLE' USING ERRCODE = '55000';
  END IF;

  -- Withdraw sibling active proposals.
  UPDATE public.business_meeting_time_proposals
    SET status = 'withdrawn', updated_at = now()
    WHERE meeting_id = v_proposal.meeting_id
      AND id <> _proposal_id
      AND status = 'active';

  -- Mark selected + bump version.
  UPDATE public.business_meeting_time_proposals
    SET status = 'selected', updated_at = now(), version = version + 1
    WHERE id = _proposal_id
    RETURNING * INTO v_proposal;

  -- Update canonical meeting schedule atomically.
  UPDATE public.business_meetings
    SET scheduling_mode = 'scheduled',
        scheduled_start_at = v_proposal.start_at,
        scheduled_end_at = v_proposal.end_at,
        scheduled_timezone = v_proposal.timezone,
        selected_time_proposal_id = _proposal_id,
        updated_at = now()
    WHERE id = v_meeting.id;

  -- Emit exactly-once event.
  INSERT INTO public.business_meeting_events (
    meeting_id, actor_user_id, event_type, source_type, metadata, mutation_key, occurred_at
  ) VALUES (
    v_meeting.id, v_uid, 'business_meeting_time_selected', 'manual'::business_meeting_source_type,
    jsonb_build_object('proposal_id', _proposal_id, 'start_at', v_proposal.start_at, 'end_at', v_proposal.end_at),
    'time_selected:'||_proposal_id,
    now()
  ) ON CONFLICT DO NOTHING;

  -- Enqueue projection rows for the internal provider for every participant.
  INSERT INTO public.business_meeting_calendar_projections (
    meeting_id, participant_user_id, provider, sync_status, retry_count
  )
  SELECT v_meeting.id, p.user_id, 'internal', 'pending', 0
  FROM public.business_meeting_participants p
  WHERE p.meeting_id = v_meeting.id AND p.left_at IS NULL
  ON CONFLICT (meeting_id, participant_user_id, provider) DO NOTHING;

  RETURN v_proposal;
END $$;

REVOKE ALL ON FUNCTION public.business_meeting_time_proposal_select(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_meeting_time_proposal_select(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_meeting_time_proposal_select(uuid, integer) TO service_role;

-- ── 7. Sync worker claim (service-role only) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.business_meeting_calendar_projections_claim(
  _limit int DEFAULT 20,
  _now timestamptz DEFAULT now()
)
RETURNS SETOF public.business_meeting_calendar_projections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role','') <> 'service_role' THEN
    RAISE EXCEPTION 'CALENDAR_SYNC_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH claimed AS (
    SELECT id
      FROM public.business_meeting_calendar_projections
      WHERE permanent_failure = false
        AND (
          sync_status = 'pending'
          OR (sync_status = 'retry_scheduled' AND retry_after_at IS NOT NULL AND retry_after_at <= _now)
        )
      ORDER BY updated_at ASC
      LIMIT greatest(1, least(_limit, 100))
      FOR UPDATE SKIP LOCKED
  )
  UPDATE public.business_meeting_calendar_projections p
    SET updated_at = now()
    FROM claimed
    WHERE p.id = claimed.id
    RETURNING p.*;
END $$;

REVOKE ALL ON FUNCTION public.business_meeting_calendar_projections_claim(int, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_meeting_calendar_projections_claim(int, timestamptz) TO service_role;

-- ── 8. RLS INSERT policy: block direct writes to projections by users ──────
-- Table has SELECT-only for authenticated; no INSERT/UPDATE policies exist,
-- so users cannot write via the Data API. RPCs run SECURITY DEFINER.
-- Nothing to add.

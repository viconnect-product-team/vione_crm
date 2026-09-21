
-- BC-7.8 Turn B — Consolidated Meeting Workspace read model.
-- Two read-only functions. SECURITY INVOKER so existing meeting/participant
-- RLS remains the sole authority. Bucket predicates mirror the frozen Turn A
-- deriveBucket rules; parity tests live in the TS suite.

CREATE OR REPLACE FUNCTION public.business_meeting_workspace_list_v1(
  p_bucket           text,
  p_limit            int   DEFAULT 20,
  p_cursor_sort_at   timestamptz DEFAULT NULL,
  p_cursor_meeting_id uuid DEFAULT NULL,
  p_meeting_type     text  DEFAULT NULL,
  p_source_type      text  DEFAULT NULL,
  p_now              timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_limit int := greatest(1, least(coalesce(p_limit, 20), 100));
  v_result jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'MEETING_WORKSPACE_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF p_bucket NOT IN ('needs_action','upcoming','unscheduled','history','overview_upcoming','overview_history') THEN
    RAISE EXCEPTION 'MEETING_WORKSPACE_INVALID_CURSOR' USING ERRCODE = '22023';
  END IF;

  WITH viewer_meetings AS (
    SELECT
      m.id, m.title, m.description, m.meeting_type, m.status,
      m.timezone, m.source_type, m.source_id,
      m.company_id, m.association_id,
      m.created_by_user_id, m.organizer_user_id,
      m.created_at, m.updated_at, m.cancelled_at, m.completed_at,
      m.scheduling_mode, m.scheduled_start_at, m.scheduled_end_at,
      m.scheduled_timezone, m.selected_time_proposal_id,
      m.active_proposal_version, m.confirmed_proposal_id,
      vp.role AS viewer_role, vp.response_status AS viewer_response,
      vp.id   AS viewer_participant_id,
      -- effective sort_at per bucket
      CASE p_bucket
        WHEN 'history' THEN coalesce(m.completed_at, m.cancelled_at, m.updated_at)
        WHEN 'upcoming' THEN m.scheduled_start_at
        WHEN 'overview_upcoming' THEN m.scheduled_start_at
        WHEN 'overview_history' THEN coalesce(m.completed_at, m.cancelled_at, m.updated_at)
        ELSE m.updated_at
      END AS sort_at
    FROM business_meetings m
    JOIN business_meeting_participants vp
      ON vp.meeting_id = m.id AND vp.user_id = v_uid
  ),
  filtered AS (
    SELECT vm.* FROM viewer_meetings vm
    WHERE (p_meeting_type IS NULL OR vm.meeting_type::text = p_meeting_type)
      AND (p_source_type IS NULL OR vm.source_type::text = p_source_type)
      AND (
        (p_bucket = 'history' AND vm.status IN ('completed','cancelled','declined','no_show'))
        OR
        (p_bucket = 'upcoming' AND vm.status = 'confirmed'
           AND vm.scheduling_mode = 'scheduled'
           AND vm.scheduled_start_at IS NOT NULL
           AND vm.scheduled_start_at >= p_now)
        OR
        (p_bucket = 'overview_upcoming' AND vm.status = 'confirmed'
           AND vm.scheduling_mode = 'scheduled'
           AND vm.scheduled_start_at IS NOT NULL
           AND vm.scheduled_start_at >= p_now)
        OR
        (p_bucket = 'overview_history' AND vm.status IN ('completed','cancelled','declined','no_show'))
        OR
        (p_bucket = 'unscheduled'
           AND vm.status NOT IN ('completed','cancelled','declined','no_show')
           AND (vm.scheduling_mode <> 'scheduled' OR vm.scheduled_start_at IS NULL))
        OR
        (p_bucket = 'needs_action'
           AND vm.status NOT IN ('completed','cancelled','declined','no_show'))
      )
  ),
  page AS (
    SELECT f.* FROM filtered f
    WHERE (
      p_cursor_sort_at IS NULL OR p_cursor_meeting_id IS NULL
      OR (
        CASE
          WHEN p_bucket IN ('upcoming','overview_upcoming') THEN
            (f.sort_at, f.id) > (p_cursor_sort_at, p_cursor_meeting_id)
          ELSE
            (f.sort_at, f.id) < (p_cursor_sort_at, p_cursor_meeting_id)
        END
      )
    )
    ORDER BY
      CASE WHEN p_bucket IN ('upcoming','overview_upcoming') THEN f.sort_at END ASC NULLS LAST,
      CASE WHEN p_bucket NOT IN ('upcoming','overview_upcoming') THEN f.sort_at END DESC NULLS LAST,
      f.id
    LIMIT v_limit + 1
  ),
  page_with_aggregates AS (
    SELECT
      p.*,
      -- Participant summary aggregates
      (SELECT count(*) FROM business_meeting_participants pp
        WHERE pp.meeting_id = p.id) AS participant_count,
      (SELECT count(*) FROM business_meeting_participants pp
        WHERE pp.meeting_id = p.id AND pp.role IN ('organizer','required')) AS required_count,
      (SELECT count(*) FROM business_meeting_participants pp
        WHERE pp.meeting_id = p.id AND pp.response_status = 'accepted') AS accepted_count,
      (SELECT count(*) FROM business_meeting_participants pp
        WHERE pp.meeting_id = p.id AND pp.response_status = 'declined') AS declined_count,
      (SELECT count(*) FROM business_meeting_participants pp
        WHERE pp.meeting_id = p.id AND pp.response_status = 'tentative') AS tentative_count,
      (SELECT count(*) FROM business_meeting_participants pp
        WHERE pp.meeting_id = p.id AND pp.response_status = 'pending') AS pending_count,
      -- Active time proposals
      (SELECT count(*) FROM business_meeting_time_proposals tp
        WHERE tp.meeting_id = p.id AND tp.status = 'active') AS active_proposal_count,
      (SELECT max(tp.created_at) FROM business_meeting_time_proposals tp
        WHERE tp.meeting_id = p.id AND tp.status = 'active') AS latest_proposal_at,
      -- Viewer pending proposal responses (invited participant only)
      (SELECT count(*) FROM business_meeting_time_proposals tp
        WHERE tp.meeting_id = p.id AND tp.status = 'active'
          AND p.viewer_role <> 'organizer'
          AND NOT EXISTS (
            SELECT 1 FROM business_meeting_time_proposal_responses tpr
             WHERE tpr.proposal_id = tp.id
               AND tpr.participant_id = p.viewer_participant_id
          )
      ) AS viewer_pending_proposal_count,
      -- Selectable proposal count (organizer picks final)
      (SELECT count(*) FROM business_meeting_time_proposals tp
        WHERE tp.meeting_id = p.id AND tp.status = 'active') AS selectable_proposal_count,
      -- Calendar sync summary
      (SELECT count(*) FROM business_meeting_calendar_projections cp
        WHERE cp.meeting_id = p.id) AS sync_total,
      (SELECT count(*) FROM business_meeting_calendar_projections cp
        WHERE cp.meeting_id = p.id AND cp.sync_status = 'synced') AS sync_synced,
      (SELECT count(*) FROM business_meeting_calendar_projections cp
        WHERE cp.meeting_id = p.id AND cp.sync_status = 'pending') AS sync_pending,
      (SELECT count(*) FROM business_meeting_calendar_projections cp
        WHERE cp.meeting_id = p.id AND cp.sync_status = 'retry_scheduled') AS sync_retry,
      (SELECT count(*) FROM business_meeting_calendar_projections cp
        WHERE cp.meeting_id = p.id AND cp.sync_status = 'failed') AS sync_failed,
      -- Viewer's own sync issue (only surface actionable state for viewer)
      (SELECT bool_or(cp.sync_status IN ('failed','retry_scheduled') AND cp.permanent_failure)
         FROM business_meeting_calendar_projections cp
        WHERE cp.meeting_id = p.id AND cp.participant_user_id = v_uid) AS viewer_sync_issue,
      -- Visible participant preview (up to 3, excluding viewer)
      (SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT pp.id AS handle, pp.role, pp.user_id
          FROM business_meeting_participants pp
         WHERE pp.meeting_id = p.id AND pp.user_id <> v_uid
         ORDER BY CASE pp.role WHEN 'organizer' THEN 0 WHEN 'required' THEN 1 ELSE 2 END, pp.joined_at
         LIMIT 3
      ) x) AS participants_preview
    FROM page p
  )
  SELECT jsonb_build_object(
    'items', coalesce(jsonb_agg(to_jsonb(page_with_aggregates.*) ORDER BY sort_at), '[]'::jsonb),
    'limit', v_limit
  ) INTO v_result
  FROM page_with_aggregates;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.business_meeting_workspace_list_v1(text,int,timestamptz,uuid,text,text,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_meeting_workspace_list_v1(text,int,timestamptz,uuid,text,text,timestamptz) TO authenticated;


CREATE OR REPLACE FUNCTION public.business_meeting_workspace_summary_v1(
  p_now timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH viewer_meetings AS (
    SELECT m.*
      FROM business_meetings m
      JOIN business_meeting_participants p
        ON p.meeting_id = m.id AND p.user_id = auth.uid()
  )
  SELECT jsonb_build_object(
    'upcomingCount', (
      SELECT count(*) FROM viewer_meetings
       WHERE status = 'confirmed'
         AND scheduling_mode = 'scheduled'
         AND scheduled_start_at IS NOT NULL
         AND scheduled_start_at >= p_now
    ),
    'unscheduledCount', (
      SELECT count(*) FROM viewer_meetings
       WHERE status NOT IN ('completed','cancelled','declined','no_show')
         AND (scheduling_mode <> 'scheduled' OR scheduled_start_at IS NULL)
    ),
    'completedRecentlyCount', (
      SELECT count(*) FROM viewer_meetings
       WHERE status IN ('completed','cancelled','declined','no_show')
         AND coalesce(completed_at, cancelled_at, updated_at) >= p_now - interval '30 days'
    ),
    'thisMonthCount', (
      SELECT count(*) FROM viewer_meetings
       WHERE scheduling_mode = 'scheduled'
         AND scheduled_start_at IS NOT NULL
         AND scheduled_start_at >= date_trunc('month', p_now)
         AND scheduled_start_at <  date_trunc('month', p_now) + interval '1 month'
    ),
    'generatedAt', to_char(p_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  )
$$;

REVOKE ALL ON FUNCTION public.business_meeting_workspace_summary_v1(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_meeting_workspace_summary_v1(timestamptz) TO authenticated;

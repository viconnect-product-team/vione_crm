
-- =====================================================================
-- BC-7.6F — Meeting Request Runtime
-- =====================================================================

-- --------------------------------------------------------------------
-- 1. Extend the immutable-guard trigger to also lock `role`.
--    (meeting_id and user_id were already locked.)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bm_guard_participant_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.meeting_id IS DISTINCT FROM OLD.meeting_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'MEETING_IMMUTABLE_FIELD';
  END IF;
  RETURN NEW;
END $$;

-- --------------------------------------------------------------------
-- 2. Participant-set lock trigger (INSERT/DELETE).
--    Allowed only while parent meeting.status = 'draft'.
--    Organizer row can NEVER be deleted (even in draft).
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bm_guard_participant_set_lock()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _status public.business_meeting_status;
  _mid    uuid;
  _role   public.business_meeting_participant_role;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _mid := NEW.meeting_id;
  ELSE
    _mid := OLD.meeting_id;
    _role := OLD.role;
  END IF;

  SELECT status INTO _status FROM public.business_meetings WHERE id = _mid;
  -- Parent meeting deletion cascade: allow the DELETE to proceed.
  IF _status IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' AND _role = 'organizer' THEN
    RAISE EXCEPTION 'MEETING_PARTICIPANT_SET_LOCKED';
  END IF;

  IF _status <> 'draft' THEN
    RAISE EXCEPTION 'MEETING_PARTICIPANT_SET_LOCKED';
  END IF;

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS bm_participants_set_lock ON public.business_meeting_participants;
CREATE TRIGGER bm_participants_set_lock
  BEFORE INSERT OR DELETE ON public.business_meeting_participants
  FOR EACH ROW EXECUTE FUNCTION public.bm_guard_participant_set_lock();

-- --------------------------------------------------------------------
-- 3. Confirmation-policy helper: does the CURRENT participant set
--    satisfy the "all required accepted" invariant?
--    Assumes caller has already locked the required rows FOR UPDATE.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bm_all_required_accepted(_meeting_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  _req_count int;
  _acc_count int;
BEGIN
  SELECT count(*) FILTER (WHERE role = 'required' AND left_at IS NULL),
         count(*) FILTER (WHERE role = 'required' AND left_at IS NULL
                             AND response_status = 'accepted')
    INTO _req_count, _acc_count
    FROM public.business_meeting_participants
   WHERE meeting_id = _meeting_id;

  IF _req_count = 0 THEN
    RETURN false;
  END IF;
  RETURN _acc_count = _req_count;
END $$;

-- --------------------------------------------------------------------
-- 4. Rewrite business_meeting_accept — N-party all-accept confirmation.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.business_meeting_accept(
  _meeting_id uuid,
  _proposal_version integer,
  _mutation_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := public.bm_require_user();
  _m public.business_meetings%ROWTYPE;
  _prole public.business_meeting_participant_role;
  _pid uuid;
  _cached jsonb;
  _confirmed boolean;
  _final_status public.business_meeting_status;
BEGIN
  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.business_meeting_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  SELECT * INTO _m FROM public.business_meetings WHERE id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_NOT_FOUND'; END IF;

  SELECT role INTO _prole FROM public.business_meeting_participants
    WHERE meeting_id = _meeting_id AND user_id = _uid AND left_at IS NULL;
  IF _prole IS NULL THEN RAISE EXCEPTION 'MEETING_NOT_PARTICIPANT'; END IF;
  IF _prole = 'organizer' THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;

  IF _m.status <> 'proposed' THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;
  IF _m.active_proposal_version IS DISTINCT FROM _proposal_version THEN
    RAISE EXCEPTION 'MEETING_STALE_VERSION';
  END IF;

  IF public.bm_pair_blocked(_uid, _m.organizer_user_id) THEN
    RAISE EXCEPTION 'MEETING_BLOCKED';
  END IF;

  SELECT id INTO _pid FROM public.business_meeting_proposals
    WHERE meeting_id = _meeting_id AND version = _proposal_version;
  IF _pid IS NULL THEN RAISE EXCEPTION 'MEETING_PROPOSAL_NOT_FOUND'; END IF;

  -- Update my response row.
  UPDATE public.business_meeting_participants
     SET response_status = 'accepted', responded_at = now()
   WHERE meeting_id = _meeting_id AND user_id = _uid;

  -- Lock all required participants and re-evaluate the invariant.
  PERFORM 1 FROM public.business_meeting_participants
    WHERE meeting_id = _meeting_id AND role = 'required' AND left_at IS NULL
    FOR UPDATE;

  _confirmed := public.bm_all_required_accepted(_meeting_id);
  _final_status := 'proposed';

  -- Always log the participant accept event.
  PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_accepted',
    _proposal_version, _m.source_type, _mutation_key, '{}'::jsonb);

  IF _confirmed THEN
    -- Guard emits `meeting_confirmed` exactly once via WHERE status='proposed'.
    UPDATE public.business_meetings
       SET status = 'confirmed', confirmed_proposal_id = _pid
     WHERE id = _meeting_id AND status = 'proposed';
    IF FOUND THEN
      UPDATE public.business_meeting_proposals SET accepted_at = now() WHERE id = _pid;
      PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_confirmed',
        _proposal_version, _m.source_type, _mutation_key, '{}'::jsonb);
      _final_status := 'confirmed';
    END IF;
  END IF;

  _cached := jsonb_build_object(
    'meetingId', _meeting_id,
    'status', _final_status,
    'version', _proposal_version
  );
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.business_meeting_mutations
      (actor_user_id, mutation_key, operation, meeting_id, result)
    VALUES (_uid, _mutation_key, 'accept', _meeting_id, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- --------------------------------------------------------------------
-- 5. Rewrite business_meeting_decline — participant-level; meeting stays proposed.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.business_meeting_decline(
  _meeting_id uuid,
  _proposal_version integer,
  _reason text DEFAULT NULL,
  _mutation_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := public.bm_require_user();
  _m public.business_meetings%ROWTYPE;
  _prole public.business_meeting_participant_role;
  _cur public.business_meeting_response_status;
  _cached jsonb;
BEGIN
  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.business_meeting_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  SELECT * INTO _m FROM public.business_meetings WHERE id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_NOT_FOUND'; END IF;

  SELECT role, response_status
    INTO _prole, _cur
    FROM public.business_meeting_participants
   WHERE meeting_id = _meeting_id AND user_id = _uid AND left_at IS NULL;
  IF _prole IS NULL THEN RAISE EXCEPTION 'MEETING_NOT_PARTICIPANT'; END IF;
  IF _prole = 'organizer' THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;

  IF _m.status = 'confirmed' THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;
  IF _m.status <> 'proposed' THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;
  IF _m.active_proposal_version IS DISTINCT FROM _proposal_version THEN
    RAISE EXCEPTION 'MEETING_STALE_VERSION';
  END IF;

  IF _cur <> 'declined' THEN
    UPDATE public.business_meeting_participants
       SET response_status = 'declined',
           responded_at = now(),
           response_message = COALESCE(_reason, response_message)
     WHERE meeting_id = _meeting_id AND user_id = _uid;

    PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_participant_declined',
      _proposal_version, _m.source_type, _mutation_key,
      CASE WHEN _reason IS NULL THEN '{}'::jsonb
           ELSE jsonb_build_object('reason', _reason) END);
  END IF;

  _cached := jsonb_build_object(
    'meetingId', _meeting_id,
    'status', 'proposed',
    'version', _proposal_version
  );
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.business_meeting_mutations
      (actor_user_id, mutation_key, operation, meeting_id, result)
    VALUES (_uid, _mutation_key, 'decline', _meeting_id, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- --------------------------------------------------------------------
-- 6. New RPC business_meeting_tentatively_accept.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.business_meeting_tentatively_accept(
  _meeting_id uuid,
  _proposal_version integer,
  _mutation_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := public.bm_require_user();
  _m public.business_meetings%ROWTYPE;
  _prole public.business_meeting_participant_role;
  _cur public.business_meeting_response_status;
  _cached jsonb;
BEGIN
  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.business_meeting_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  SELECT * INTO _m FROM public.business_meetings WHERE id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_NOT_FOUND'; END IF;

  SELECT role, response_status
    INTO _prole, _cur
    FROM public.business_meeting_participants
   WHERE meeting_id = _meeting_id AND user_id = _uid AND left_at IS NULL;
  IF _prole IS NULL THEN RAISE EXCEPTION 'MEETING_NOT_PARTICIPANT'; END IF;
  IF _prole = 'organizer' THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;

  IF _m.status <> 'proposed' THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;
  IF _m.active_proposal_version IS DISTINCT FROM _proposal_version THEN
    RAISE EXCEPTION 'MEETING_STALE_VERSION';
  END IF;

  IF public.bm_pair_blocked(_uid, _m.organizer_user_id) THEN
    RAISE EXCEPTION 'MEETING_BLOCKED';
  END IF;

  -- Only pending or tentative may transition; accepted/declined/proposed_new_time deny.
  IF _cur NOT IN ('pending', 'tentative') THEN
    RAISE EXCEPTION 'MEETING_INVALID_TRANSITION';
  END IF;

  IF _cur = 'pending' THEN
    UPDATE public.business_meeting_participants
       SET response_status = 'tentative', responded_at = now()
     WHERE meeting_id = _meeting_id AND user_id = _uid
       AND response_status = 'pending';
    IF FOUND THEN
      PERFORM public.bm_log_event(_meeting_id, _uid, 'business_meeting_participant_tentative',
        _proposal_version, _m.source_type, _mutation_key, '{}'::jsonb);
    END IF;
  END IF;
  -- tentative → tentative: idempotent no-op (no event, no update).

  _cached := jsonb_build_object(
    'meetingId', _meeting_id,
    'status', 'proposed',
    'version', _proposal_version
  );
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.business_meeting_mutations
      (actor_user_id, mutation_key, operation, meeting_id, result)
    VALUES (_uid, _mutation_key, 'tentative', _meeting_id, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- --------------------------------------------------------------------
-- 7. Grants: revoke PUBLIC, grant authenticated + service_role.
-- --------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.business_meeting_tentatively_accept(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_meeting_tentatively_accept(uuid, integer, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.bm_all_required_accepted(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bm_all_required_accepted(uuid) TO authenticated, service_role;

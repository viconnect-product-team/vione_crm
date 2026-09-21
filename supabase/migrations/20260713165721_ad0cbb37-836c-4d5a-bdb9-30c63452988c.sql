
-- ============================================================
-- BC-4.1A — Business Meetings schema, RLS, versioned proposals,
-- state machine, eligibility, blocking, idempotency, audit.
-- Additive only. Does NOT touch legacy Association meetings/events.
-- ============================================================

-- ---------- 1. ENUMS ----------
CREATE TYPE public.business_meeting_status AS ENUM
  ('draft','proposed','confirmed','declined','cancelled','completed','no_show');

CREATE TYPE public.business_meeting_participant_role AS ENUM
  ('organizer','required','optional');

CREATE TYPE public.business_meeting_response_status AS ENUM
  ('pending','accepted','declined','tentative','proposed_new_time');

CREATE TYPE public.business_meeting_type AS ENUM
  ('in_person','video_call','phone_call','business_lunch','demo',
   'consultation','interview','networking','site_visit','other');

CREATE TYPE public.business_meeting_location_type AS ENUM
  ('physical','online','phone','hybrid','unspecified');

CREATE TYPE public.business_meeting_source_type AS ENUM
  ('global_connection','saved_card','business_profile','company',
   'association','event','qr','nfc','manual','referral');

-- ---------- 2. TIMEZONE VALIDATION HELPER ----------
CREATE OR REPLACE FUNCTION public.bm_valid_timezone(_tz text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF _tz IS NULL OR length(_tz) = 0 THEN RETURN false; END IF;
  PERFORM now() AT TIME ZONE _tz;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END $$;

-- ---------- 3. TABLES ----------
CREATE TABLE public.business_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description text CHECK (description IS NULL OR char_length(description) <= 4000),
  meeting_type public.business_meeting_type NOT NULL,
  status public.business_meeting_status NOT NULL DEFAULT 'draft',
  active_proposal_version integer,
  confirmed_proposal_id uuid,
  timezone text NOT NULL CHECK (public.bm_valid_timezone(timezone)),
  source_type public.business_meeting_source_type NOT NULL DEFAULT 'manual',
  source_id uuid,
  company_id uuid,
  association_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE public.business_meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.business_meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.business_meeting_participant_role NOT NULL,
  response_status public.business_meeting_response_status NOT NULL DEFAULT 'pending',
  response_message text CHECK (response_message IS NULL OR char_length(response_message) <= 1000),
  responded_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);

-- exactly one organizer participant per meeting
CREATE UNIQUE INDEX bm_participants_one_organizer_uq
  ON public.business_meeting_participants (meeting_id)
  WHERE role = 'organizer';

CREATE TABLE public.business_meeting_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.business_meetings(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version >= 1),
  proposed_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text NOT NULL CHECK (public.bm_valid_timezone(timezone)),
  location_type public.business_meeting_location_type NOT NULL DEFAULT 'unspecified',
  location_text text CHECK (location_text IS NULL OR char_length(location_text) <= 500),
  meeting_url text CHECK (meeting_url IS NULL OR char_length(meeting_url) <= 1000),
  proposal_message text CHECK (proposal_message IS NULL OR char_length(proposal_message) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  superseded_at timestamptz,
  accepted_at timestamptz,
  CHECK (end_at > start_at),
  CHECK (end_at - start_at >= interval '15 minutes'),
  CHECK (end_at - start_at <= interval '8 hours'),
  UNIQUE (meeting_id, version)
);

CREATE TABLE public.business_meeting_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.business_meetings(id) ON DELETE CASCADE,
  actor_user_id uuid,
  event_type text NOT NULL,
  proposal_version integer,
  source_type public.business_meeting_source_type,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  mutation_key text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.business_meeting_mutations (
  actor_user_id uuid NOT NULL,
  mutation_key text NOT NULL,
  operation text NOT NULL,
  meeting_id uuid,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_user_id, mutation_key)
);

-- ---------- 4. INDEXES ----------
CREATE INDEX bm_meetings_organizer_status_idx ON public.business_meetings (organizer_user_id, status);
CREATE INDEX bm_meetings_status_updated_idx ON public.business_meetings (status, updated_at DESC);
CREATE INDEX bm_meetings_confirmed_proposal_idx ON public.business_meetings (confirmed_proposal_id) WHERE confirmed_proposal_id IS NOT NULL;
CREATE INDEX bm_meetings_company_idx ON public.business_meetings (company_id) WHERE company_id IS NOT NULL;
CREATE INDEX bm_meetings_association_idx ON public.business_meetings (association_id) WHERE association_id IS NOT NULL;

CREATE INDEX bm_participants_meeting_idx ON public.business_meeting_participants (meeting_id);
CREATE INDEX bm_participants_user_response_idx ON public.business_meeting_participants (user_id, response_status);

CREATE INDEX bm_proposals_meeting_version_idx ON public.business_meeting_proposals (meeting_id, version DESC);
CREATE INDEX bm_proposals_meeting_created_idx ON public.business_meeting_proposals (meeting_id, created_at DESC);
CREATE INDEX bm_proposals_proposed_by_idx ON public.business_meeting_proposals (proposed_by_user_id);
CREATE INDEX bm_proposals_accepted_idx ON public.business_meeting_proposals (accepted_at) WHERE accepted_at IS NOT NULL;

CREATE INDEX bm_events_meeting_idx ON public.business_meeting_events (meeting_id, occurred_at DESC);

-- ---------- 5. updated_at TRIGGERS ----------
CREATE TRIGGER bm_meetings_updated_at BEFORE UPDATE ON public.business_meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER bm_participants_updated_at BEFORE UPDATE ON public.business_meeting_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 6. IMMUTABILITY GUARDS ----------
-- proposals immutable except controlled lifecycle timestamps
CREATE OR REPLACE FUNCTION public.bm_guard_proposal_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.meeting_id IS DISTINCT FROM OLD.meeting_id
     OR NEW.version IS DISTINCT FROM OLD.version
     OR NEW.proposed_by_user_id IS DISTINCT FROM OLD.proposed_by_user_id
     OR NEW.start_at IS DISTINCT FROM OLD.start_at
     OR NEW.end_at IS DISTINCT FROM OLD.end_at
     OR NEW.timezone IS DISTINCT FROM OLD.timezone
     OR NEW.location_type IS DISTINCT FROM OLD.location_type
     OR NEW.location_text IS DISTINCT FROM OLD.location_text
     OR NEW.meeting_url IS DISTINCT FROM OLD.meeting_url
     OR NEW.proposal_message IS DISTINCT FROM OLD.proposal_message
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'MEETING_IMMUTABLE_FIELD';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bm_proposals_immutable BEFORE UPDATE ON public.business_meeting_proposals
  FOR EACH ROW EXECUTE FUNCTION public.bm_guard_proposal_immutable();

-- meeting identity immutable
CREATE OR REPLACE FUNCTION public.bm_guard_meeting_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id
     OR NEW.organizer_user_id IS DISTINCT FROM OLD.organizer_user_id THEN
    RAISE EXCEPTION 'MEETING_IMMUTABLE_FIELD';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bm_meetings_immutable BEFORE UPDATE ON public.business_meetings
  FOR EACH ROW EXECUTE FUNCTION public.bm_guard_meeting_immutable();

-- participant identity immutable
CREATE OR REPLACE FUNCTION public.bm_guard_participant_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.meeting_id IS DISTINCT FROM OLD.meeting_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'MEETING_IMMUTABLE_FIELD';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bm_participants_immutable BEFORE UPDATE ON public.business_meeting_participants
  FOR EACH ROW EXECUTE FUNCTION public.bm_guard_participant_immutable();

-- ---------- 7. SECURITY HELPERS ----------
CREATE OR REPLACE FUNCTION public.bm_require_user()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _status text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'MEETING_AUTH_REQUIRED'; END IF;
  SELECT account_status INTO _status FROM public.user_profiles WHERE user_id = _uid;
  IF _status = 'suspended' THEN RAISE EXCEPTION 'MEETING_ACCOUNT_SUSPENDED'; END IF;
  IF _status = 'deactivated' THEN RAISE EXCEPTION 'MEETING_ACCOUNT_INACTIVE'; END IF;
  RETURN _uid;
END $$;

CREATE OR REPLACE FUNCTION public.bm_is_participant(_meeting uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_meeting_participants
    WHERE meeting_id = _meeting AND user_id = _uid AND left_at IS NULL
  );
$$;

-- accepted global connection OR organizer-owned saved card targeting the user
CREATE OR REPLACE FUNCTION public.bm_eligibility_source(_organizer uuid, _target uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _has boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_connections
    WHERE status = 'accepted'
      AND pair_user_low = least(_organizer, _target)
      AND pair_user_high = greatest(_organizer, _target)
  ) INTO _has;
  IF _has THEN RETURN 'global_connection'; END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.saved_business_cards s
    JOIN public.member_business_cards c ON c.id = s.target_card_id
    WHERE s.owner_user_id = _organizer AND c.owner_user_id = _target
  ) INTO _has;
  IF _has THEN RETURN 'saved_card'; END IF;

  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.bm_pair_blocked(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_connections
    WHERE status = 'blocked'
      AND pair_user_low = least(_a, _b)
      AND pair_user_high = greatest(_a, _b)
  );
$$;

CREATE OR REPLACE FUNCTION public.bm_log_event(
  _meeting uuid, _actor uuid, _type text, _version integer,
  _source public.business_meeting_source_type, _mkey text, _meta jsonb
) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.business_meeting_events
    (meeting_id, actor_user_id, event_type, proposal_version, source_type, mutation_key, metadata)
  VALUES (_meeting, _actor, _type, _version, _source, _mkey, COALESCE(_meta, '{}'::jsonb));
$$;

-- validate proposal timing; raises MEETING_TIME_INVALID
CREATE OR REPLACE FUNCTION public.bm_validate_timing(_start timestamptz, _end timestamptz, _tz text)
RETURNS void LANGUAGE plpgsql STABLE SET search_path = public AS $$
BEGIN
  IF _start IS NULL OR _end IS NULL THEN RAISE EXCEPTION 'MEETING_TIME_INVALID'; END IF;
  IF NOT public.bm_valid_timezone(_tz) THEN RAISE EXCEPTION 'MEETING_TIME_INVALID'; END IF;
  IF _end <= _start THEN RAISE EXCEPTION 'MEETING_TIME_INVALID'; END IF;
  IF _start < now() THEN RAISE EXCEPTION 'MEETING_TIME_INVALID'; END IF;
  IF _end - _start < interval '15 minutes' THEN RAISE EXCEPTION 'MEETING_TIME_INVALID'; END IF;
  IF _end - _start > interval '8 hours' THEN RAISE EXCEPTION 'MEETING_TIME_INVALID'; END IF;
END $$;

-- ---------- 8. MUTATION FUNCTIONS ----------

-- create draft: organizer + target participants, eligibility + block enforced
CREATE OR REPLACE FUNCTION public.business_meeting_create_draft(
  _target_user_id uuid,
  _title text,
  _meeting_type text,
  _description text DEFAULT NULL,
  _timezone text DEFAULT 'UTC',
  _source_type text DEFAULT 'manual',
  _source_id uuid DEFAULT NULL,
  _company_id uuid DEFAULT NULL,
  _association_id uuid DEFAULT NULL,
  _mutation_key text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := public.bm_require_user();
  _src public.business_meeting_source_type;
  _mtype public.business_meeting_type;
  _elig text;
  _meeting uuid;
  _cached jsonb;
  _tstatus text;
BEGIN
  IF _target_user_id = _uid THEN RAISE EXCEPTION 'MEETING_PARTICIPANT_INVALID'; END IF;

  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.business_meeting_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  SELECT account_status INTO _tstatus FROM public.user_profiles WHERE user_id = _target_user_id;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _target_user_id) THEN
    RAISE EXCEPTION 'MEETING_TARGET_NOT_FOUND';
  END IF;
  IF _tstatus IN ('suspended','deactivated') THEN RAISE EXCEPTION 'MEETING_TARGET_UNAVAILABLE'; END IF;

  IF public.bm_pair_blocked(_uid, _target_user_id) THEN RAISE EXCEPTION 'MEETING_BLOCKED'; END IF;

  _elig := public.bm_eligibility_source(_uid, _target_user_id);
  IF _elig IS NULL THEN RAISE EXCEPTION 'MEETING_CONNECTION_REQUIRED'; END IF;

  IF NOT public.bm_valid_timezone(_timezone) THEN RAISE EXCEPTION 'MEETING_TIME_INVALID'; END IF;

  BEGIN _mtype := _meeting_type::public.business_meeting_type;
  EXCEPTION WHEN invalid_text_representation THEN _mtype := 'other'; END;
  BEGIN _src := _source_type::public.business_meeting_source_type;
  EXCEPTION WHEN invalid_text_representation THEN _src := 'manual'; END;

  INSERT INTO public.business_meetings
    (created_by_user_id, organizer_user_id, title, description, meeting_type,
     status, timezone, source_type, source_id, company_id, association_id)
  VALUES (_uid, _uid, left(_title, 200), left(_description, 4000), _mtype,
     'draft', _timezone, _src, _source_id, _company_id, _association_id)
  RETURNING id INTO _meeting;

  INSERT INTO public.business_meeting_participants (meeting_id, user_id, role, response_status, responded_at)
  VALUES (_meeting, _uid, 'organizer', 'accepted', now());
  INSERT INTO public.business_meeting_participants (meeting_id, user_id, role, response_status)
  VALUES (_meeting, _target_user_id, 'required', 'pending');

  PERFORM public.bm_log_event(_meeting, _uid, 'meeting_draft_created', NULL, _src, _mutation_key,
    jsonb_build_object('eligibilitySource', _elig));

  _cached := jsonb_build_object('meetingId', _meeting, 'status', 'draft');
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.business_meeting_mutations (actor_user_id, mutation_key, operation, meeting_id, result)
    VALUES (_uid, _mutation_key, 'create_draft', _meeting, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- propose: organizer, draft -> proposed, version 1 (with rate limit + block recheck)
CREATE OR REPLACE FUNCTION public.business_meeting_propose(
  _meeting_id uuid,
  _start_at timestamptz,
  _end_at timestamptz,
  _timezone text,
  _location_type text DEFAULT 'unspecified',
  _location_text text DEFAULT NULL,
  _meeting_url text DEFAULT NULL,
  _proposal_message text DEFAULT NULL,
  _mutation_key text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := public.bm_require_user();
  _m public.business_meetings%ROWTYPE;
  _ltype public.business_meeting_location_type;
  _cached jsonb;
  _target uuid;
  _hourly int; _daily int;
BEGIN
  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.business_meeting_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  SELECT * INTO _m FROM public.business_meetings WHERE id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_NOT_FOUND'; END IF;
  IF _m.organizer_user_id <> _uid THEN RAISE EXCEPTION 'MEETING_NOT_ORGANIZER'; END IF;
  IF _m.status <> 'draft' THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;

  SELECT user_id INTO _target FROM public.business_meeting_participants
    WHERE meeting_id = _meeting_id AND role <> 'organizer' LIMIT 1;
  IF _target IS NOT NULL AND public.bm_pair_blocked(_uid, _target) THEN
    RAISE EXCEPTION 'MEETING_BLOCKED';
  END IF;

  -- rate limit: 10/hour, 30/day new proposals per organizer
  SELECT count(*) INTO _hourly FROM public.business_meeting_events
    WHERE actor_user_id = _uid AND event_type = 'meeting_proposed'
      AND occurred_at > now() - interval '1 hour';
  IF _hourly >= 10 THEN RAISE EXCEPTION 'MEETING_RATE_LIMITED'; END IF;
  SELECT count(*) INTO _daily FROM public.business_meeting_events
    WHERE actor_user_id = _uid AND event_type = 'meeting_proposed'
      AND occurred_at > now() - interval '24 hours';
  IF _daily >= 30 THEN RAISE EXCEPTION 'MEETING_RATE_LIMITED'; END IF;

  PERFORM public.bm_validate_timing(_start_at, _end_at, _timezone);

  BEGIN _ltype := _location_type::public.business_meeting_location_type;
  EXCEPTION WHEN invalid_text_representation THEN _ltype := 'unspecified'; END;

  INSERT INTO public.business_meeting_proposals
    (meeting_id, version, proposed_by_user_id, start_at, end_at, timezone,
     location_type, location_text, meeting_url, proposal_message)
  VALUES (_meeting_id, 1, _uid, _start_at, _end_at, _timezone,
     _ltype, left(_location_text,500), left(_meeting_url,1000), left(_proposal_message,1000));

  UPDATE public.business_meetings
    SET status = 'proposed', active_proposal_version = 1, timezone = _timezone
    WHERE id = _meeting_id;

  PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_proposed', 1, _m.source_type, _mutation_key, '{}'::jsonb);

  _cached := jsonb_build_object('meetingId', _meeting_id, 'status', 'proposed', 'version', 1);
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.business_meeting_mutations (actor_user_id, mutation_key, operation, meeting_id, result)
    VALUES (_uid, _mutation_key, 'propose', _meeting_id, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- propose_new_time: active participant, proposed/confirmed -> proposed (new version)
CREATE OR REPLACE FUNCTION public.business_meeting_propose_new_time(
  _meeting_id uuid,
  _base_version integer,
  _start_at timestamptz,
  _end_at timestamptz,
  _timezone text,
  _location_type text DEFAULT 'unspecified',
  _location_text text DEFAULT NULL,
  _meeting_url text DEFAULT NULL,
  _proposal_message text DEFAULT NULL,
  _mutation_key text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := public.bm_require_user();
  _m public.business_meetings%ROWTYPE;
  _ltype public.business_meeting_location_type;
  _cached jsonb;
  _next int;
  _other uuid;
BEGIN
  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.business_meeting_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  SELECT * INTO _m FROM public.business_meetings WHERE id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_NOT_FOUND'; END IF;
  IF NOT public.bm_is_participant(_meeting_id, _uid) THEN RAISE EXCEPTION 'MEETING_NOT_PARTICIPANT'; END IF;
  IF _m.status NOT IN ('proposed','confirmed') THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;
  IF _m.active_proposal_version IS DISTINCT FROM _base_version THEN RAISE EXCEPTION 'MEETING_STALE_VERSION'; END IF;

  SELECT user_id INTO _other FROM public.business_meeting_participants
    WHERE meeting_id = _meeting_id AND user_id <> _uid LIMIT 1;
  IF _other IS NOT NULL AND public.bm_pair_blocked(_uid, _other) THEN RAISE EXCEPTION 'MEETING_BLOCKED'; END IF;

  PERFORM public.bm_validate_timing(_start_at, _end_at, _timezone);

  BEGIN _ltype := _location_type::public.business_meeting_location_type;
  EXCEPTION WHEN invalid_text_representation THEN _ltype := 'unspecified'; END;

  _next := COALESCE(_m.active_proposal_version, 0) + 1;

  UPDATE public.business_meeting_proposals
    SET superseded_at = now()
    WHERE meeting_id = _meeting_id AND superseded_at IS NULL AND accepted_at IS NULL;

  INSERT INTO public.business_meeting_proposals
    (meeting_id, version, proposed_by_user_id, start_at, end_at, timezone,
     location_type, location_text, meeting_url, proposal_message)
  VALUES (_meeting_id, _next, _uid, _start_at, _end_at, _timezone,
     _ltype, left(_location_text,500), left(_meeting_url,1000), left(_proposal_message,1000));

  UPDATE public.business_meetings
    SET status = 'proposed', active_proposal_version = _next,
        confirmed_proposal_id = NULL, timezone = _timezone
    WHERE id = _meeting_id;

  UPDATE public.business_meeting_participants
    SET response_status = 'proposed_new_time', responded_at = now()
    WHERE meeting_id = _meeting_id AND user_id = _uid;

  PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_proposal_superseded', _base_version, _m.source_type, _mutation_key, '{}'::jsonb);
  PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_proposed', _next, _m.source_type, _mutation_key, '{}'::jsonb);

  _cached := jsonb_build_object('meetingId', _meeting_id, 'status', 'proposed', 'version', _next);
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.business_meeting_mutations (actor_user_id, mutation_key, operation, meeting_id, result)
    VALUES (_uid, _mutation_key, 'propose_new_time', _meeting_id, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- accept: required invited participant (not organizer), proposed -> confirmed
CREATE OR REPLACE FUNCTION public.business_meeting_accept(
  _meeting_id uuid, _proposal_version integer, _mutation_key text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := public.bm_require_user();
  _m public.business_meetings%ROWTYPE;
  _prole public.business_meeting_participant_role;
  _pid uuid;
  _cached jsonb;
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
  IF _m.active_proposal_version IS DISTINCT FROM _proposal_version THEN RAISE EXCEPTION 'MEETING_STALE_VERSION'; END IF;

  IF public.bm_pair_blocked(_uid, _m.organizer_user_id) THEN RAISE EXCEPTION 'MEETING_BLOCKED'; END IF;

  SELECT id INTO _pid FROM public.business_meeting_proposals
    WHERE meeting_id = _meeting_id AND version = _proposal_version;
  IF _pid IS NULL THEN RAISE EXCEPTION 'MEETING_PROPOSAL_NOT_FOUND'; END IF;

  UPDATE public.business_meeting_proposals SET accepted_at = now() WHERE id = _pid;
  UPDATE public.business_meetings
    SET status = 'confirmed', confirmed_proposal_id = _pid
    WHERE id = _meeting_id;
  UPDATE public.business_meeting_participants
    SET response_status = 'accepted', responded_at = now()
    WHERE meeting_id = _meeting_id AND user_id = _uid;

  PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_accepted', _proposal_version, _m.source_type, _mutation_key, '{}'::jsonb);
  PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_confirmed', _proposal_version, _m.source_type, _mutation_key, '{}'::jsonb);

  _cached := jsonb_build_object('meetingId', _meeting_id, 'status', 'confirmed', 'version', _proposal_version);
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.business_meeting_mutations (actor_user_id, mutation_key, operation, meeting_id, result)
    VALUES (_uid, _mutation_key, 'accept', _meeting_id, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- decline: invited participant, proposed -> declined
CREATE OR REPLACE FUNCTION public.business_meeting_decline(
  _meeting_id uuid, _proposal_version integer, _reason text DEFAULT NULL, _mutation_key text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := public.bm_require_user();
  _m public.business_meetings%ROWTYPE;
  _prole public.business_meeting_participant_role;
  _cached jsonb;
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
  IF _m.active_proposal_version IS DISTINCT FROM _proposal_version THEN RAISE EXCEPTION 'MEETING_STALE_VERSION'; END IF;

  UPDATE public.business_meetings SET status = 'declined' WHERE id = _meeting_id;
  UPDATE public.business_meeting_participants
    SET response_status = 'declined', responded_at = now(),
        response_message = COALESCE(left(_reason,1000), response_message)
    WHERE meeting_id = _meeting_id AND user_id = _uid;

  PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_declined', _proposal_version, _m.source_type, _mutation_key, '{}'::jsonb);

  _cached := jsonb_build_object('meetingId', _meeting_id, 'status', 'declined', 'version', _proposal_version);
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.business_meeting_mutations (actor_user_id, mutation_key, operation, meeting_id, result)
    VALUES (_uid, _mutation_key, 'decline', _meeting_id, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- cancel: organizer, proposed/confirmed -> cancelled
CREATE OR REPLACE FUNCTION public.business_meeting_cancel(
  _meeting_id uuid, _expected_version integer DEFAULT NULL, _reason text DEFAULT NULL, _mutation_key text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := public.bm_require_user();
  _m public.business_meetings%ROWTYPE;
  _cached jsonb;
BEGIN
  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.business_meeting_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  SELECT * INTO _m FROM public.business_meetings WHERE id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_NOT_FOUND'; END IF;
  IF _m.organizer_user_id <> _uid THEN RAISE EXCEPTION 'MEETING_NOT_ORGANIZER'; END IF;
  IF _m.status NOT IN ('proposed','confirmed') THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;
  IF _expected_version IS NOT NULL AND _m.active_proposal_version IS DISTINCT FROM _expected_version THEN
    RAISE EXCEPTION 'MEETING_STALE_VERSION';
  END IF;

  UPDATE public.business_meetings SET status = 'cancelled', cancelled_at = now() WHERE id = _meeting_id;

  PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_cancelled', _m.active_proposal_version, _m.source_type, _mutation_key,
    jsonb_build_object('reason', left(COALESCE(_reason,''),500)));

  _cached := jsonb_build_object('meetingId', _meeting_id, 'status', 'cancelled');
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.business_meeting_mutations (actor_user_id, mutation_key, operation, meeting_id, result)
    VALUES (_uid, _mutation_key, 'cancel', _meeting_id, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- complete: either participant, confirmed -> completed
CREATE OR REPLACE FUNCTION public.business_meeting_complete(
  _meeting_id uuid, _expected_version integer DEFAULT NULL, _mutation_key text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := public.bm_require_user();
  _m public.business_meetings%ROWTYPE;
  _cached jsonb;
BEGIN
  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.business_meeting_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  SELECT * INTO _m FROM public.business_meetings WHERE id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_NOT_FOUND'; END IF;
  IF NOT public.bm_is_participant(_meeting_id, _uid) THEN RAISE EXCEPTION 'MEETING_NOT_PARTICIPANT'; END IF;
  IF _m.status <> 'confirmed' THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;
  IF _expected_version IS NOT NULL AND _m.active_proposal_version IS DISTINCT FROM _expected_version THEN
    RAISE EXCEPTION 'MEETING_STALE_VERSION';
  END IF;

  UPDATE public.business_meetings SET status = 'completed', completed_at = now() WHERE id = _meeting_id;
  PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_completed', _m.active_proposal_version, _m.source_type, _mutation_key, '{}'::jsonb);

  _cached := jsonb_build_object('meetingId', _meeting_id, 'status', 'completed');
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.business_meeting_mutations (actor_user_id, mutation_key, operation, meeting_id, result)
    VALUES (_uid, _mutation_key, 'complete', _meeting_id, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- mark_no_show: either participant, confirmed -> no_show (approved BC-4.0)
CREATE OR REPLACE FUNCTION public.business_meeting_mark_no_show(
  _meeting_id uuid, _expected_version integer DEFAULT NULL, _mutation_key text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := public.bm_require_user();
  _m public.business_meetings%ROWTYPE;
  _cached jsonb;
BEGIN
  IF _mutation_key IS NOT NULL THEN
    SELECT result INTO _cached FROM public.business_meeting_mutations
      WHERE actor_user_id = _uid AND mutation_key = _mutation_key;
    IF _cached IS NOT NULL THEN RETURN _cached; END IF;
  END IF;

  SELECT * INTO _m FROM public.business_meetings WHERE id = _meeting_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEETING_NOT_FOUND'; END IF;
  IF NOT public.bm_is_participant(_meeting_id, _uid) THEN RAISE EXCEPTION 'MEETING_NOT_PARTICIPANT'; END IF;
  IF _m.status <> 'confirmed' THEN RAISE EXCEPTION 'MEETING_INVALID_TRANSITION'; END IF;
  IF _expected_version IS NOT NULL AND _m.active_proposal_version IS DISTINCT FROM _expected_version THEN
    RAISE EXCEPTION 'MEETING_STALE_VERSION';
  END IF;

  UPDATE public.business_meetings SET status = 'no_show' WHERE id = _meeting_id;
  PERFORM public.bm_log_event(_meeting_id, _uid, 'meeting_no_show', _m.active_proposal_version, _m.source_type, _mutation_key, '{}'::jsonb);

  _cached := jsonb_build_object('meetingId', _meeting_id, 'status', 'no_show');
  IF _mutation_key IS NOT NULL THEN
    INSERT INTO public.business_meeting_mutations (actor_user_id, mutation_key, operation, meeting_id, result)
    VALUES (_uid, _mutation_key, 'mark_no_show', _meeting_id, _cached)
    ON CONFLICT (actor_user_id, mutation_key) DO NOTHING;
  END IF;
  RETURN _cached;
END $$;

-- ---------- 9. RLS ----------
ALTER TABLE public.business_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meetings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_participants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_proposals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_mutations FORCE ROW LEVEL SECURITY;

CREATE POLICY bm_meetings_select ON public.business_meetings
  FOR SELECT TO authenticated
  USING (
    organizer_user_id = auth.uid()
    OR public.bm_is_participant(id, auth.uid())
    OR public.is_platform_admin()
  );

CREATE POLICY bm_participants_select ON public.business_meeting_participants
  FOR SELECT TO authenticated
  USING (
    public.bm_is_participant(meeting_id, auth.uid())
    OR public.is_platform_admin()
  );

CREATE POLICY bm_proposals_select ON public.business_meeting_proposals
  FOR SELECT TO authenticated
  USING (
    public.bm_is_participant(meeting_id, auth.uid())
    OR public.is_platform_admin()
  );

CREATE POLICY bm_events_select ON public.business_meeting_events
  FOR SELECT TO authenticated
  USING (
    public.bm_is_participant(meeting_id, auth.uid())
    OR public.is_platform_admin()
  );

-- No INSERT/UPDATE/DELETE policies: ordinary writes are impossible; only
-- SECURITY DEFINER mutation functions can change data.

-- ---------- 10. GRANTS ----------
GRANT SELECT ON public.business_meetings TO authenticated;
GRANT SELECT ON public.business_meeting_participants TO authenticated;
GRANT SELECT ON public.business_meeting_proposals TO authenticated;
GRANT SELECT ON public.business_meeting_events TO authenticated;
GRANT ALL ON public.business_meetings TO service_role;
GRANT ALL ON public.business_meeting_participants TO service_role;
GRANT ALL ON public.business_meeting_proposals TO service_role;
GRANT ALL ON public.business_meeting_events TO service_role;
GRANT ALL ON public.business_meeting_mutations TO service_role;

-- controlled mutation functions: authenticated only, never anon/public
REVOKE ALL ON FUNCTION public.business_meeting_create_draft(uuid,text,text,text,text,text,uuid,uuid,uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_propose(uuid,timestamptz,timestamptz,text,text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_propose_new_time(uuid,integer,timestamptz,timestamptz,text,text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_accept(uuid,integer,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_decline(uuid,integer,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_cancel(uuid,integer,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_complete(uuid,integer,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_meeting_mark_no_show(uuid,integer,text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.business_meeting_create_draft(uuid,text,text,text,text,text,uuid,uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_meeting_propose(uuid,timestamptz,timestamptz,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_meeting_propose_new_time(uuid,integer,timestamptz,timestamptz,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_meeting_accept(uuid,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_meeting_decline(uuid,integer,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_meeting_cancel(uuid,integer,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_meeting_complete(uuid,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_meeting_mark_no_show(uuid,integer,text) TO authenticated;

-- ---------- 11. COMMENTS ----------
COMMENT ON TABLE public.business_meetings IS 'BC-4.1A Business Meetings aggregate. Additive; isolated from legacy Association meetings/events.';
COMMENT ON TABLE public.business_meeting_proposals IS 'BC-4.1A Immutable, versioned meeting time proposals. Never overwrites accepted history.';
COMMENT ON TABLE public.business_meeting_participants IS 'BC-4.1A Meeting participants; exactly one organizer; identity immutable.';

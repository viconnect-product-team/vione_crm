-- BC-7.7 Turn A — Calendar & Availability Integration foundation.
-- Canonical meeting remains business_meetings. These tables add:
--   1. Calendar account abstraction (provider-agnostic).
--   2. Availability preferences (per-user).
--   3. Time proposals + participant responses (scheduling round).
--   4. External calendar sync projections (never source of truth).

-- =====================================================================
-- 1. CALENDAR ACCOUNTS
-- =====================================================================
CREATE TABLE public.business_calendar_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google','microsoft','internal')),
  provider_account_ref TEXT,
  status TEXT NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected','degraded','disconnected','revoked')),
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  refreshed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_error_code TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, provider_account_ref)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_calendar_accounts TO authenticated;
GRANT ALL ON public.business_calendar_accounts TO service_role;
ALTER TABLE public.business_calendar_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_calendar_accounts FORCE ROW LEVEL SECURITY;

CREATE POLICY bca_owner_select ON public.business_calendar_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY bca_owner_write ON public.business_calendar_accounts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_bca_user ON public.business_calendar_accounts(user_id);

-- =====================================================================
-- 2. AVAILABILITY PREFERENCES
-- =====================================================================
CREATE TABLE public.business_availability_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  -- ISO weekday numbers (1=Mon..7=Sun) that are working days.
  working_days INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5]::INTEGER[],
  -- Normalized per-day windows: [{ "day":1, "start":"09:00", "end":"12:00" }, ...]
  working_hours JSONB NOT NULL DEFAULT
    '[{"day":1,"start":"09:00","end":"17:00"},
      {"day":2,"start":"09:00","end":"17:00"},
      {"day":3,"start":"09:00","end":"17:00"},
      {"day":4,"start":"09:00","end":"17:00"},
      {"day":5,"start":"09:00","end":"17:00"}]'::JSONB,
  minimum_notice_minutes INTEGER NOT NULL DEFAULT 60
    CHECK (minimum_notice_minutes >= 0 AND minimum_notice_minutes <= 10080),
  default_meeting_duration_minutes INTEGER NOT NULL DEFAULT 60
    CHECK (default_meeting_duration_minutes BETWEEN 15 AND 480),
  buffer_before_minutes INTEGER NOT NULL DEFAULT 0
    CHECK (buffer_before_minutes BETWEEN 0 AND 240),
  buffer_after_minutes INTEGER NOT NULL DEFAULT 0
    CHECK (buffer_after_minutes BETWEEN 0 AND 240),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_availability_preferences TO authenticated;
GRANT ALL ON public.business_availability_preferences TO service_role;
ALTER TABLE public.business_availability_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_availability_preferences FORCE ROW LEVEL SECURITY;

CREATE POLICY bap_owner_select ON public.business_availability_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY bap_owner_write ON public.business_availability_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- 3. MEETING TIME PROPOSALS
-- =====================================================================
CREATE TABLE public.business_meeting_time_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.business_meetings(id) ON DELETE CASCADE,
  proposed_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','selected','withdrawn','expired')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

GRANT SELECT ON public.business_meeting_time_proposals TO authenticated;
GRANT ALL ON public.business_meeting_time_proposals TO service_role;
ALTER TABLE public.business_meeting_time_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_time_proposals FORCE ROW LEVEL SECURITY;

-- Participants of the meeting may read; writes are RPC-only (service_role).
CREATE POLICY bmtp_participant_select ON public.business_meeting_time_proposals
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.business_meeting_participants p
    WHERE p.meeting_id = business_meeting_time_proposals.meeting_id
      AND p.user_id = auth.uid()
      AND p.left_at IS NULL
  ));

CREATE INDEX idx_bmtp_meeting ON public.business_meeting_time_proposals(meeting_id, status);

-- =====================================================================
-- 4. TIME PROPOSAL RESPONSES
-- =====================================================================
CREATE TABLE public.business_meeting_time_proposal_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.business_meeting_time_proposals(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.business_meeting_participants(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('available','unavailable','tentative')),
  responded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, participant_id)
);

GRANT SELECT ON public.business_meeting_time_proposal_responses TO authenticated;
GRANT ALL ON public.business_meeting_time_proposal_responses TO service_role;
ALTER TABLE public.business_meeting_time_proposal_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_time_proposal_responses FORCE ROW LEVEL SECURITY;

CREATE POLICY bmtpr_participant_select ON public.business_meeting_time_proposal_responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.business_meeting_time_proposals tp
    JOIN public.business_meeting_participants p
      ON p.meeting_id = tp.meeting_id
    WHERE tp.id = business_meeting_time_proposal_responses.proposal_id
      AND p.user_id = auth.uid()
      AND p.left_at IS NULL
  ));

CREATE INDEX idx_bmtpr_proposal ON public.business_meeting_time_proposal_responses(proposal_id);

-- =====================================================================
-- 5. CALENDAR PROJECTIONS
-- =====================================================================
CREATE TABLE public.business_meeting_calendar_projections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.business_meetings(id) ON DELETE CASCADE,
  participant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google','microsoft','internal')),
  calendar_account_id UUID REFERENCES public.business_calendar_accounts(id) ON DELETE SET NULL,
  external_event_ref TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending','synced','retry_scheduled','failed','cancelled')),
  last_synced_at TIMESTAMPTZ,
  last_error_code TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, participant_user_id, provider)
);

GRANT SELECT ON public.business_meeting_calendar_projections TO authenticated;
GRANT ALL ON public.business_meeting_calendar_projections TO service_role;
ALTER TABLE public.business_meeting_calendar_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_meeting_calendar_projections FORCE ROW LEVEL SECURITY;

-- Only the projection owner may read status; external_event_ref stays server-side via SDK projection.
CREATE POLICY bmcp_owner_select ON public.business_meeting_calendar_projections
  FOR SELECT TO authenticated USING (auth.uid() = participant_user_id);

CREATE INDEX idx_bmcp_meeting ON public.business_meeting_calendar_projections(meeting_id);
CREATE INDEX idx_bmcp_status ON public.business_meeting_calendar_projections(sync_status)
  WHERE sync_status IN ('pending','retry_scheduled');

-- =====================================================================
-- 6. updated_at trigger (reuse existing helper if present)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.bc77_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_bca_touch BEFORE UPDATE ON public.business_calendar_accounts
  FOR EACH ROW EXECUTE FUNCTION public.bc77_touch_updated_at();
CREATE TRIGGER trg_bap_touch BEFORE UPDATE ON public.business_availability_preferences
  FOR EACH ROW EXECUTE FUNCTION public.bc77_touch_updated_at();
CREATE TRIGGER trg_bmtp_touch BEFORE UPDATE ON public.business_meeting_time_proposals
  FOR EACH ROW EXECUTE FUNCTION public.bc77_touch_updated_at();
CREATE TRIGGER trg_bmtpr_touch BEFORE UPDATE ON public.business_meeting_time_proposal_responses
  FOR EACH ROW EXECUTE FUNCTION public.bc77_touch_updated_at();
CREATE TRIGGER trg_bmcp_touch BEFORE UPDATE ON public.business_meeting_calendar_projections
  FOR EACH ROW EXECUTE FUNCTION public.bc77_touch_updated_at();
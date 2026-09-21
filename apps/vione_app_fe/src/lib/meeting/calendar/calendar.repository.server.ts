// BC-7.7 — Server-only repository. Row shape → DTO mapping.
// No business logic here; services own algorithms and authority checks.

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AvailabilityPreferencesDTO,
  CalendarAccountDTO,
  CalendarProjectionDTO,
  MeetingTimeProposalDTO,
  MeetingTimeProposalResponseDTO,
} from "./types";

type Row = Record<string, unknown>;

function mapAccount(r: Row): CalendarAccountDTO {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    provider: r.provider as CalendarAccountDTO["provider"],
    providerAccountRef: (r.provider_account_ref as string | null) ?? null,
    status: r.status as CalendarAccountDTO["status"],
    scopes: (r.scopes as string[]) ?? [],
    connectedAt: String(r.connected_at),
    refreshedAt: (r.refreshed_at as string | null) ?? null,
    expiresAt: (r.expires_at as string | null) ?? null,
    lastSyncAt: (r.last_sync_at as string | null) ?? null,
    lastErrorCode: (r.last_error_code as string | null) ?? null,
    version: Number(r.version ?? 1),
  };
}

function mapPreferences(r: Row): AvailabilityPreferencesDTO {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    timezone: String(r.timezone),
    workingDays: (r.working_days as AvailabilityPreferencesDTO["workingDays"]) ?? [],
    workingHours: (r.working_hours as AvailabilityPreferencesDTO["workingHours"]) ?? [],
    minimumNoticeMinutes: Number(r.minimum_notice_minutes ?? 0),
    defaultMeetingDurationMinutes: Number(r.default_meeting_duration_minutes ?? 60),
    bufferBeforeMinutes: Number(r.buffer_before_minutes ?? 0),
    bufferAfterMinutes: Number(r.buffer_after_minutes ?? 0),
    version: Number(r.version ?? 1),
  };
}

function mapProposal(r: Row): MeetingTimeProposalDTO {
  return {
    id: String(r.id),
    meetingId: String(r.meeting_id),
    proposedByUserId: String(r.proposed_by_user_id),
    startAt: String(r.start_at),
    endAt: String(r.end_at),
    timezone: String(r.timezone),
    status: r.status as MeetingTimeProposalDTO["status"],
    version: Number(r.version ?? 1),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapResponse(r: Row): MeetingTimeProposalResponseDTO {
  return {
    id: String(r.id),
    proposalId: String(r.proposal_id),
    participantId: String(r.participant_id),
    response: r.response as MeetingTimeProposalResponseDTO["response"],
    respondedAt: String(r.responded_at),
  };
}

function mapProjection(r: Row): CalendarProjectionDTO {
  return {
    id: String(r.id),
    meetingId: String(r.meeting_id),
    participantUserId: String(r.participant_user_id),
    provider: r.provider as CalendarProjectionDTO["provider"],
    syncStatus: r.sync_status as CalendarProjectionDTO["syncStatus"],
    lastSyncedAt: (r.last_synced_at as string | null) ?? null,
    lastErrorCode: (r.last_error_code as string | null) ?? null,
    retryCount: Number(r.retry_count ?? 0),
  };
}

export function createCalendarRepository(supabase: SupabaseClient) {
  return {
    async listAccountsForUser(userId: string): Promise<CalendarAccountDTO[]> {
      const { data, error } = await supabase
        .from("business_calendar_accounts")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).map(mapAccount);
    },

    async getPreferences(userId: string): Promise<AvailabilityPreferencesDTO | null> {
      const { data, error } = await supabase
        .from("business_availability_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapPreferences(data) : null;
    },

    async listProposals(meetingId: string): Promise<MeetingTimeProposalDTO[]> {
      const { data, error } = await supabase
        .from("business_meeting_time_proposals")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("start_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapProposal);
    },

    async listResponsesForProposals(
      proposalIds: string[],
    ): Promise<MeetingTimeProposalResponseDTO[]> {
      if (proposalIds.length === 0) return [];
      const { data, error } = await supabase
        .from("business_meeting_time_proposal_responses")
        .select("*")
        .in("proposal_id", proposalIds);
      if (error) throw error;
      return (data ?? []).map(mapResponse);
    },

    async listProjections(meetingId: string): Promise<CalendarProjectionDTO[]> {
      const { data, error } = await supabase
        .from("business_meeting_calendar_projections")
        .select(
          "id, meeting_id, participant_user_id, provider, sync_status, last_synced_at, last_error_code, retry_count",
        )
        .eq("meeting_id", meetingId);
      if (error) throw error;
      return (data ?? []).map(mapProjection);
    },
  };
}

export type CalendarRepository = ReturnType<typeof createCalendarRepository>;

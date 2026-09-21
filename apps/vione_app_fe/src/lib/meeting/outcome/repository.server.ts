// BC-7.9 Turn A — Server-side outcome repository. Thin wrapper over RPCs
// and RLS-scoped reads. No authorization logic lives here.

import type { SupabaseClient } from "@supabase/supabase-js";
import { mapMeetingOutcomeError, MeetingOutcomeError } from "./errors";
import type { MeetingOutcomeStatus, MeetingOutcomeType } from "./types";

type Sb = SupabaseClient<any, any, any>;

export interface OutcomeRow {
  id: string;
  meeting_id: string;
  recorded_by_user_id: string;
  outcome_type: MeetingOutcomeType;
  outcome_status: MeetingOutcomeStatus;
  summary: string | null;
  finalized_at: string | null;
  version: number;
  client_request_id: string | null;
  created_at: string;
  updated_at: string;
}

export const MeetingOutcomeRepository = {
  async getByMeetingId(sb: Sb, meetingId: string): Promise<OutcomeRow | null> {
    const { data, error } = await sb
      .from("business_meeting_outcomes")
      .select(
        "id, meeting_id, recorded_by_user_id, outcome_type, outcome_status, summary, finalized_at, version, client_request_id, created_at, updated_at",
      )
      .eq("meeting_id", meetingId)
      .maybeSingle();
    if (error) throw new MeetingOutcomeError("MEETING_OUTCOME_INTERNAL_ERROR", error.message);
    return (data as OutcomeRow | null) ?? null;
  },

  async rpcCreate(
    sb: Sb,
    args: {
      meetingId: string;
      outcomeType: MeetingOutcomeType;
      summary: string | null;
      clientRequestId: string | null;
    },
  ): Promise<OutcomeRow> {
    const { data, error } = await sb.rpc("business_meeting_outcome_create", {
      _meeting_id: args.meetingId,
      _outcome_type: args.outcomeType,
      _summary: args.summary,
      _client_request_id: args.clientRequestId,
    });
    if (error) throw mapMeetingOutcomeError(error);
    return data as OutcomeRow;
  },

  async rpcUpdate(
    sb: Sb,
    args: {
      meetingId: string;
      expectedVersion: number;
      outcomeType?: MeetingOutcomeType;
      summary?: string | null;
      clearSummary?: boolean;
    },
  ): Promise<OutcomeRow> {
    const { data, error } = await sb.rpc("business_meeting_outcome_update", {
      _meeting_id: args.meetingId,
      _expected_version: args.expectedVersion,
      _outcome_type: args.outcomeType ?? null,
      _summary: args.summary ?? null,
      _clear_summary: args.clearSummary ?? false,
    });
    if (error) throw mapMeetingOutcomeError(error);
    return data as OutcomeRow;
  },

  async rpcFinalize(
    sb: Sb,
    args: { meetingId: string; expectedVersion: number },
  ): Promise<OutcomeRow> {
    const { data, error } = await sb.rpc("business_meeting_outcome_finalize", {
      _meeting_id: args.meetingId,
      _expected_version: args.expectedVersion,
    });
    if (error) throw mapMeetingOutcomeError(error);
    return data as OutcomeRow;
  },
};

export function toOutcomeDTO(row: OutcomeRow, viewerUserId: string) {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    outcomeType: row.outcome_type,
    outcomeStatus: row.outcome_status,
    summary: row.summary,
    version: row.version,
    finalizedAt: row.finalized_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewerIsRecorder: row.recorded_by_user_id === viewerUserId,
  };
}

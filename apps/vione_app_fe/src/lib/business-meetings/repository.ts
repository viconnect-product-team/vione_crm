// BC-4.1A — MeetingRepository.
// The SOLE ordinary read boundary for business_meetings,
// business_meeting_participants and business_meeting_proposals.
//
// Reads are participant-scoped by RLS (auth.uid() ∈ participants) AND by the
// trusted current-user id passed in. Mutations are NEVER done here — they go
// through the controlled business_meeting_* SECURITY DEFINER functions.
//
// Statically imports NO *.server module → safe from *.functions.ts.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { mapMeetingRow, mapParticipantRow, mapProposalRow } from "./mappers";
import {
  BUSINESS_MEETING_STATUSES,
  type BusinessMeetingDTO,
  type BusinessMeetingParticipantDTO,
  type BusinessMeetingParticipantRole,
  type BusinessMeetingProposalDTO,
  type MeetingListOptions,
  type StatusCounts,
} from "./types";

type DB = SupabaseClient<Database>;

const MEETINGS = "business_meetings";
const PARTICIPANTS = "business_meeting_participants";
const PROPOSALS = "business_meeting_proposals";

const MAX_PAGE = 100;
const DEFAULT_PAGE = 50;

function applyRange<Q extends { range: (from: number, to: number) => any }>(
  q: Q,
  options?: MeetingListOptions,
): Q {
  const limit = Math.min(Math.max(options?.limit ?? DEFAULT_PAGE, 1), MAX_PAGE);
  const offset = Math.max(options?.offset ?? 0, 0);
  return q.range(offset, offset + limit - 1) as Q;
}

const UPCOMING: readonly BusinessMeetingDTO["status"][] = ["proposed", "confirmed"];
const PAST: readonly BusinessMeetingDTO["status"][] = [
  "completed",
  "cancelled",
  "declined",
  "no_show",
];

export const MeetingRepository = {
  async findById(
    supabase: DB,
    userId: string,
    meetingId: string,
  ): Promise<BusinessMeetingDTO | null> {
    const { data, error } = await supabase
      .from(MEETINGS)
      .select("*")
      .eq("id", meetingId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    // RLS guarantees participant scoping; userId kept for explicit intent.
    void userId;
    return data ? mapMeetingRow(data as never) : null;
  },

  /** Meetings that are still active (proposed/confirmed) for the viewer. */
  async listUpcoming(
    supabase: DB,
    userId: string,
    options?: MeetingListOptions,
  ): Promise<BusinessMeetingDTO[]> {
    let q = supabase
      .from(MEETINGS)
      .select("*")
      .in("status", [...UPCOMING])
      .or(`organizer_user_id.eq.${userId},id.in.(${await participantMeetingIds(supabase, userId)})`)
      .order("updated_at", { ascending: false });
    q = applyRange(q, options);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapMeetingRow(r as never));
  },

  /** Meetings awaiting the viewer's response (proposed + pending participant). */
  async listPending(
    supabase: DB,
    userId: string,
    options?: MeetingListOptions,
  ): Promise<BusinessMeetingDTO[]> {
    const { data: parts, error: pErr } = await supabase
      .from(PARTICIPANTS)
      .select("meeting_id")
      .eq("user_id", userId)
      .eq("response_status", "pending");
    if (pErr) throw new Error(pErr.message);
    const ids = (parts ?? []).map((p) => (p as { meeting_id: string }).meeting_id);
    if (ids.length === 0) return [];
    let q = supabase
      .from(MEETINGS)
      .select("*")
      .in("id", ids)
      .eq("status", "proposed")
      .order("updated_at", { ascending: false });
    q = applyRange(q, options);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapMeetingRow(r as never));
  },

  async listPast(
    supabase: DB,
    userId: string,
    options?: MeetingListOptions,
  ): Promise<BusinessMeetingDTO[]> {
    let q = supabase
      .from(MEETINGS)
      .select("*")
      .in("status", [...PAST])
      .or(`organizer_user_id.eq.${userId},id.in.(${await participantMeetingIds(supabase, userId)})`)
      .order("updated_at", { ascending: false });
    q = applyRange(q, options);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapMeetingRow(r as never));
  },

  /** Cancelled meetings only (subset of PAST) for the viewer. */
  async listCancelled(
    supabase: DB,
    userId: string,
    options?: MeetingListOptions,
  ): Promise<BusinessMeetingDTO[]> {
    let q = supabase
      .from(MEETINGS)
      .select("*")
      .eq("status", "cancelled")
      .or(`organizer_user_id.eq.${userId},id.in.(${await participantMeetingIds(supabase, userId)})`)
      .order("updated_at", { ascending: false });
    q = applyRange(q, options);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapMeetingRow(r as never));
  },

  async getParticipants(supabase: DB, meetingId: string): Promise<BusinessMeetingParticipantDTO[]> {
    const { data, error } = await supabase
      .from(PARTICIPANTS)
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapParticipantRow(r as never));
  },

  async getActiveProposal(
    supabase: DB,
    meetingId: string,
  ): Promise<BusinessMeetingProposalDTO | null> {
    const { data: meeting, error: mErr } = await supabase
      .from(MEETINGS)
      .select("active_proposal_version")
      .eq("id", meetingId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    const version = (meeting as { active_proposal_version: number | null } | null)
      ?.active_proposal_version;
    if (version == null) return null;
    const { data, error } = await supabase
      .from(PROPOSALS)
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("version", version)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProposalRow(data as never) : null;
  },

  async getProposalHistory(supabase: DB, meetingId: string): Promise<BusinessMeetingProposalDTO[]> {
    const { data, error } = await supabase
      .from(PROPOSALS)
      .select("*")
      .eq("meeting_id", meetingId)
      .order("version", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapProposalRow(r as never));
  },

  async getViewerRole(
    supabase: DB,
    userId: string,
    meetingId: string,
  ): Promise<BusinessMeetingParticipantRole | null> {
    const { data, error } = await supabase
      .from(PARTICIPANTS)
      .select("role")
      .eq("meeting_id", meetingId)
      .eq("user_id", userId)
      .is("left_at", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? (data as { role: BusinessMeetingParticipantRole }).role : null;
  },

  async countByStatus(supabase: DB, userId: string): Promise<StatusCounts> {
    const { data, error } = await supabase
      .from(MEETINGS)
      .select("status")
      .or(
        `organizer_user_id.eq.${userId},id.in.(${await participantMeetingIds(supabase, userId)})`,
      );
    if (error) throw new Error(error.message);
    const counts = Object.fromEntries(BUSINESS_MEETING_STATUSES.map((s) => [s, 0])) as StatusCounts;
    for (const r of data ?? []) {
      const s = (r as { status: BusinessMeetingDTO["status"] }).status;
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  },
};

/** Comma-joined meeting ids where the viewer is a participant (for .or filters). */
async function participantMeetingIds(supabase: DB, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from(PARTICIPANTS)
    .select("meeting_id")
    .eq("user_id", userId)
    .is("left_at", null);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((p) => (p as { meeting_id: string }).meeting_id);
  // Return a value that never matches when empty, keeping the .or() valid.
  return ids.length ? ids.join(",") : "00000000-0000-0000-0000-000000000000";
}

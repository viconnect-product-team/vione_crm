// BC-7.9 Turn B — Server-side follow-up repository. Thin wrapper over RPCs.
// No authorization logic here.

import type { SupabaseClient } from "@supabase/supabase-js";
import { MeetingFollowUpError, mapMeetingFollowUpError } from "./errors";
import { deriveFollowUpTemporalState, deriveFollowUpViewerPermissions } from "./follow-up-policy";
import type { MeetingFollowUpDTO, MeetingFollowUpPriority, MeetingFollowUpStatus } from "./types";

type Sb = SupabaseClient<any, any, any>;

export interface FollowUpRow {
  id: string;
  meeting_id: string;
  outcome_id: string | null;
  created_by_user_id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  status: MeetingFollowUpStatus;
  priority: MeetingFollowUpPriority;
  due_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  client_request_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export const MeetingFollowUpRepository = {
  async listByMeeting(sb: Sb, meetingId: string): Promise<FollowUpRow[]> {
    const { data, error } = await sb
      .from("business_meeting_follow_ups")
      .select(
        "id, meeting_id, outcome_id, created_by_user_id, owner_user_id, title, description, status, priority, due_at, completed_at, cancelled_at, client_request_id, version, created_at, updated_at",
      )
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false });
    if (error) throw new MeetingFollowUpError("MEETING_FOLLOW_UP_INTERNAL_ERROR", error.message);
    return (data as FollowUpRow[] | null) ?? [];
  },

  async getById(sb: Sb, id: string): Promise<FollowUpRow | null> {
    const { data, error } = await sb
      .from("business_meeting_follow_ups")
      .select(
        "id, meeting_id, outcome_id, created_by_user_id, owner_user_id, title, description, status, priority, due_at, completed_at, cancelled_at, client_request_id, version, created_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw new MeetingFollowUpError("MEETING_FOLLOW_UP_INTERNAL_ERROR", error.message);
    return (data as FollowUpRow | null) ?? null;
  },

  async rpcCreate(
    sb: Sb,
    args: {
      meetingId: string;
      title: string;
      ownerUserId: string;
      description: string | null;
      priority: MeetingFollowUpPriority;
      dueAt: string | null;
      outcomeId: string | null;
      clientRequestId: string | null;
    },
  ): Promise<FollowUpRow> {
    const { data, error } = await sb.rpc("business_meeting_follow_up_create", {
      _meeting_id: args.meetingId,
      _title: args.title,
      _owner_user_id: args.ownerUserId,
      _description: args.description,
      _priority: args.priority,
      _due_at: args.dueAt,
      _outcome_id: args.outcomeId,
      _client_request_id: args.clientRequestId,
    });
    if (error) throw mapMeetingFollowUpError(error);
    return data as FollowUpRow;
  },

  async rpcUpdate(
    sb: Sb,
    args: {
      followUpId: string;
      expectedVersion: number;
      title?: string;
      description?: string | null;
      clearDescription?: boolean;
      priority?: MeetingFollowUpPriority;
      dueAt?: string | null;
      clearDueAt?: boolean;
      ownerUserId?: string;
    },
  ): Promise<FollowUpRow> {
    const { data, error } = await sb.rpc("business_meeting_follow_up_update", {
      _follow_up_id: args.followUpId,
      _expected_version: args.expectedVersion,
      _title: args.title ?? null,
      _description: args.description ?? null,
      _clear_description: args.clearDescription ?? false,
      _priority: args.priority ?? null,
      _due_at: args.dueAt ?? null,
      _clear_due_at: args.clearDueAt ?? false,
      _owner_user_id: args.ownerUserId ?? null,
    });
    if (error) throw mapMeetingFollowUpError(error);
    return data as FollowUpRow;
  },

  async rpcSetStatus(
    sb: Sb,
    args: {
      followUpId: string;
      expectedVersion: number;
      targetStatus: "in_progress" | "completed";
    },
  ): Promise<FollowUpRow> {
    const { data, error } = await sb.rpc("business_meeting_follow_up_set_status", {
      _follow_up_id: args.followUpId,
      _expected_version: args.expectedVersion,
      _target_status: args.targetStatus,
    });
    if (error) throw mapMeetingFollowUpError(error);
    return data as FollowUpRow;
  },

  async rpcCancel(
    sb: Sb,
    args: { followUpId: string; expectedVersion: number },
  ): Promise<FollowUpRow> {
    const { data, error } = await sb.rpc("business_meeting_follow_up_cancel", {
      _follow_up_id: args.followUpId,
      _expected_version: args.expectedVersion,
    });
    if (error) throw mapMeetingFollowUpError(error);
    return data as FollowUpRow;
  },
};

export interface FollowUpDtoCtx {
  viewerUserId: string;
  organizerUserId: string;
  isMeetingParticipant: boolean;
  now?: Date;
}

function identity(userId: string, ctx: FollowUpDtoCtx) {
  const isViewer = userId === ctx.viewerUserId;
  if (isViewer) return { kind: "self" as const, isViewer: true };
  if (userId === ctx.organizerUserId) return { kind: "organizer" as const, isViewer: false };
  // Server-side callers must set isMeetingParticipant true only if userId is
  // known to be a meeting participant; DTO doesn't leak raw uid either way.
  return { kind: "participant" as const, isViewer: false };
}

export function toFollowUpDTO(row: FollowUpRow, ctx: FollowUpDtoCtx): MeetingFollowUpDTO {
  const permissions = deriveFollowUpViewerPermissions({
    viewerUserId: ctx.viewerUserId,
    organizerUserId: ctx.organizerUserId,
    isMeetingParticipant: ctx.isMeetingParticipant,
    followUp: {
      ownerUserId: row.owner_user_id,
      createdByUserId: row.created_by_user_id,
      status: row.status,
    },
  });
  const temporalState = deriveFollowUpTemporalState({
    status: row.status,
    dueAt: row.due_at,
    now: ctx.now,
  });
  return {
    id: row.id,
    meetingId: row.meeting_id,
    outcomeId: row.outcome_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    temporalState,
    owner: identity(row.owner_user_id, ctx),
    createdBy: identity(row.created_by_user_id, ctx),
    viewerPermissions: permissions,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

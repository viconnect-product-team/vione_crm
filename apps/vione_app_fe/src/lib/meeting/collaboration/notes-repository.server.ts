// BC-7.10 Turn B — Notes repositories. Thin wrappers over RPCs and
// RLS-scoped SELECTs. No authorization logic here.

import type { SupabaseClient } from "@supabase/supabase-js";
import { MeetingCollaborationError, mapMeetingCollaborationError } from "./errors";
import type { MeetingPrivateNoteDTO, MeetingSharedNoteDTO, MeetingSharedNoteStatus } from "./types";

type Sb = SupabaseClient<any, any, any>;

// ---------- Private ----------

export interface PrivateNoteRow {
  id: string;
  meeting_id: string;
  user_id: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export function toPrivateNoteDTO(row: PrivateNoteRow): MeetingPrivateNoteDTO {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    userId: row.user_id,
    content: row.content,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const MeetingPrivateNoteRepository = {
  /** RLS restricts to auth.uid(); returns null when no row exists yet. */
  async getMine(sb: Sb, meetingId: string): Promise<PrivateNoteRow | null> {
    const { data, error } = await sb
      .from("business_meeting_private_notes")
      .select("id, meeting_id, user_id, content, version, created_at, updated_at")
      .eq("meeting_id", meetingId)
      .maybeSingle();
    if (error) {
      throw new MeetingCollaborationError("MEETING_COLLABORATION_INTERNAL_ERROR", error.message);
    }
    return (data as PrivateNoteRow | null) ?? null;
  },

  async rpcUpsert(
    sb: Sb,
    args: { meetingId: string; content: string; expectedVersion: number | null },
  ): Promise<PrivateNoteRow> {
    const { data, error } = await sb.rpc("business_meeting_private_note_upsert", {
      _meeting_id: args.meetingId,
      _content: args.content,
      _expected_version: args.expectedVersion,
    });
    if (error) throw mapMeetingCollaborationError(error);
    return data as PrivateNoteRow;
  },
};

// ---------- Shared ----------

export interface SharedNoteRow {
  id: string;
  meeting_id: string;
  content: string;
  note_status: MeetingSharedNoteStatus;
  updated_by_user_id: string;
  published_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export function toSharedNoteDTO(row: SharedNoteRow): MeetingSharedNoteDTO {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    content: row.content,
    noteStatus: row.note_status,
    updatedByUserId: row.updated_by_user_id,
    publishedAt: row.published_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const MeetingSharedNoteRepository = {
  async getByMeetingId(sb: Sb, meetingId: string): Promise<SharedNoteRow | null> {
    const { data, error } = await sb
      .from("business_meeting_shared_notes")
      .select(
        "id, meeting_id, content, note_status, updated_by_user_id, published_at, version, created_at, updated_at",
      )
      .eq("meeting_id", meetingId)
      .maybeSingle();
    if (error) {
      throw new MeetingCollaborationError("MEETING_COLLABORATION_INTERNAL_ERROR", error.message);
    }
    return (data as SharedNoteRow | null) ?? null;
  },

  async rpcGetOrCreate(sb: Sb, meetingId: string): Promise<SharedNoteRow> {
    const { data, error } = await sb.rpc("business_meeting_shared_note_get_or_create", {
      _meeting_id: meetingId,
    });
    if (error) throw mapMeetingCollaborationError(error);
    return data as SharedNoteRow;
  },

  async rpcUpdate(
    sb: Sb,
    args: { meetingId: string; expectedVersion: number; content: string },
  ): Promise<SharedNoteRow> {
    const { data, error } = await sb.rpc("business_meeting_shared_note_update", {
      _meeting_id: args.meetingId,
      _expected_version: args.expectedVersion,
      _content: args.content,
    });
    if (error) throw mapMeetingCollaborationError(error);
    return data as SharedNoteRow;
  },

  async rpcPublish(
    sb: Sb,
    args: { meetingId: string; expectedVersion: number },
  ): Promise<SharedNoteRow> {
    const { data, error } = await sb.rpc("business_meeting_shared_note_publish", {
      _meeting_id: args.meetingId,
      _expected_version: args.expectedVersion,
    });
    if (error) throw mapMeetingCollaborationError(error);
    return data as SharedNoteRow;
  },
};

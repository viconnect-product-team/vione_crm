// BC-7.10 Turn A — Server-side agenda repository. Thin wrapper over RPCs
// and RLS-scoped reads. No authorization logic here.

import type { SupabaseClient } from "@supabase/supabase-js";
import { MeetingCollaborationError, mapMeetingCollaborationError } from "./errors";
import type { MeetingAgendaItemDTO, MeetingAgendaStatus } from "./types";

type Sb = SupabaseClient<any, any, any>;

export interface AgendaItemRow {
  id: string;
  meeting_id: string;
  parent_id: string | null;
  created_by_user_id: string;
  title: string;
  description: string | null;
  position: number;
  status: MeetingAgendaStatus;
  estimated_minutes: number | null;
  owner_user_id: string | null;
  linked_follow_up_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export function toAgendaItemDTO(row: AgendaItemRow, viewerUserId: string): MeetingAgendaItemDTO {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    parentId: row.parent_id,
    title: row.title,
    description: row.description,
    position: row.position,
    status: row.status,
    estimatedMinutes: row.estimated_minutes,
    ownerUserId: row.owner_user_id,
    linkedFollowUpId: row.linked_follow_up_id,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewerIsCreator: row.created_by_user_id === viewerUserId,
  };
}

export const MeetingAgendaRepository = {
  async listByMeetingId(sb: Sb, meetingId: string): Promise<AgendaItemRow[]> {
    const { data, error } = await sb
      .from("business_meeting_agenda_items")
      .select(
        "id, meeting_id, parent_id, created_by_user_id, title, description, position, status, estimated_minutes, owner_user_id, linked_follow_up_id, version, created_at, updated_at",
      )
      .eq("meeting_id", meetingId)
      .order("parent_id", { ascending: true, nullsFirst: true })
      .order("position", { ascending: true });
    if (error) {
      throw new MeetingCollaborationError("MEETING_COLLABORATION_INTERNAL_ERROR", error.message);
    }
    return (data as AgendaItemRow[] | null) ?? [];
  },

  async rpcCreate(
    sb: Sb,
    args: {
      meetingId: string;
      title: string;
      description: string | null;
      parentId: string | null;
      estimatedMinutes: number | null;
      ownerUserId: string | null;
      linkedFollowUpId: string | null;
    },
  ): Promise<AgendaItemRow> {
    const { data, error } = await sb.rpc("business_meeting_agenda_item_create", {
      _meeting_id: args.meetingId,
      _title: args.title,
      _description: args.description,
      _parent_id: args.parentId,
      _estimated_minutes: args.estimatedMinutes,
      _owner_user_id: args.ownerUserId,
      _linked_follow_up_id: args.linkedFollowUpId,
    });
    if (error) throw mapMeetingCollaborationError(error);
    return data as AgendaItemRow;
  },

  async rpcUpdate(
    sb: Sb,
    args: {
      itemId: string;
      expectedVersion: number;
      title?: string;
      description?: string | null;
      clearDescription?: boolean;
      estimatedMinutes?: number | null;
      clearEstimatedMinutes?: boolean;
      ownerUserId?: string | null;
      clearOwner?: boolean;
      linkedFollowUpId?: string | null;
      clearLinkedFollowUp?: boolean;
    },
  ): Promise<AgendaItemRow> {
    const { data, error } = await sb.rpc("business_meeting_agenda_item_update", {
      _item_id: args.itemId,
      _expected_version: args.expectedVersion,
      _title: args.title ?? null,
      _description: args.description ?? null,
      _clear_description: args.clearDescription ?? false,
      _estimated_minutes: args.estimatedMinutes ?? null,
      _clear_estimated_minutes: args.clearEstimatedMinutes ?? false,
      _owner_user_id: args.ownerUserId ?? null,
      _clear_owner: args.clearOwner ?? false,
      _linked_follow_up_id: args.linkedFollowUpId ?? null,
      _clear_linked_follow_up: args.clearLinkedFollowUp ?? false,
    });
    if (error) throw mapMeetingCollaborationError(error);
    return data as AgendaItemRow;
  },

  async rpcSetStatus(
    sb: Sb,
    args: { itemId: string; expectedVersion: number; nextStatus: MeetingAgendaStatus },
  ): Promise<AgendaItemRow> {
    const { data, error } = await sb.rpc("business_meeting_agenda_item_set_status", {
      _item_id: args.itemId,
      _expected_version: args.expectedVersion,
      _next_status: args.nextStatus,
    });
    if (error) throw mapMeetingCollaborationError(error);
    return data as AgendaItemRow;
  },

  async rpcReorder(
    sb: Sb,
    args: {
      meetingId: string;
      parentId: string | null;
      orderedIds: string[];
      expectedVersions: number[];
    },
  ): Promise<{ reordered: number }> {
    const { data, error } = await sb.rpc("business_meeting_agenda_reorder", {
      _meeting_id: args.meetingId,
      _parent_id: args.parentId,
      _ordered_ids: args.orderedIds,
      _expected_versions: args.expectedVersions,
    });
    if (error) throw mapMeetingCollaborationError(error);
    return data as { reordered: number };
  },

  async rpcDelete(
    sb: Sb,
    args: { itemId: string; expectedVersion: number },
  ): Promise<{ deleted: string }> {
    const { data, error } = await sb.rpc("business_meeting_agenda_item_delete", {
      _item_id: args.itemId,
      _expected_version: args.expectedVersion,
    });
    if (error) throw mapMeetingCollaborationError(error);
    return data as { deleted: string };
  },
};

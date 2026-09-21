// BC-7.10 Turn A — Meeting Agenda service. Validates input, calls RPCs,
// maps stable errors, and produces safe DTOs. No UI concerns.

import type { SupabaseClient } from "@supabase/supabase-js";
import { MeetingCollaborationError, mapMeetingCollaborationError } from "./errors";
import { isKnownAgendaStatus } from "./registry";
import { MeetingAgendaRepository, toAgendaItemDTO, type AgendaItemRow } from "./repository.server";
import {
  normalizeAgendaDescription,
  normalizeAgendaTitle,
  normalizeEstimatedMinutes,
} from "./agenda-policy";
import type {
  CreateAgendaItemInput,
  DeleteAgendaItemInput,
  MeetingAgendaItemDTO,
  ReorderAgendaInput,
  SetAgendaItemStatusInput,
  UpdateAgendaItemInput,
} from "./types";

type Sb = SupabaseClient<any, any, any>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(v: string): void {
  if (!UUID_RE.test(v)) throw new MeetingCollaborationError("MEETING_COLLABORATION_NOT_FOUND");
}

function wrapValidation<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof Error && e.message === "MEETING_COLLABORATION_VALIDATION") {
      throw new MeetingCollaborationError("MEETING_COLLABORATION_VALIDATION");
    }
    throw e;
  }
}

export const MeetingAgendaService = {
  async listAgenda(
    sb: Sb,
    viewerUserId: string,
    meetingId: string,
  ): Promise<MeetingAgendaItemDTO[]> {
    assertUuid(meetingId);
    const rows = await MeetingAgendaRepository.listByMeetingId(sb, meetingId);
    return rows.map((r: any) => toAgendaItemDTO(r, viewerUserId));
  },

  async createItem(
    sb: Sb,
    viewerUserId: string,
    input: CreateAgendaItemInput,
  ): Promise<MeetingAgendaItemDTO> {
    assertUuid(input.meetingId);
    if (input.parentId) assertUuid(input.parentId);
    if (input.ownerUserId) assertUuid(input.ownerUserId);
    if (input.linkedFollowUpId) assertUuid(input.linkedFollowUpId);
    const title = wrapValidation(() => normalizeAgendaTitle(input.title));
    const description = wrapValidation(() => normalizeAgendaDescription(input.description ?? null));
    const estimated = wrapValidation(() =>
      normalizeEstimatedMinutes(input.estimatedMinutes ?? null),
    );
    let row: AgendaItemRow;
    try {
      row = await MeetingAgendaRepository.rpcCreate(sb, {
        meetingId: input.meetingId,
        title,
        description,
        parentId: input.parentId ?? null,
        estimatedMinutes: estimated,
        ownerUserId: input.ownerUserId ?? null,
        linkedFollowUpId: input.linkedFollowUpId ?? null,
      });
    } catch (e) {
      throw mapMeetingCollaborationError(e);
    }
    return toAgendaItemDTO(row, viewerUserId);
  },

  async updateItem(
    sb: Sb,
    viewerUserId: string,
    input: UpdateAgendaItemInput,
  ): Promise<MeetingAgendaItemDTO> {
    assertUuid(input.itemId);
    if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
      throw new MeetingCollaborationError("MEETING_COLLABORATION_VERSION_CONFLICT");
    }
    const title =
      input.title !== undefined
        ? wrapValidation(() => normalizeAgendaTitle(input.title!))
        : undefined;
    let descriptionArg: string | null | undefined;
    if (input.clearDescription) descriptionArg = null;
    else if (input.description !== undefined) {
      descriptionArg = wrapValidation(() => normalizeAgendaDescription(input.description));
    }
    let estArg: number | null | undefined;
    if (input.clearEstimatedMinutes) estArg = null;
    else if (input.estimatedMinutes !== undefined) {
      estArg = wrapValidation(() => normalizeEstimatedMinutes(input.estimatedMinutes));
    }
    if (input.ownerUserId != null) assertUuid(input.ownerUserId);
    if (input.linkedFollowUpId != null) assertUuid(input.linkedFollowUpId);
    let row: AgendaItemRow;
    try {
      row = await MeetingAgendaRepository.rpcUpdate(sb, {
        itemId: input.itemId,
        expectedVersion: input.expectedVersion,
        title,
        description: descriptionArg,
        clearDescription: input.clearDescription === true,
        estimatedMinutes: estArg,
        clearEstimatedMinutes: input.clearEstimatedMinutes === true,
        ownerUserId: input.ownerUserId ?? undefined,
        clearOwner: input.clearOwner === true,
        linkedFollowUpId: input.linkedFollowUpId ?? undefined,
        clearLinkedFollowUp: input.clearLinkedFollowUp === true,
      });
    } catch (e) {
      throw mapMeetingCollaborationError(e);
    }
    return toAgendaItemDTO(row, viewerUserId);
  },

  async setItemStatus(
    sb: Sb,
    viewerUserId: string,
    input: SetAgendaItemStatusInput,
  ): Promise<MeetingAgendaItemDTO> {
    assertUuid(input.itemId);
    if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
      throw new MeetingCollaborationError("MEETING_COLLABORATION_VERSION_CONFLICT");
    }
    if (!isKnownAgendaStatus(input.nextStatus)) {
      throw new MeetingCollaborationError("MEETING_COLLABORATION_VALIDATION");
    }
    let row: AgendaItemRow;
    try {
      row = await MeetingAgendaRepository.rpcSetStatus(sb, input);
    } catch (e) {
      throw mapMeetingCollaborationError(e);
    }
    return toAgendaItemDTO(row, viewerUserId);
  },

  async reorderAgenda(
    sb: Sb,
    _viewerUserId: string,
    input: ReorderAgendaInput,
  ): Promise<{ reordered: number }> {
    assertUuid(input.meetingId);
    if (input.parentId) assertUuid(input.parentId);
    if (
      !Array.isArray(input.orderedIds) ||
      !Array.isArray(input.expectedVersions) ||
      input.orderedIds.length !== input.expectedVersions.length ||
      input.orderedIds.length === 0
    ) {
      throw new MeetingCollaborationError("MEETING_COLLABORATION_VALIDATION");
    }
    for (const id of input.orderedIds) assertUuid(id);
    try {
      return await MeetingAgendaRepository.rpcReorder(sb, input);
    } catch (e) {
      throw mapMeetingCollaborationError(e);
    }
  },

  async deleteItem(
    sb: Sb,
    _viewerUserId: string,
    input: DeleteAgendaItemInput,
  ): Promise<{ deleted: string }> {
    assertUuid(input.itemId);
    if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
      throw new MeetingCollaborationError("MEETING_COLLABORATION_VERSION_CONFLICT");
    }
    try {
      return await MeetingAgendaRepository.rpcDelete(sb, input);
    } catch (e) {
      throw mapMeetingCollaborationError(e);
    }
  },
};

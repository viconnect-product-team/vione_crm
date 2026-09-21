// BC-7.10 — MeetingCollaborationSDK public surface.
// Turn A: agenda. Turn B: private + shared notes as separate SDKs.

import {
  createAgendaItemFn,
  deleteAgendaItemFn,
  listMeetingAgendaFn,
  reorderAgendaFn,
  setAgendaItemStatusFn,
  updateAgendaItemFn,
} from "./functions";
import {
  getMyPrivateNoteFn,
  getSharedNoteFn,
  initSharedNoteFn,
  publishSharedNoteFn,
  updateSharedNoteFn,
  upsertPrivateNoteFn,
} from "./notes-functions";
import type {
  CreateAgendaItemInput,
  DeleteAgendaItemInput,
  MeetingAgendaItemDTO,
  MeetingPrivateNoteDTO,
  MeetingSharedNoteDTO,
  PublishSharedNoteInput,
  ReorderAgendaInput,
  SetAgendaItemStatusInput,
  UpdateAgendaItemInput,
  UpdateSharedNoteInput,
  UpsertPrivateNoteInput,
} from "./types";

export interface MeetingAgendaSDKType {
  listAgenda(meetingId: string): Promise<MeetingAgendaItemDTO[]>;
  createAgendaItem(input: CreateAgendaItemInput): Promise<MeetingAgendaItemDTO>;
  updateAgendaItem(input: UpdateAgendaItemInput): Promise<MeetingAgendaItemDTO>;
  setAgendaItemStatus(input: SetAgendaItemStatusInput): Promise<MeetingAgendaItemDTO>;
  reorderAgenda(input: ReorderAgendaInput): Promise<{ reordered: number }>;
  deleteAgendaItem(input: DeleteAgendaItemInput): Promise<{ deleted: string }>;
}

export const MeetingAgendaSDK: MeetingAgendaSDKType = Object.freeze({
  listAgenda: (meetingId: string) =>
    listMeetingAgendaFn({ data: { meetingId } }) as Promise<MeetingAgendaItemDTO[]>,
  createAgendaItem: (input: CreateAgendaItemInput) =>
    createAgendaItemFn({
      data: {
        meetingId: input.meetingId,
        title: input.title,
        description: input.description ?? null,
        parentId: input.parentId ?? null,
        estimatedMinutes: input.estimatedMinutes ?? null,
        ownerUserId: input.ownerUserId ?? null,
        linkedFollowUpId: input.linkedFollowUpId ?? null,
      },
    }) as Promise<MeetingAgendaItemDTO>,
  updateAgendaItem: (input: UpdateAgendaItemInput) =>
    updateAgendaItemFn({
      data: {
        itemId: input.itemId,
        expectedVersion: input.expectedVersion,
        title: input.title,
        description: input.description ?? null,
        clearDescription: input.clearDescription ?? false,
        estimatedMinutes: input.estimatedMinutes ?? null,
        clearEstimatedMinutes: input.clearEstimatedMinutes ?? false,
        ownerUserId: input.ownerUserId ?? null,
        clearOwner: input.clearOwner ?? false,
        linkedFollowUpId: input.linkedFollowUpId ?? null,
        clearLinkedFollowUp: input.clearLinkedFollowUp ?? false,
      },
    }) as Promise<MeetingAgendaItemDTO>,
  setAgendaItemStatus: (input: SetAgendaItemStatusInput) =>
    setAgendaItemStatusFn({ data: input }) as Promise<MeetingAgendaItemDTO>,
  reorderAgenda: (input: ReorderAgendaInput) =>
    reorderAgendaFn({
      data: {
        meetingId: input.meetingId,
        parentId: input.parentId ?? null,
        orderedIds: input.orderedIds,
        expectedVersions: input.expectedVersions,
      },
    }) as Promise<{ reordered: number }>,
  deleteAgendaItem: (input: DeleteAgendaItemInput) =>
    deleteAgendaItemFn({ data: input }) as Promise<{ deleted: string }>,
});

export const MEETING_AGENDA_SDK_METHODS = Object.freeze([
  "listAgenda",
  "createAgendaItem",
  "updateAgendaItem",
  "setAgendaItemStatus",
  "reorderAgenda",
  "deleteAgendaItem",
] as const);

// ============================================================
// Turn B — Notes SDKs
// ============================================================

export interface MeetingPrivateNoteSDKType {
  /** Owner-only read. Returns null when the user hasn't saved a note yet. */
  getMyNote(meetingId: string): Promise<MeetingPrivateNoteDTO | null>;
  /** First save: expectedVersion = null. Subsequent: current version. */
  upsertMyNote(input: UpsertPrivateNoteInput): Promise<MeetingPrivateNoteDTO>;
}

export const MeetingPrivateNoteSDK: MeetingPrivateNoteSDKType = Object.freeze({
  getMyNote: (meetingId: string) =>
    getMyPrivateNoteFn({ data: { meetingId } }) as Promise<MeetingPrivateNoteDTO | null>,
  upsertMyNote: (input: UpsertPrivateNoteInput) =>
    upsertPrivateNoteFn({
      data: {
        meetingId: input.meetingId,
        content: input.content,
        expectedVersion: input.expectedVersion,
      },
    }) as Promise<MeetingPrivateNoteDTO>,
});

export const MEETING_PRIVATE_NOTE_SDK_METHODS = Object.freeze([
  "getMyNote",
  "upsertMyNote",
] as const);

export interface MeetingSharedNoteSDKType {
  /** Read canonical shared note. RLS: participant/organizer/admin. */
  getNote(meetingId: string): Promise<MeetingSharedNoteDTO | null>;
  /** Organizer-only. Idempotent. */
  initNote(meetingId: string): Promise<MeetingSharedNoteDTO>;
  /** Organizer-only. Blocked once published. */
  updateDraft(input: UpdateSharedNoteInput): Promise<MeetingSharedNoteDTO>;
  /** Organizer-only. draft → published (terminal). */
  publish(input: PublishSharedNoteInput): Promise<MeetingSharedNoteDTO>;
}

export const MeetingSharedNoteSDK: MeetingSharedNoteSDKType = Object.freeze({
  getNote: (meetingId: string) =>
    getSharedNoteFn({ data: { meetingId } }) as Promise<MeetingSharedNoteDTO | null>,
  initNote: (meetingId: string) =>
    initSharedNoteFn({ data: { meetingId } }) as Promise<MeetingSharedNoteDTO>,
  updateDraft: (input: UpdateSharedNoteInput) =>
    updateSharedNoteFn({ data: input }) as Promise<MeetingSharedNoteDTO>,
  publish: (input: PublishSharedNoteInput) =>
    publishSharedNoteFn({ data: input }) as Promise<MeetingSharedNoteDTO>,
});

export const MEETING_SHARED_NOTE_SDK_METHODS = Object.freeze([
  "getNote",
  "initNote",
  "updateDraft",
  "publish",
] as const);

/** Aggregate collaboration SDK — agenda + notes surfaces kept separate. */
export interface MeetingCollaborationSDKType {
  agenda: MeetingAgendaSDKType;
  privateNotes: MeetingPrivateNoteSDKType;
  sharedNotes: MeetingSharedNoteSDKType;
}

export const MeetingCollaborationSDK: MeetingCollaborationSDKType = Object.freeze({
  agenda: MeetingAgendaSDK,
  privateNotes: MeetingPrivateNoteSDK,
  sharedNotes: MeetingSharedNoteSDK,
});

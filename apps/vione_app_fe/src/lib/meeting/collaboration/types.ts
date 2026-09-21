// BC-7.10 Turn A — Meeting Collaboration domain types (frozen surface).
// Turn B extends with private + shared notes types.

export const MEETING_AGENDA_STATUSES = [
  "planned",
  "in_discussion",
  "discussed",
  "skipped",
] as const;
export type MeetingAgendaStatus = (typeof MEETING_AGENDA_STATUSES)[number];

export const MEETING_AGENDA_TITLE_MAX = 240;
export const MEETING_AGENDA_DESCRIPTION_MAX = 2000;
export const MEETING_AGENDA_MAX_ESTIMATED_MINUTES = 24 * 60;

export interface MeetingAgendaItemDTO {
  id: string;
  meetingId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  position: number;
  status: MeetingAgendaStatus;
  estimatedMinutes: number | null;
  ownerUserId: string | null;
  linkedFollowUpId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  viewerIsCreator: boolean;
}

export interface MeetingAgendaPermissions {
  canCreate: boolean;
  canReorder: boolean;
  canManage: boolean;
  canRead: boolean;
}

export interface CreateAgendaItemInput {
  meetingId: string;
  title: string;
  description?: string | null;
  parentId?: string | null;
  estimatedMinutes?: number | null;
  ownerUserId?: string | null;
  linkedFollowUpId?: string | null;
}

export interface UpdateAgendaItemInput {
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
}

export interface SetAgendaItemStatusInput {
  itemId: string;
  expectedVersion: number;
  nextStatus: MeetingAgendaStatus;
}

export interface ReorderAgendaInput {
  meetingId: string;
  parentId: string | null;
  orderedIds: string[];
  expectedVersions: number[];
}

export interface DeleteAgendaItemInput {
  itemId: string;
  expectedVersion: number;
}

// ============================================================
// Turn B — Notes
// ============================================================

/** Both private and shared notes share the same content ceiling. */
export const MEETING_NOTE_CONTENT_MAX = 20000;

/** Private note DTO. Owner-only visibility. */
export interface MeetingPrivateNoteDTO {
  id: string;
  meetingId: string;
  userId: string;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertPrivateNoteInput {
  meetingId: string;
  content: string;
  /** null on first save; required on subsequent saves. */
  expectedVersion: number | null;
}

/** Shared note status. Terminal: published. */
export const MEETING_SHARED_NOTE_STATUSES = ["draft", "published"] as const;
export type MeetingSharedNoteStatus = (typeof MEETING_SHARED_NOTE_STATUSES)[number];

export interface MeetingSharedNoteDTO {
  id: string;
  meetingId: string;
  content: string;
  noteStatus: MeetingSharedNoteStatus;
  updatedByUserId: string;
  publishedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingSharedNotePermissions {
  canRead: boolean;
  canEditDraft: boolean;
  canPublish: boolean;
  /** Organizer may create the canonical document (get-or-create). */
  canInitialize: boolean;
}

export interface UpdateSharedNoteInput {
  meetingId: string;
  expectedVersion: number;
  content: string;
}

export interface PublishSharedNoteInput {
  meetingId: string;
  expectedVersion: number;
}

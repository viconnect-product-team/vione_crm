// BC-7.10 Turn B — Pure notes policy: statuses, transitions, normalization,
// derived authority. No IO. Errors as MeetingCollaborationError.

import { MeetingCollaborationError } from "./errors";
import type {
  MeetingSharedNoteDTO,
  MeetingSharedNotePermissions,
  MeetingSharedNoteStatus,
} from "./types";
import { MEETING_NOTE_CONTENT_MAX, MEETING_SHARED_NOTE_STATUSES } from "./types";

const SHARED_STATUS_SET: ReadonlySet<string> = new Set(MEETING_SHARED_NOTE_STATUSES);

export function isKnownSharedNoteStatus(v: unknown): v is MeetingSharedNoteStatus {
  return typeof v === "string" && SHARED_STATUS_SET.has(v);
}

/** Frozen shared-note transitions. Terminal: published. */
export function isAllowedSharedNoteTransition(
  from: MeetingSharedNoteStatus,
  to: MeetingSharedNoteStatus,
): boolean {
  return from === "draft" && to === "published";
}

/** Normalize note content — plain text; caps at MEETING_NOTE_CONTENT_MAX. */
export function normalizeNoteContent(v: string | null | undefined): string {
  const s = v == null ? "" : String(v);
  if (s.length > MEETING_NOTE_CONTENT_MAX) {
    throw new MeetingCollaborationError("MEETING_COLLABORATION_VALIDATION");
  }
  return s;
}

export interface SharedNoteAuthorityCtx {
  viewerUserId: string;
  organizerUserId: string;
  isParticipant: boolean;
  meetingStatus:
    | "scheduled"
    | "confirmed"
    | "tentative"
    | "cancelled"
    | "completed"
    | "no_show"
    | "in_progress";
}

function isOrganizer(ctx: SharedNoteAuthorityCtx): boolean {
  return ctx.viewerUserId === ctx.organizerUserId;
}

export function isSharedNoteMeetingStateEligible(
  s: SharedNoteAuthorityCtx["meetingStatus"],
): boolean {
  return s !== "cancelled";
}

export function canReadSharedNote(ctx: SharedNoteAuthorityCtx): boolean {
  return isOrganizer(ctx) || ctx.isParticipant;
}

export function canManageSharedNoteDraft(
  ctx: SharedNoteAuthorityCtx,
  note: Pick<MeetingSharedNoteDTO, "noteStatus"> | null,
): boolean {
  if (!isOrganizer(ctx)) return false;
  if (!isSharedNoteMeetingStateEligible(ctx.meetingStatus)) return false;
  if (note && note.noteStatus === "published") return false;
  return true;
}

export function canPublishSharedNote(
  ctx: SharedNoteAuthorityCtx,
  note: Pick<MeetingSharedNoteDTO, "noteStatus"> | null,
): boolean {
  if (!note) return false;
  if (!isOrganizer(ctx)) return false;
  if (!isSharedNoteMeetingStateEligible(ctx.meetingStatus)) return false;
  return note.noteStatus === "draft";
}

export function deriveSharedNotePermissions(
  ctx: SharedNoteAuthorityCtx,
  note: Pick<MeetingSharedNoteDTO, "noteStatus"> | null,
): MeetingSharedNotePermissions {
  return {
    canRead: canReadSharedNote(ctx),
    canEditDraft: canManageSharedNoteDraft(ctx, note),
    canPublish: canPublishSharedNote(ctx, note),
    canInitialize: isOrganizer(ctx) && isSharedNoteMeetingStateEligible(ctx.meetingStatus),
  };
}

/** Private notes are always owner-only. Kept for symmetry. */
export function canReadPrivateNote(viewerUserId: string, ownerUserId: string): boolean {
  return viewerUserId === ownerUserId;
}

// BC-7.10 Turn A — Pure agenda authority + eligibility policy. No I/O.

import {
  MEETING_AGENDA_DESCRIPTION_MAX,
  MEETING_AGENDA_MAX_ESTIMATED_MINUTES,
  MEETING_AGENDA_TITLE_MAX,
  type MeetingAgendaItemDTO,
  type MeetingAgendaPermissions,
  type MeetingAgendaStatus,
} from "./types";
import { isAllowedAgendaTransition } from "./registry";

/** Meeting statuses relevant for agenda eligibility. */
export type EligibleMeetingStatus =
  | "draft"
  | "proposed"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed"
  | "no_show"
  | "in_progress";

export interface AgendaAuthorityCtx {
  viewerUserId: string;
  organizerUserId: string;
  isParticipant: boolean;
  meetingStatus: EligibleMeetingStatus;
}

/** Agenda edits allowed while meeting is not cancelled. */
export function isAgendaMeetingStateEligible(s: EligibleMeetingStatus): boolean {
  return s !== "cancelled";
}

function isOrganizer(ctx: AgendaAuthorityCtx): boolean {
  return ctx.viewerUserId === ctx.organizerUserId;
}

export function canManageAgenda(ctx: AgendaAuthorityCtx): boolean {
  return isOrganizer(ctx) && isAgendaMeetingStateEligible(ctx.meetingStatus);
}

export function canReadAgenda(ctx: AgendaAuthorityCtx): boolean {
  return isOrganizer(ctx) || ctx.isParticipant;
}

export function canDeleteAgendaItem(
  ctx: AgendaAuthorityCtx,
  item: Pick<MeetingAgendaItemDTO, "status">,
): boolean {
  return canManageAgenda(ctx) && item.status === "planned";
}

export function canTransitionAgendaItem(
  ctx: AgendaAuthorityCtx,
  from: MeetingAgendaStatus,
  to: MeetingAgendaStatus,
): boolean {
  return canManageAgenda(ctx) && isAllowedAgendaTransition(from, to);
}

export function deriveAgendaPermissions(ctx: AgendaAuthorityCtx): MeetingAgendaPermissions {
  const manage = canManageAgenda(ctx);
  return {
    canCreate: manage,
    canReorder: manage,
    canManage: manage,
    canRead: canReadAgenda(ctx),
  };
}

/** Pure input validators — throws MeetingCollaborationError("MEETING_COLLABORATION_VALIDATION"). */
export function normalizeAgendaTitle(v: string): string {
  const t = String(v ?? "").trim();
  if (t.length === 0 || t.length > MEETING_AGENDA_TITLE_MAX) {
    throw new Error("MEETING_COLLABORATION_VALIDATION");
  }
  return t;
}

export function normalizeAgendaDescription(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  if (t.length === 0) return null;
  if (t.length > MEETING_AGENDA_DESCRIPTION_MAX) {
    throw new Error("MEETING_COLLABORATION_VALIDATION");
  }
  return t;
}

export function normalizeEstimatedMinutes(v: number | null | undefined): number | null {
  if (v == null) return null;
  if (!Number.isInteger(v) || v < 0 || v > MEETING_AGENDA_MAX_ESTIMATED_MINUTES) {
    throw new Error("MEETING_COLLABORATION_VALIDATION");
  }
  return v;
}

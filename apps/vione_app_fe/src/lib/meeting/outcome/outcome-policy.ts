// BC-7.9 Turn A — Pure outcome authority + eligibility policy.
// No I/O. Every branch is unit-tested.

import type { MeetingOutcomeDTO, MeetingOutcomePermissions } from "./types";

/** Meeting statuses (BC-7.6). Kept as a string union to avoid enum coupling. */
export type EligibleMeetingStatus =
  | "draft"
  | "proposed"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed"
  | "no_show"
  | "in_progress"; // spec-reserved

export interface OutcomeAuthorityCtx {
  viewerUserId: string;
  organizerUserId: string;
  isParticipant: boolean;
  meetingStatus: EligibleMeetingStatus;
  outcome: Pick<MeetingOutcomeDTO, "outcomeStatus"> | null;
}

export function isOutcomeMeetingStateEligible(s: EligibleMeetingStatus): boolean {
  return s === "completed" || s === "in_progress";
}

function isOrganizer(ctx: OutcomeAuthorityCtx): boolean {
  return ctx.viewerUserId === ctx.organizerUserId;
}

export function canCreateOutcome(ctx: OutcomeAuthorityCtx): boolean {
  if (!isOrganizer(ctx)) return false;
  if (!isOutcomeMeetingStateEligible(ctx.meetingStatus)) return false;
  return ctx.outcome === null;
}

export function canUpdateOutcome(ctx: OutcomeAuthorityCtx): boolean {
  if (!isOrganizer(ctx)) return false;
  if (!isOutcomeMeetingStateEligible(ctx.meetingStatus)) return false;
  return ctx.outcome !== null && ctx.outcome.outcomeStatus === "draft";
}

export function canFinalizeOutcome(ctx: OutcomeAuthorityCtx): boolean {
  if (!isOrganizer(ctx)) return false;
  if (!isOutcomeMeetingStateEligible(ctx.meetingStatus)) return false;
  return ctx.outcome !== null && ctx.outcome.outcomeStatus === "draft";
}

export function canReadOutcome(ctx: OutcomeAuthorityCtx): boolean {
  return isOrganizer(ctx) || ctx.isParticipant;
}

export function validateOutcomeTransition(
  from: "draft" | "finalized" | null,
  to: "draft" | "finalized",
):
  | { ok: true }
  | { ok: false; code: "MEETING_OUTCOME_FINALIZED" | "MEETING_OUTCOME_INVALID_STATE" } {
  if (from === "finalized") return { ok: false, code: "MEETING_OUTCOME_FINALIZED" };
  if (from === null && to === "finalized") {
    return { ok: false, code: "MEETING_OUTCOME_INVALID_STATE" };
  }
  return { ok: true };
}

export function derivePermissions(ctx: OutcomeAuthorityCtx): MeetingOutcomePermissions {
  return {
    canCreate: canCreateOutcome(ctx),
    canUpdate: canUpdateOutcome(ctx),
    canFinalize: canFinalizeOutcome(ctx),
    canRead: canReadOutcome(ctx),
  };
}

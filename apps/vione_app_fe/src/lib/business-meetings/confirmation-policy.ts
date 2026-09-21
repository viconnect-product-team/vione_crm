// BC-7.6 — Meeting Request Confirmation Policy (CANONICAL).
//
// Single source of truth for "may this meeting become confirmed?". Consumed
// by (a) the DB RPC `business_meeting_accept` under row-lock, (b) the
// application service for early rejection, (c) the capability derivation for
// advisory UI gating. UI enforcement is advisory only — the DB is the
// consistency and security boundary.
//
// Invariant (frozen):
//   A meeting request may transition to CONFIRMED iff EVERY required
//   participant has explicitly ACCEPTED. Tentative, pending, and declined
//   all block confirmation. Optional participants do NOT gate confirmation.
//
// This rule naturally reduces to the correct behaviour for two-party
// (organizer + 1 required) meetings: the single required participant's
// accept immediately satisfies the invariant.

import type { BusinessMeetingParticipantRole, BusinessMeetingResponseStatus } from "./types";

/** Minimal participant projection needed by the policy. */
export type ConfirmationParticipant = {
  role: BusinessMeetingParticipantRole;
  responseStatus: BusinessMeetingResponseStatus;
  /** Set for participants who have been removed from the active set. */
  leftAt?: string | null;
};

export type ConfirmationBlockedReason =
  | "NO_REQUIRED_PARTICIPANTS"
  | "PENDING_REQUIRED"
  | "TENTATIVE_REQUIRED"
  | "DECLINED_REQUIRED"
  | "PROPOSED_NEW_TIME_REQUIRED";

export type ConfirmationEvaluation =
  | { eligible: true }
  | { eligible: false; blockedBy: ConfirmationBlockedReason };

const BLOCKING_BY_STATUS: Record<BusinessMeetingResponseStatus, ConfirmationBlockedReason | null> =
  {
    pending: "PENDING_REQUIRED",
    tentative: "TENTATIVE_REQUIRED",
    declined: "DECLINED_REQUIRED",
    proposed_new_time: "PROPOSED_NEW_TIME_REQUIRED",
    accepted: null,
  };

/**
 * Evaluate whether the invariant is satisfied. Deterministic, pure, no I/O.
 *
 * Rules:
 *   • Only rows with `role = 'required'` (and the organizer) count toward the
 *     invariant. Optional participants never block confirmation.
 *   • Organizer is always treated as accepted (organizer invariant).
 *   • Participants with `leftAt` are excluded from the required set.
 *   • Any non-accepted required participant blocks confirmation.
 *   • A meeting with ZERO non-organizer required participants is NOT
 *     confirmable (no one to accept) — matches DB proposal eligibility.
 */
export function evaluateConfirmationEligibility(
  participants: readonly ConfirmationParticipant[],
): ConfirmationEvaluation {
  const active = participants.filter((p) => !p.leftAt);
  const required = active.filter((p) => p.role === "required" || p.role === "organizer");
  const nonOrganizerRequired = required.filter((p) => p.role !== "organizer");
  if (nonOrganizerRequired.length === 0) {
    return { eligible: false, blockedBy: "NO_REQUIRED_PARTICIPANTS" };
  }
  for (const p of nonOrganizerRequired) {
    const reason = BLOCKING_BY_STATUS[p.responseStatus];
    if (reason) return { eligible: false, blockedBy: reason };
  }
  return { eligible: true };
}

/**
 * Advisory: given the viewer's own participant row, may they perform the
 * response operation right now (before RPC re-validates)?
 */
export function canParticipantRespond(viewer: ConfirmationParticipant | null): boolean {
  if (!viewer || viewer.leftAt) return false;
  if (viewer.role === "organizer") return false;
  return viewer.responseStatus === "pending" || viewer.responseStatus === "tentative";
}

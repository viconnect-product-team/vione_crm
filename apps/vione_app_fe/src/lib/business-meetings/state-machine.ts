// BC-4.1A (SUPERSEDED BY BC-7.6) — Pure Business Meeting state machine.
//
// BC-7.6 supersession notice:
//   • `accept` returns `to: 'confirmed'` only as the OPTIMISTIC lifecycle
//     transition; the DB RPC gates the actual state change behind
//     `evaluateConfirmationEligibility` (all required participants accepted).
//     For N-party meetings, an intermediate accept keeps meeting.status =
//     'proposed' and only mutates the participant response row.
//   • `decline` is now a PARTICIPANT-level operation and no longer terminates
//     the meeting. The machine returns `to: 'proposed'` (meeting stays), and
//     the DB updates the participant's response_status to 'declined'.
//   • `tentative` is a new participant-level operation with the same
//     invariant (meeting stays 'proposed').
//
// Actor is resolved from trusted context only (organizer / participant), never
// from client input. Terminal states remain immutable.

import type { BusinessMeetingOperation, BusinessMeetingStatus } from "./types";

export type MeetingLifecycleState = BusinessMeetingStatus;

/** Trusted actor identity relative to the meeting. */
export type MeetingActor =
  | "organizer"
  | "participant" // any active non-organizer participant / invited recipient
  | "either" // any active participant (organizer or not)
  | "non_participant";

export type MeetingTransitionRequest = {
  from: MeetingLifecycleState;
  operation: BusinessMeetingOperation;
  actor: MeetingActor;
};

export type MeetingTransitionResult =
  | { ok: true; to: BusinessMeetingStatus }
  | { ok: false; reason: string };

export const TERMINAL_STATUSES: ReadonlySet<BusinessMeetingStatus> = new Set([
  "declined",
  "cancelled",
  "completed",
  "no_show",
]);

export function isTerminal(status: BusinessMeetingStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * Frozen transition table under BC-7.6:
 *
 *   draft      → propose        → proposed   (organizer)
 *   proposed   → accept         → confirmed* (invited participant; * DB-gated)
 *   proposed   → decline        → proposed   (invited participant; participant-level)
 *   proposed   → tentative      → proposed   (invited participant; participant-level)
 *   proposed   → cancel         → cancelled  (organizer)
 *   proposed   → reschedule     → proposed   (either participant, new version)
 *   confirmed  → reschedule     → proposed   (either participant, new version)
 *   confirmed  → cancel         → cancelled  (organizer)
 *   confirmed  → complete       → completed  (either participant)
 *   confirmed  → mark_no_show   → no_show    (either participant)
 */
export function evaluateMeetingTransition(req: MeetingTransitionRequest): MeetingTransitionResult {
  const { from, operation, actor } = req;

  if (actor === "non_participant") {
    return { ok: false, reason: "MEETING_NOT_PARTICIPANT" };
  }
  if (isTerminal(from)) {
    return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
  }

  switch (operation) {
    case "propose":
      if (from !== "draft") return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
      if (actor !== "organizer") return { ok: false, reason: "MEETING_NOT_ORGANIZER" };
      return { ok: true, to: "proposed" };

    case "accept":
      if (from !== "proposed") return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
      // Organizer cannot accept their own proposal; only an invited participant.
      if (actor === "organizer") return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
      // Optimistic target — DB re-checks the confirmation policy under lock.
      return { ok: true, to: "confirmed" };

    case "decline":
      if (from !== "proposed") return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
      if (actor === "organizer") return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
      // BC-7.6: decline is participant-level; meeting stays 'proposed'.
      return { ok: true, to: "proposed" };

    case "tentative":
      if (from !== "proposed") return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
      if (actor === "organizer") return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
      return { ok: true, to: "proposed" };

    case "cancel":
      if (from !== "proposed" && from !== "confirmed")
        return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
      if (actor !== "organizer") return { ok: false, reason: "MEETING_NOT_ORGANIZER" };
      return { ok: true, to: "cancelled" };

    case "reschedule":
      if (from !== "proposed" && from !== "confirmed")
        return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
      return { ok: true, to: "proposed" };

    case "complete":
      if (from !== "confirmed") return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
      return { ok: true, to: "completed" };

    case "mark_no_show":
      if (from !== "confirmed") return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
      return { ok: true, to: "no_show" };

    default:
      return { ok: false, reason: "MEETING_INVALID_TRANSITION" };
  }
}

/**
 * Version guard: acceptance / reschedule must target the active version.
 * Returns false when the seen version does not match the meeting's active one.
 */
export function isFreshVersion(activeVersion: number | null, seenVersion: number): boolean {
  return activeVersion !== null && activeVersion === seenVersion;
}

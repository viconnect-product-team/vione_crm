// BC-4.1C — Stable meeting error code → i18n key mapping.
// Raw SQL / RLS / RPC text never reaches the UI; consumers map the typed
// BusinessMeetingError.code (or an error whose message contains a known code)
// to a translation key under connect.meetings.errors.*.

import { isMeetingErrorCode, type MeetingErrorCode } from "./errors";

const KEY: Record<MeetingErrorCode, string> = {
  MEETING_AUTH_REQUIRED: "connect.meetings.errors.authRequired",
  MEETING_ACCOUNT_INACTIVE: "connect.meetings.errors.accountInactive",
  MEETING_ACCOUNT_SUSPENDED: "connect.meetings.errors.accountSuspended",
  MEETING_TARGET_NOT_FOUND: "connect.meetings.errors.targetNotFound",
  MEETING_TARGET_UNAVAILABLE: "connect.meetings.errors.targetUnavailable",
  MEETING_BLOCKED: "connect.meetings.errors.blocked",
  MEETING_CONNECTION_REQUIRED: "connect.meetings.errors.connectionRequired",
  MEETING_NOT_FOUND: "connect.meetings.errors.notFound",
  MEETING_NOT_PARTICIPANT: "connect.meetings.errors.notParticipant",
  MEETING_NOT_ORGANIZER: "connect.meetings.errors.notOrganizer",
  MEETING_INVALID_TRANSITION: "connect.meetings.errors.invalidTransition",
  MEETING_STALE_VERSION: "connect.meetings.errors.staleVersion",
  MEETING_TIME_INVALID: "connect.meetings.errors.timeInvalid",
  MEETING_TIME_CONFLICT: "connect.meetings.errors.timeConflict",
  MEETING_RATE_LIMITED: "connect.meetings.errors.rateLimited",
  MEETING_MUTATION_CONFLICT: "connect.meetings.errors.mutationConflict",
  MEETING_PARTICIPANT_INVALID: "connect.meetings.errors.participantInvalid",
  MEETING_PROPOSAL_NOT_FOUND: "connect.meetings.errors.proposalNotFound",
  MEETING_IMMUTABLE_FIELD: "connect.meetings.errors.unknown",
  MEETING_NOT_PROPOSABLE: "connect.meetings.errors.notProposable",
  MEETING_NOT_RESPONDABLE: "connect.meetings.errors.notRespondable",
  MEETING_ALREADY_RESPONDED: "connect.meetings.errors.alreadyResponded",
  MEETING_RESPONSE_FORBIDDEN: "connect.meetings.errors.responseForbidden",
  MEETING_CANNOT_CONFIRM: "connect.meetings.errors.cannotConfirm",
  MEETING_CANNOT_CANCEL: "connect.meetings.errors.cannotCancel",
  MEETING_PARTICIPANT_SET_LOCKED: "connect.meetings.errors.participantSetLocked",
  MEETING_UNKNOWN: "connect.meetings.errors.unknown",
};

/** Resolve a stable i18n key for any error, never leaking raw text. */
export function meetingErrorTKey(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  if (isMeetingErrorCode(raw)) return KEY[raw];
  for (const code of Object.keys(KEY) as MeetingErrorCode[]) {
    if (raw.includes(code)) return KEY[code];
  }
  return KEY.MEETING_UNKNOWN;
}

/** Errors that should trigger a detail/list refetch (state moved on server). */
export function isReconcileError(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  return (
    raw.includes("MEETING_STALE_VERSION") ||
    raw.includes("MEETING_INVALID_TRANSITION") ||
    raw.includes("MEETING_MUTATION_CONFLICT")
  );
}

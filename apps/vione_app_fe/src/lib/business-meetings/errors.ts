// BC-4.1A — Stable Business Meetings domain errors.
// Raw PostgreSQL / RLS / trigger / constraint text must never reach clients.

export const MEETING_ERROR_CODES = [
  "MEETING_AUTH_REQUIRED",
  "MEETING_ACCOUNT_INACTIVE",
  "MEETING_ACCOUNT_SUSPENDED",
  "MEETING_TARGET_NOT_FOUND",
  "MEETING_TARGET_UNAVAILABLE",
  "MEETING_BLOCKED",
  "MEETING_CONNECTION_REQUIRED",
  "MEETING_NOT_FOUND",
  "MEETING_NOT_PARTICIPANT",
  "MEETING_NOT_ORGANIZER",
  "MEETING_INVALID_TRANSITION",
  "MEETING_STALE_VERSION",
  "MEETING_TIME_INVALID",
  "MEETING_TIME_CONFLICT",
  "MEETING_RATE_LIMITED",
  "MEETING_MUTATION_CONFLICT",
  "MEETING_PARTICIPANT_INVALID",
  "MEETING_PROPOSAL_NOT_FOUND",
  "MEETING_IMMUTABLE_FIELD",
  // BC-7.6 — request-lifecycle domain errors.
  "MEETING_NOT_PROPOSABLE",
  "MEETING_NOT_RESPONDABLE",
  "MEETING_ALREADY_RESPONDED",
  "MEETING_RESPONSE_FORBIDDEN",
  "MEETING_CANNOT_CONFIRM",
  "MEETING_CANNOT_CANCEL",
  "MEETING_PARTICIPANT_SET_LOCKED",
  "MEETING_UNKNOWN",
] as const;

export type MeetingErrorCode = (typeof MEETING_ERROR_CODES)[number];

export class BusinessMeetingError extends Error {
  readonly code: MeetingErrorCode;
  constructor(code: MeetingErrorCode, message?: string) {
    super(message ?? code);
    this.name = "BusinessMeetingError";
    this.code = code;
  }
}

const KNOWN = new Set<string>(MEETING_ERROR_CODES);

/**
 * Translate a raw DB/RLS error into a stable domain error. Any error whose
 * message contains one of the known MEETING_* codes surfaces as that code;
 * everything else collapses to MEETING_UNKNOWN so raw SQL never leaks.
 */
export function toBusinessMeetingError(err: unknown): BusinessMeetingError {
  if (err instanceof BusinessMeetingError) return err;
  const raw = err instanceof Error ? err.message : String(err ?? "");
  for (const code of MEETING_ERROR_CODES) {
    if (raw.includes(code)) return new BusinessMeetingError(code);
  }
  if (/duplicate key|unique_violation|business_meeting_proposals_meeting_id_version/i.test(raw)) {
    return new BusinessMeetingError("MEETING_MUTATION_CONFLICT");
  }
  if (/row-level security|permission denied/i.test(raw)) {
    return new BusinessMeetingError("MEETING_NOT_PARTICIPANT");
  }
  return new BusinessMeetingError("MEETING_UNKNOWN");
}

export function isMeetingErrorCode(value: string): value is MeetingErrorCode {
  return KNOWN.has(value);
}

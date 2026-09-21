// BC-7.7 — Frozen calendar error contract (i18n keys, not user strings).
export const CALENDAR_ERROR_CODES = [
  "CALENDAR_ACCOUNT_NOT_FOUND",
  "CALENDAR_ACCOUNT_NOT_CONNECTED",
  "CALENDAR_ACCOUNT_REVOKED",
  "CALENDAR_PROVIDER_UNAVAILABLE",
  "CALENDAR_AVAILABILITY_UNAVAILABLE",
  "CALENDAR_INVALID_TIMEZONE",
  "CALENDAR_INVALID_DATE_RANGE",
  "CALENDAR_INVALID_DURATION",
  "CALENDAR_TOO_MANY_PARTICIPANTS",
  "CALENDAR_UNAUTHENTICATED",
  "CALENDAR_VERSION_CONFLICT",
  "CALENDAR_SYNC_FORBIDDEN",
  "MEETING_NOT_FOUND",
  "MEETING_TIME_PROPOSAL_NOT_FOUND",
  "MEETING_TIME_PROPOSAL_FORBIDDEN",
  "MEETING_TIME_PROPOSAL_INVALID",
  "MEETING_TIME_PROPOSAL_LOCKED",
  "MEETING_TIME_PROPOSAL_NOT_SELECTABLE",
  "CALENDAR_SYNC_FAILED",
  "CALENDAR_INTERNAL_ERROR",
] as const;

export type CalendarErrorCode = (typeof CALENDAR_ERROR_CODES)[number];

export class CalendarError extends Error {
  readonly code: CalendarErrorCode;
  constructor(code: CalendarErrorCode, message?: string) {
    super(message ?? code);
    this.name = "CalendarError";
    this.code = code;
  }
}

export function toCalendarError(err: unknown): CalendarError {
  if (err instanceof CalendarError) return err;
  return new CalendarError(
    "CALENDAR_INTERNAL_ERROR",
    err instanceof Error ? err.message : "unknown",
  );
}

// BC-7.7 Turn C — Calendar error → i18n key mapper. UI never renders raw
// server messages; every code has a stable localized string.

import type { CalendarErrorCode } from "./errors";
import { CalendarError } from "./errors";

const KEY_BY_CODE: Record<CalendarErrorCode, string> = {
  CALENDAR_ACCOUNT_NOT_FOUND: "calendar.err.accountNotFound",
  CALENDAR_ACCOUNT_NOT_CONNECTED: "calendar.err.accountNotConnected",
  CALENDAR_ACCOUNT_REVOKED: "calendar.err.accountRevoked",
  CALENDAR_PROVIDER_UNAVAILABLE: "calendar.err.providerUnavailable",
  CALENDAR_AVAILABILITY_UNAVAILABLE: "calendar.err.availabilityUnavailable",
  CALENDAR_INVALID_TIMEZONE: "calendar.err.invalidTimezone",
  CALENDAR_INVALID_DATE_RANGE: "calendar.err.invalidDateRange",
  CALENDAR_INVALID_DURATION: "calendar.err.invalidDuration",
  CALENDAR_TOO_MANY_PARTICIPANTS: "calendar.err.tooManyParticipants",
  CALENDAR_UNAUTHENTICATED: "calendar.err.unauthenticated",
  CALENDAR_VERSION_CONFLICT: "calendar.err.versionConflict",
  CALENDAR_SYNC_FORBIDDEN: "calendar.err.syncForbidden",
  MEETING_NOT_FOUND: "calendar.err.meetingNotFound",
  MEETING_TIME_PROPOSAL_NOT_FOUND: "calendar.err.proposalNotFound",
  MEETING_TIME_PROPOSAL_FORBIDDEN: "calendar.err.proposalForbidden",
  MEETING_TIME_PROPOSAL_INVALID: "calendar.err.proposalInvalid",
  MEETING_TIME_PROPOSAL_LOCKED: "calendar.err.proposalLocked",
  MEETING_TIME_PROPOSAL_NOT_SELECTABLE: "calendar.err.proposalNotSelectable",
  CALENDAR_SYNC_FAILED: "calendar.err.syncFailed",
  CALENDAR_INTERNAL_ERROR: "calendar.err.internal",
};

export function calendarErrorTKey(err: unknown): string {
  if (err instanceof CalendarError) return KEY_BY_CODE[err.code];
  const msg = err instanceof Error ? err.message : String(err ?? "");
  for (const code of Object.keys(KEY_BY_CODE) as CalendarErrorCode[]) {
    if (msg.includes(code)) return KEY_BY_CODE[code];
  }
  return KEY_BY_CODE.CALENDAR_INTERNAL_ERROR;
}

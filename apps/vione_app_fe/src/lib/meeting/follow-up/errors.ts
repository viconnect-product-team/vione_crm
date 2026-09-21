// BC-7.9 Turn B — Stable follow-up error contract.

export const MEETING_FOLLOW_UP_ERROR_CODES = [
  "MEETING_FOLLOW_UP_NOT_FOUND",
  "MEETING_FOLLOW_UP_FORBIDDEN",
  "MEETING_FOLLOW_UP_INVALID_STATE",
  "MEETING_FOLLOW_UP_INVALID_OWNER",
  "MEETING_FOLLOW_UP_INVALID_OUTCOME",
  "MEETING_FOLLOW_UP_INVALID_PRIORITY",
  "MEETING_FOLLOW_UP_INVALID_TITLE",
  "MEETING_FOLLOW_UP_VERSION_CONFLICT",
  "MEETING_FOLLOW_UP_TERMINAL",
  "MEETING_FOLLOW_UP_INTERNAL_ERROR",
] as const;

export type MeetingFollowUpErrorCode = (typeof MEETING_FOLLOW_UP_ERROR_CODES)[number];

export class MeetingFollowUpError extends Error {
  readonly code: MeetingFollowUpErrorCode;
  constructor(code: MeetingFollowUpErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "MeetingFollowUpError";
  }
}

export function mapMeetingFollowUpError(e: unknown): MeetingFollowUpError {
  if (e instanceof MeetingFollowUpError) return e;
  const msg = e instanceof Error ? e.message : String(e ?? "");
  for (const code of MEETING_FOLLOW_UP_ERROR_CODES) {
    if (msg.includes(code)) return new MeetingFollowUpError(code);
  }
  return new MeetingFollowUpError("MEETING_FOLLOW_UP_INTERNAL_ERROR");
}

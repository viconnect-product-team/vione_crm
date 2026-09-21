// BC-7.9 Turn A — Stable outcome error contract.

export const MEETING_OUTCOME_ERROR_CODES = [
  "MEETING_OUTCOME_NOT_FOUND",
  "MEETING_OUTCOME_ALREADY_EXISTS",
  "MEETING_OUTCOME_FORBIDDEN",
  "MEETING_OUTCOME_INVALID_STATE",
  "MEETING_OUTCOME_FINALIZED",
  "MEETING_OUTCOME_VERSION_CONFLICT",
  "MEETING_OUTCOME_INVALID_TYPE",
  "MEETING_OUTCOME_INVALID_SUMMARY",
  "MEETING_OUTCOME_INTERNAL_ERROR",
] as const;

export type MeetingOutcomeErrorCode = (typeof MEETING_OUTCOME_ERROR_CODES)[number];

const CODE_SET: ReadonlySet<string> = new Set(MEETING_OUTCOME_ERROR_CODES);

export class MeetingOutcomeError extends Error {
  readonly code: MeetingOutcomeErrorCode;
  constructor(code: MeetingOutcomeErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "MeetingOutcomeError";
  }
}

/** Map any unknown/postgres error to a stable code — never leak raw SQL text. */
export function mapMeetingOutcomeError(e: unknown): MeetingOutcomeError {
  if (e instanceof MeetingOutcomeError) return e;
  const msg = e instanceof Error ? e.message : String(e ?? "");
  for (const code of MEETING_OUTCOME_ERROR_CODES) {
    if (msg.includes(code)) return new MeetingOutcomeError(code);
  }
  return new MeetingOutcomeError("MEETING_OUTCOME_INTERNAL_ERROR");
}

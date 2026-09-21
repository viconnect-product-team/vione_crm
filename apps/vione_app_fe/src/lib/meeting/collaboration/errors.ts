// BC-7.10 — Stable collaboration error contract. Shared across agenda + notes.

export const MEETING_COLLABORATION_ERROR_CODES = [
  "MEETING_COLLABORATION_NOT_FOUND",
  "MEETING_COLLABORATION_FORBIDDEN",
  "MEETING_COLLABORATION_INVALID_STATE",
  "MEETING_COLLABORATION_INVALID_TRANSITION",
  "MEETING_COLLABORATION_VERSION_CONFLICT",
  "MEETING_COLLABORATION_VALIDATION",
  "MEETING_COLLABORATION_INTERNAL_ERROR",
] as const;

export type MeetingCollaborationErrorCode = (typeof MEETING_COLLABORATION_ERROR_CODES)[number];

export class MeetingCollaborationError extends Error {
  readonly code: MeetingCollaborationErrorCode;
  constructor(code: MeetingCollaborationErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "MeetingCollaborationError";
  }
}

export function mapMeetingCollaborationError(e: unknown): MeetingCollaborationError {
  if (e instanceof MeetingCollaborationError) return e;
  const msg = e instanceof Error ? e.message : String(e ?? "");
  for (const code of MEETING_COLLABORATION_ERROR_CODES) {
    if (msg.includes(code)) return new MeetingCollaborationError(code);
  }
  return new MeetingCollaborationError("MEETING_COLLABORATION_INTERNAL_ERROR");
}

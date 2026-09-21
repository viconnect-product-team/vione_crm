// BC-7.8 Turn A — Meeting Workspace error codes.
// Frozen. Do not add codes that duplicate MeetingError or CalendarError.

export const MEETING_WORKSPACE_ERROR_CODES = [
  "MEETING_WORKSPACE_FORBIDDEN",
  "MEETING_WORKSPACE_INVALID_CURSOR",
  "MEETING_WORKSPACE_INTERNAL_ERROR",
] as const;

export type MeetingWorkspaceErrorCode = (typeof MEETING_WORKSPACE_ERROR_CODES)[number];

export class MeetingWorkspaceError extends Error {
  readonly code: MeetingWorkspaceErrorCode;
  constructor(code: MeetingWorkspaceErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "MeetingWorkspaceError";
  }
}

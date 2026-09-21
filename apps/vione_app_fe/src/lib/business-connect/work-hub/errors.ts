// BC-8.0 — Frozen Work Hub error codes.

export const WORK_HUB_ERROR_CODES = [
  "WORK_HUB_FORBIDDEN",
  "WORK_HUB_INVALID_CURSOR",
  "WORK_HUB_INVALID_FILTER",
  "WORK_HUB_INTERNAL_ERROR",
] as const;

export type WorkHubErrorCode = (typeof WORK_HUB_ERROR_CODES)[number];

export class WorkHubError extends Error {
  readonly code: WorkHubErrorCode;
  constructor(code: WorkHubErrorCode, message?: string) {
    super(message ?? code);
    this.name = "WorkHubError";
    this.code = code;
  }
}

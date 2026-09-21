// BC-8.1 §57 — Frozen error contract.

export const NOTIFICATION_ERROR_CODES = [
  "NOTIFICATION_UNAUTHENTICATED",
  "NOTIFICATION_FORBIDDEN",
  "NOTIFICATION_NOT_FOUND",
  "NOTIFICATION_INVALID_STATE",
  "NOTIFICATION_INVALID_PREFERENCE",
  "NOTIFICATION_INVALID_TIMEZONE",
  "NOTIFICATION_INVALID_QUIET_HOURS",
  "NOTIFICATION_CHANNEL_UNAVAILABLE",
  "NOTIFICATION_PROVIDER_UNAVAILABLE",
  "NOTIFICATION_DISPATCH_FAILED",
  "NOTIFICATION_INVALID_CURSOR",
  "NOTIFICATION_INTERNAL_ERROR",
] as const;

export type NotificationErrorCode = (typeof NOTIFICATION_ERROR_CODES)[number];

export class NotificationError extends Error {
  readonly code: NotificationErrorCode;
  constructor(code: NotificationErrorCode, message?: string) {
    super(message ?? code);
    this.name = "NotificationError";
    this.code = code;
  }
}

/** Normalize any unknown thrown value into a stable NotificationError. */
export function toNotificationError(err: unknown): NotificationError {
  if (err instanceof NotificationError) return err;
  return new NotificationError("NOTIFICATION_INTERNAL_ERROR");
}

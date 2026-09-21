import type { TKey } from "./i18n";

/** True when an error indicates the caller lacks check-in permission (e.g. RLS / 403). */
export function isForbiddenError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  return (
    msg.includes("403") ||
    msg.includes("forbidden") ||
    msg.includes("unauthorized") ||
    msg.includes("permission denied") ||
    msg.includes("not allowed") ||
    msg.includes("row-level security") ||
    msg.includes("row level security") ||
    msg.includes("violates row-level security policy")
  );
}

/** Maps any check-in error to a standardized i18n key (title) for the UI. */
export function checkinErrorKey(error: unknown): TKey {
  return isForbiddenError(error) ? "checkin.forbidden" : "checkin.error";
}

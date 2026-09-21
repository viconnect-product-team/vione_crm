// BC-8.1 §Y — Retry policy (bounded, deterministic).

import { NOTIFICATION_RETRY_BACKOFF_MINUTES, NOTIFICATION_MAX_ATTEMPTS } from "../policy";

/** Return the ISO next-retry time for the given attempt number (1-based). */
export function computeNextRetryAt(attemptCount: number, now: Date = new Date()): string | null {
  if (attemptCount < 1) return null;
  if (attemptCount >= NOTIFICATION_MAX_ATTEMPTS) return null;
  const minutes = NOTIFICATION_RETRY_BACKOFF_MINUTES[attemptCount - 1];
  if (minutes == null) return null;
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

export function isMaxAttemptsReached(attemptCount: number): boolean {
  return attemptCount >= NOTIFICATION_MAX_ATTEMPTS;
}

export { NOTIFICATION_MAX_ATTEMPTS };

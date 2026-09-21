// BC-7.7 Turn B2 — Retry classifier + deterministic backoff schedule.
// Pure module; no I/O. Used by CalendarSyncService and the reconciliation
// worker to decide whether a projection failure is transient, permanent,
// or (rare) unknown and when to retry next.

import type { CalendarErrorCode } from "./errors";

export type RetryDecision =
  | { kind: "retry"; nextRetryAfterAt: string; retryCount: number }
  | { kind: "permanent"; reason: string }
  | { kind: "abandon"; reason: string };

/**
 * Frozen retry policy — see docs/business-connect/calendar for
 * the operational contract. Bounded exponential backoff with jitter
 * fully driven by an injectable random seed so tests are deterministic.
 */
export const RETRY_POLICY = Object.freeze({
  MAX_ATTEMPTS: 6, // total attempts (retry_count = 0..5)
  BASE_MS: 30_000, // 30s
  MAX_DELAY_MS: 60 * 60_000, // 1 hour cap
  JITTER_RATIO: 0.2,
});

const PERMANENT_ERROR_CODES: ReadonlySet<CalendarErrorCode> = new Set([
  "CALENDAR_ACCOUNT_NOT_FOUND",
  "CALENDAR_ACCOUNT_REVOKED",
  "MEETING_TIME_PROPOSAL_NOT_FOUND",
  "MEETING_TIME_PROPOSAL_FORBIDDEN",
]);

const TRANSIENT_ERROR_CODES: ReadonlySet<CalendarErrorCode> = new Set([
  "CALENDAR_PROVIDER_UNAVAILABLE",
  "CALENDAR_AVAILABILITY_UNAVAILABLE",
  "CALENDAR_SYNC_FAILED",
  "CALENDAR_INTERNAL_ERROR",
]);

export function classifyRetry(input: {
  errorCode: CalendarErrorCode | null;
  currentRetryCount: number;
  now: Date;
  random?: () => number;
}): RetryDecision {
  const { errorCode, currentRetryCount, now } = input;
  if (errorCode == null) {
    return { kind: "abandon", reason: "no_error" };
  }
  if (PERMANENT_ERROR_CODES.has(errorCode)) {
    return { kind: "permanent", reason: errorCode };
  }
  // Unknown codes default to transient (safe: still capped by MAX_ATTEMPTS).
  if (!TRANSIENT_ERROR_CODES.has(errorCode) && errorCode !== "CALENDAR_ACCOUNT_NOT_CONNECTED") {
    // conservative: still retry but treat as transient
  }
  const nextAttempt = currentRetryCount + 1;
  if (nextAttempt >= RETRY_POLICY.MAX_ATTEMPTS) {
    return { kind: "permanent", reason: "max_attempts_exceeded" };
  }
  const rand = input.random ?? Math.random;
  const exp = Math.min(
    RETRY_POLICY.MAX_DELAY_MS,
    RETRY_POLICY.BASE_MS * Math.pow(2, currentRetryCount),
  );
  const jitter = exp * RETRY_POLICY.JITTER_RATIO * (rand() * 2 - 1);
  const delay = Math.max(1000, Math.floor(exp + jitter));
  return {
    kind: "retry",
    nextRetryAfterAt: new Date(now.getTime() + delay).toISOString(),
    retryCount: nextAttempt,
  };
}

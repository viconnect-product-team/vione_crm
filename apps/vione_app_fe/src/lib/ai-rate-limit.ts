/**
 * AI Rate Limiting — Phase 10, Step 5 (best-effort, in-memory).
 *
 * Per-user and per-association fixed-window limiter. This is intentionally
 * in-memory (per server instance) — a durable, cross-instance limiter would
 * need a backing table (see the design note below); we do NOT add schema in
 * this step. Import this only inside server handlers.
 *
 * Durable design (future): a `ai_rate_limits(user_id, association_id, window_start,
 * count)` table with an atomic upsert, or a KV/Redis counter. Until then the
 * in-memory buckets provide basic abuse protection on a single instance.
 */

export type RateRole = "member" | "moderator" | "admin" | "platform";

export type RateResult = {
  allowed: boolean;
  message?: string;
  retryAfterSec?: number;
};

type Window = { count: number; resetAt: number };

const WINDOW_MS = 60_000;

// Per-minute request caps by role, plus a per-association ceiling.
const USER_LIMITS: Record<RateRole, number> = {
  member: 15,
  moderator: 30,
  admin: 60,
  platform: 60,
};
const ASSOCIATION_LIMIT = 120;

const userBuckets = new Map<string, Window>();
const assocBuckets = new Map<string, Window>();

function hit(map: Map<string, Window>, key: string, limit: number, now: number) {
  const w = map.get(key);
  if (!w || now >= w.resetAt) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }
  if (w.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((w.resetAt - now) / 1000) };
  }
  w.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function checkAiRateLimit(opts: {
  userId: string;
  associationId: string;
  role: RateRole;
}): RateResult {
  const now = Date.now();
  const userHit = hit(userBuckets, `u:${opts.userId}`, USER_LIMITS[opts.role], now);
  if (!userHit.ok) {
    return {
      allowed: false,
      retryAfterSec: userHit.retryAfterSec,
      message: `Bạn đã gửi quá nhiều yêu cầu tới Trợ lý AI. Vui lòng thử lại sau ${userHit.retryAfterSec}s.`,
    };
  }
  const assocHit = hit(assocBuckets, `a:${opts.associationId}`, ASSOCIATION_LIMIT, now);
  if (!assocHit.ok) {
    return {
      allowed: false,
      retryAfterSec: assocHit.retryAfterSec,
      message: `Hệ thống đang xử lý nhiều yêu cầu AI của hiệp hội. Vui lòng thử lại sau ${assocHit.retryAfterSec}s.`,
    };
  }
  return { allowed: true };
}

/** Test helper — reset in-memory buckets. */
export function __resetAiRateLimit(): void {
  userBuckets.clear();
  assocBuckets.clear();
}

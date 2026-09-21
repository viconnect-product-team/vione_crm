// BC-Mobile-3A — Lightweight in-memory fixed-window rate limiter for public,
// unauthenticated endpoints (e.g. the .vcf download). Best-effort abuse
// mitigation at the edge: instances are stateless, so this limits per
// instance — documented in BC_MOBILE_3A_PUBLIC_CARD_GATE.md. Fails CLOSED
// on unresolvable client identity (the bucket key becomes a constant).

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** Extract a best-effort client identity from request headers. */
export function clientKey(request: Request): string {
  const h = request.headers;
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = h.get("x-real-ip")?.trim();
  const cf = h.get("cf-connecting-ip")?.trim();
  return cf || fwd || real || "unknown";
}

/**
 * Returns true when the request is within the limit; false when the bucket
 * is exhausted. Window + limit are per call site.
 */
export function allowPublicRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) {
    // Bound memory: drop expired buckets (and everything if still oversized).
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    if (buckets.size > MAX_BUCKETS) buckets.clear();
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

/** Test hook: reset all buckets. */
export function resetPublicRateLimits(): void {
  buckets.clear();
}

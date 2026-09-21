// BC-Mobile — recognition session lifecycle (client-side).
//
// A recognition session begins when an OCR candidate reaches human review
// (BC-Mobile-4A/4B). Scan results — the candidate and the image-derived
// draft — are intentionally short-lived: they exist only in memory and are
// never persisted, so the session is a privacy boundary as much as a UX one.
//
// Contract:
// - While the session is LIVE, every human edit is preserved untouched.
//   Returning to a backgrounded tab must never wipe in-progress review work.
// - When the session LAPSES, the review locks: saving is refused, the human
//   is notified (toast + inline alert), and the only way forward is an
//   explicit recapture. Expired scan results can never be saved.

/** How long a review session stays live after the candidate arrives. */
export const CARD_SCAN_REVIEW_SESSION_TTL_MS = 10 * 60 * 1000;

/** A session is valid only within [startedAt, startedAt + TTL). */
export function isCardScanSessionValid(startedAtMs: number | null, nowMs: number): boolean {
  if (startedAtMs == null || !Number.isFinite(startedAtMs)) return false;
  if (!Number.isFinite(nowMs)) return false;
  return nowMs - startedAtMs < CARD_SCAN_REVIEW_SESSION_TTL_MS;
}

/** Milliseconds until the session lapses (0 when already lapsed/unknown). */
export function cardScanSessionRemainingMs(startedAtMs: number | null, nowMs: number): number {
  if (!isCardScanSessionValid(startedAtMs, nowMs)) return 0;
  return Math.max(0, (startedAtMs as number) + CARD_SCAN_REVIEW_SESSION_TTL_MS - nowMs);
}

/**
 * Fast-scan mode for business cards.
 *
 * The presenter shows a QR whose payload rotates every {@link SCAN_WINDOW_MS}
 * (default 30s). Each token embeds the current time bucket, so a scanner that
 * decodes an old QR (e.g. from a screenshot) can be flagged as invalid.
 *
 * We use Supabase Realtime **broadcast** (not postgres_changes) so the loop is
 * fully client-side: no DB writes, no RLS involved. The scanner's public card
 * page emits `scan` events on `card-scan:{slug}` and the presenter listens.
 */
import { supabase } from "@/integrations/supabase/client";

/** Rotation window in ms — a token issued at time T is valid within [T, T+window]. */
export const SCAN_WINDOW_MS = 30_000;

/** Allow ±1 window of clock skew so scans right at rollover don't spuriously fail. */
const SKEW_WINDOWS = 1;

/** Compact base36 random string. */
function rand(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Current rotation bucket (integer seconds / window). */
export function currentBucket(now = Date.now()): number {
  return Math.floor(now / SCAN_WINDOW_MS);
}

/** Build a rotating scan token: `bucket.nonce`. Bucket is base36. */
export function buildScanToken(now = Date.now()): string {
  return `${currentBucket(now).toString(36)}.${rand()}`;
}

/** Parse and validate a scan token against the current time. */
export function parseScanToken(
  token: string | null | undefined,
  now = Date.now(),
): { ok: boolean; bucket: number | null; ageWindows: number } {
  if (!token || typeof token !== "string") {
    return { ok: false, bucket: null, ageWindows: Number.POSITIVE_INFINITY };
  }
  const [b] = token.split(".");
  const bucket = Number.parseInt(b ?? "", 36);
  if (!Number.isFinite(bucket)) {
    return { ok: false, bucket: null, ageWindows: Number.POSITIVE_INFINITY };
  }
  const age = currentBucket(now) - bucket;
  return { ok: age >= -SKEW_WINDOWS && age <= SKEW_WINDOWS, bucket, ageWindows: age };
}

/** Payload broadcast by scanners; consumed by presenter's fast-scan modal. */
export type ScanEvent = {
  ok: boolean;
  token: string;
  reason?: "expired" | "malformed";
  at: number;
};

/** Channel name for a given card slug. */
function channelName(slug: string): string {
  return `card-scan:${slug}`;
}

/**
 * Presenter-side: subscribe to scan events for a slug.
 * Returns an unsubscribe function.
 */
export function subscribeScanEvents(slug: string, onEvent: (e: ScanEvent) => void): () => void {
  const channel = supabase
    .channel(channelName(slug), { config: { broadcast: { self: false } } })
    .on("broadcast", { event: "scan" }, (msg) => {
      const p = (msg?.payload ?? {}) as Partial<ScanEvent>;
      if (typeof p.token === "string" && typeof p.at === "number") {
        onEvent({
          ok: !!p.ok,
          token: p.token,
          reason: p.reason,
          at: p.at,
        });
      }
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Scanner-side: send a single scan event to the presenter, then close the
 * channel. Fire-and-forget — the public page never awaits a response.
 */
export async function broadcastScanEvent(slug: string, ev: ScanEvent): Promise<void> {
  const channel = supabase.channel(channelName(slug));
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
    });
    // Safety timeout — never block UI on broadcast handshake.
    setTimeout(resolve, 800);
  });
  try {
    await channel.send({ type: "broadcast", event: "scan", payload: ev });
  } finally {
    setTimeout(() => void supabase.removeChannel(channel), 100);
  }
}

// Smart QR architecture. The QR encodes a versioned, expiry-aware payload that
// resolves to the public verify endpoint. Real cryptographic signing must happen
// server-side (private key never ships to the client) — this module defines the
// payload/versioning contract and a placeholder for the signature the backend
// attaches. No fake signature is generated on the client.

export const SMART_QR_VERSION = 1 as const;

export type SmartQrPayload = {
  v: typeof SMART_QR_VERSION;
  /** Member code. */
  c: string;
  /** Issued-at (epoch seconds). */
  iat: number;
  /** Expiry (epoch seconds) — QR becomes stale after this for scanners. */
  exp: number;
  /** Signature, attached server-side. Empty client-side (unsigned). */
  sig?: string;
};

export type SmartQrOptions = {
  /** How long the QR stays valid, in seconds (default 10 min). */
  ttlSeconds?: number;
  now?: number;
};

export function buildSmartQrPayload(memberCode: string, opts: SmartQrOptions = {}): SmartQrPayload {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const ttl = opts.ttlSeconds ?? 600;
  return { v: SMART_QR_VERSION, c: memberCode, iat: now, exp: now + ttl };
}

/**
 * Short, offline-capable QR value. Prefer the verify URL (works from any camera
 * app and stays valid offline via the cached verify screen). The signed payload
 * is appended as a query param when the backend has signed it.
 */
export function smartQrValue(origin: string, payload: SmartQrPayload): string {
  const base = `${origin}/verify?code=${encodeURIComponent(payload.c)}`;
  if (!payload.sig) return base;
  const token = btoa(JSON.stringify(payload));
  return `${base}&t=${encodeURIComponent(token)}`;
}

export function isSmartQrExpired(
  payload: SmartQrPayload,
  now = Math.floor(Date.now() / 1000),
): boolean {
  return payload.exp < now;
}

export function parseSmartQrToken(token: string): SmartQrPayload | null {
  try {
    const obj = JSON.parse(atob(token)) as SmartQrPayload;
    if (obj.v !== SMART_QR_VERSION || typeof obj.c !== "string") return null;
    return obj;
  } catch {
    return null;
  }
}

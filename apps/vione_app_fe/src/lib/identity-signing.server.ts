// Server-ONLY QR signing for digital membership passes.
//
// The signing secret lives in a server-only env var (IDENTITY_QR_SIGNING_SECRET)
// and NEVER ships to the client (it is never a public build-time var). The client only displays a
// token minted here; it never signs. Tokens are versioned, expiry-aware and
// rotation-ready (bump VERSION / swap the secret).
//
// This file is *.server.ts so the bundler keeps it out of client bundles.

import { createHmac, timingSafeEqual, randomBytes } from "crypto";

export const IDENTITY_QR_VERSION = 1 as const;

export type SignedQrPayload = {
  v: typeof IDENTITY_QR_VERSION;
  passId: string;
  associationId: string;
  memberId: string;
  serial: string;
  /** Expiry — epoch seconds. */
  exp: number;
  /** Random nonce — prevents identical tokens / replay-analysis. */
  nonce: string;
};

export type CreateSignedQrInput = {
  passId: string;
  associationId: string;
  memberId: string;
  serial: string;
  /** Token time-to-live in seconds (default 15 min). */
  ttlSeconds?: number;
};

export type VerifyResult =
  | { valid: true; payload: SignedQrPayload }
  | { valid: false; reason: "config" | "malformed" | "bad_signature" | "expired" | "version" };

function getSecret(): string {
  const s = process.env.IDENTITY_QR_SIGNING_SECRET;
  if (!s || s.length < 16) {
    throw new Error("IDENTITY_QR_SIGNING_SECRET is not configured");
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBuf(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(body: string, secret: string): string {
  return b64url(createHmac("sha256", secret).update(body).digest());
}

/** Mint a signed QR token. Throws if the secret is missing (fail-safe: no unsigned token). */
export function createSignedMemberQrPayload(input: CreateSignedQrInput): {
  token: string;
  payload: SignedQrPayload;
} {
  const secret = getSecret();
  const ttl = input.ttlSeconds ?? 900;
  const payload: SignedQrPayload = {
    v: IDENTITY_QR_VERSION,
    passId: input.passId,
    associationId: input.associationId,
    memberId: input.memberId,
    serial: input.serial,
    exp: Math.floor(Date.now() / 1000) + ttl,
    nonce: b64url(randomBytes(9)),
  };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = sign(body, secret);
  return { token: `${body}.${sig}`, payload };
}

/** Verify a signed QR token. Fails safe — any problem returns { valid:false }. */
export function verifySignedMemberQrPayload(
  token: string,
  now = Math.floor(Date.now() / 1000),
): VerifyResult {
  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return { valid: false, reason: "config" };
  }

  if (typeof token !== "string" || !token.includes(".")) {
    return { valid: false, reason: "malformed" };
  }
  const [body, sig] = token.split(".");
  if (!body || !sig) return { valid: false, reason: "malformed" };

  const expected = sign(body, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, reason: "bad_signature" };
  }

  let payload: SignedQrPayload;
  try {
    payload = JSON.parse(b64urlToBuf(body).toString("utf8")) as SignedQrPayload;
  } catch {
    return { valid: false, reason: "malformed" };
  }

  if (payload.v !== IDENTITY_QR_VERSION) return { valid: false, reason: "version" };
  if (typeof payload.exp !== "number" || payload.exp < now) {
    return { valid: false, reason: "expired" };
  }
  return { valid: true, payload };
}

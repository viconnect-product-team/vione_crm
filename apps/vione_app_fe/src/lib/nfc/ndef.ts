// BC-Mobile-5B — NDEF payload construction + share-URL validation.
//
// HARD PRIVACY RULE: the NFC tag payload contains ONLY the opaque public
// share URL. Never name, email, phone, company, ids, vCard, JSON, JWT, or
// any PII. Privacy stays server-side (toPublicIdentityCard); the tag is
// just a pointer.

import { PUBLIC_TOKEN_RE } from "@/lib/business-connect/mobile/identity.validation";
import type { NdefRecordInit } from "./types";

/**
 * Validate that a URL is safe to program onto a tag:
 * - https in production (http allowed only for localhost dev)
 * - path is exactly /c/<256-bit opaque token>
 * - no credentials, no query string, no fragment (no PII smuggling)
 * - when `expectedOrigin` is given, must match the app's own origin — this
 *   is NOT a generic NFC writer.
 */
export function isValidIdentityShareUrl(raw: string, expectedOrigin?: string): boolean {
  try {
    const url = new URL(raw);
    const isLocalDev =
      url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    if (url.protocol !== "https:" && !isLocalDev) return false;
    if (url.username || url.password) return false;
    if (url.search || url.hash) return false;
    const match = /^\/c\/([a-f0-9]{64})$/.exec(url.pathname);
    if (!match || !PUBLIC_TOKEN_RE.test(match[1])) return false;
    if (expectedOrigin !== undefined && url.origin !== expectedOrigin) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * The complete NDEF message for an identity tag: a single URI record.
 * Guaranteed free of PII by construction — input is pre-validated.
 */
export function buildIdentityNdefRecords(shareUrl: string): NdefRecordInit[] {
  if (!isValidIdentityShareUrl(shareUrl)) {
    throw new Error("invalid_identity_share_url");
  }
  return [{ recordType: "url", data: shareUrl }];
}

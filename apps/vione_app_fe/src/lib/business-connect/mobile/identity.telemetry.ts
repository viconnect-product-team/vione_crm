// BC-Mobile-5A — identity observability with a hard privacy boundary.
//
// Allowlisted metric names ONLY. Never log: display name, email, phone,
// address, bio, public share token (full or partial), user/identity ids,
// vCard content, or QR payload. For token diagnostics use only the fact
// that a resolution failed — never the token itself.

// BC-Mobile-5B — NFC events are owner-side write events ONLY. A plain
// /c/<token> visit cannot be attributed to NFC vs QR vs copied link, and
// this module never fakes that attribution (no "nfc_tap" metric).
const ALLOWED_METRICS = new Set([
  "IDENTITY_VIEWED",
  "IDENTITY_UPDATED",
  "IDENTITY_PRIVACY_UPDATED",
  "IDENTITY_CARD_PREVIEWED",
  "IDENTITY_QR_VIEWED",
  "IDENTITY_LINK_SHARED",
  "IDENTITY_LINK_ROTATED",
  "IDENTITY_PUBLIC_RESOLVED",
  "IDENTITY_PUBLIC_UNAVAILABLE",
  "NFC_MANAGEMENT_OPENED",
  "NFC_WRITE_STARTED",
  "NFC_WRITE_SUCCESS",
  "NFC_WRITE_FAILED",
  "NFC_WRITE_CANCELLED",
  "NFC_TAGS_VIEWED",
  "NFC_TAG_REGISTERED",
  "NFC_TAG_REGISTER_FAILED",
  "NFC_TAG_REVOKED",
  "NFC_TAG_RENAMED",
  // BC-Mobile-5D — recipient-side public card interactions. Transport-neutral
  // (a /c/<token> visit cannot be attributed to QR vs NFC vs link) and
  // payload-free: no name, phone, email, token, or ids ever ride along.
  "PUBLIC_CARD_SAVE_CONTACT_TAPPED",
  "PUBLIC_CARD_CALL_TAPPED",
  "PUBLIC_CARD_EMAIL_TAPPED",
  "PUBLIC_CARD_WEBSITE_TAPPED",
  "PUBLIC_CARD_SOCIAL_TAPPED",
  "PUBLIC_CARD_SHARE_CARD_TAPPED",
  "PUBLIC_CARD_SHARE_CONTACT_OPENED",
  "PUBLIC_CARD_SHARE_CONTACT_SUBMITTED",
  "PUBLIC_CARD_SHARE_CONTACT_FAILED",
  // BC-Mobile-5E — Connection Handshake. Transport- and payload-free: never
  // tokens, user/identity/connection ids, names, or pair internals.
  "PUBLIC_CARD_CONNECT_TAPPED",
  "PUBLIC_CARD_CONNECT_SENT",
  "PUBLIC_CARD_CONNECT_FAILED",
  "CONNECTION_REQUEST_ACCEPTED",
  "CONNECTION_REQUEST_DECLINED",
  "CONNECTION_REQUEST_WITHDRAWN",
  "CONNECTION_REQUESTS_VIEWED",
] as const);

export type IdentityMetric =
  | "IDENTITY_VIEWED"
  | "IDENTITY_UPDATED"
  | "IDENTITY_PRIVACY_UPDATED"
  | "IDENTITY_CARD_PREVIEWED"
  | "IDENTITY_QR_VIEWED"
  | "IDENTITY_LINK_SHARED"
  | "IDENTITY_LINK_ROTATED"
  | "IDENTITY_PUBLIC_RESOLVED"
  | "IDENTITY_PUBLIC_UNAVAILABLE"
  | "NFC_MANAGEMENT_OPENED"
  | "NFC_WRITE_STARTED"
  | "NFC_WRITE_SUCCESS"
  | "NFC_WRITE_FAILED"
  | "NFC_WRITE_CANCELLED"
  | "NFC_TAGS_VIEWED"
  | "NFC_TAG_REGISTERED"
  | "NFC_TAG_REGISTER_FAILED"
  | "NFC_TAG_REVOKED"
  | "NFC_TAG_RENAMED"
  | "PUBLIC_CARD_SAVE_CONTACT_TAPPED"
  | "PUBLIC_CARD_CALL_TAPPED"
  | "PUBLIC_CARD_EMAIL_TAPPED"
  | "PUBLIC_CARD_WEBSITE_TAPPED"
  | "PUBLIC_CARD_SOCIAL_TAPPED"
  | "PUBLIC_CARD_SHARE_CARD_TAPPED"
  | "PUBLIC_CARD_SHARE_CONTACT_OPENED"
  | "PUBLIC_CARD_SHARE_CONTACT_SUBMITTED"
  | "PUBLIC_CARD_SHARE_CONTACT_FAILED"
  | "PUBLIC_CARD_CONNECT_TAPPED"
  | "PUBLIC_CARD_CONNECT_SENT"
  | "PUBLIC_CARD_CONNECT_FAILED"
  | "CONNECTION_REQUEST_ACCEPTED"
  | "CONNECTION_REQUEST_DECLINED"
  | "CONNECTION_REQUEST_WITHDRAWN"
  | "CONNECTION_REQUESTS_VIEWED";

export function reportIdentityMetric(name: IdentityMetric, meta?: { latencyMs?: number }): void {
  if (!ALLOWED_METRICS.has(name)) return;
  try {
    const latency = meta?.latencyMs != null ? ` ${Math.max(0, Math.round(meta.latencyMs))}ms` : "";
    console.info(`[bc-identity] ${name}${latency}`);
  } catch {
    // Telemetry must never throw into the user path.
  }
}

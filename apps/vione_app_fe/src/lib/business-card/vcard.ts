// BC-Mobile-3A — Server-side vCard 3.0 generator for the Public Digital Card.
//
// The .vcf is ALWAYS built from the server-authorized public projection
// (PublicBusinessCard), never from arbitrary client-visible fields — privacy
// rules are identical between the Public Card page and the saved contact.
//
// Decisions (documented in BC_MOBILE_3A_PUBLIC_CARD_GATE.md):
// - vCard 3.0: broadest iOS/Android contact-import compatibility.
// - UTF-8 with explicit CHARSET=UTF-8 params on text fields (Vietnamese
//   diacritics survive iOS/Android import).
// - N: we do NOT assume Western first/last ordering for Vietnamese names.
//   FN carries the authoritative display name; N uses the safe fallback of
//   the full display name in the family-name slot.
// - Social/messaging channels are NOT exported via proprietary X- properties;
//   the Public Card URL (exported as URL) remains the canonical source for
//   the full channel list. Website is exported as a second labeled URL.
// - PHOTO: only as PHOTO;VALUE=URI with an absolute https avatar URL — never
//   multi-megabyte base64. The card stays functional when omitted.

import type { PublicBusinessCard } from "./public-card";

/** Escape a vCard 3.0 text value: backslash, comma, semicolon, newlines. */
export function escapeVCardValue(raw: string): string {
  return (
    raw
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r\n/g, "\\n")
      .replace(/[\r\n]/g, "\\n")
      // Strip remaining control chars (property-injection defense in depth).
      // eslint-disable-next-line no-control-regex -- intentional control-char strip (vCard property-injection defense)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
  );
}

/**
 * Fold a content line to ≤75 octets per RFC 2425 §5.8.1 (CRLF + single space
 * continuation). Folding is UTF-8 aware: a multi-byte sequence is never split
 * across a fold boundary.
 */
export function foldVCardLine(line: string, limit = 75): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= limit) return line;
  const chunks: string[] = [];
  let current = "";
  let currentBytes = 0;
  // First chunk may use `limit` octets; continuations lose 1 octet to the
  // leading space, so they are capped at limit - 1.
  let budget = limit;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (currentBytes + bytes > budget) {
      chunks.push(current);
      current = "";
      currentBytes = 0;
      budget = limit - 1;
    }
    current += char;
    currentBytes += bytes;
  }
  if (current) chunks.push(current);
  return chunks.join("\r\n ");
}

/** http(s) only — javascript:/data:/file:/credential URLs die here. */
export function safeVCardHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Phone value: strict character allowlist, international + preserved. */
export function safeVCardPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9+()\-.\s]/g, "").trim();
  return cleaned.length >= 3 ? cleaned : null;
}

/** Single-recipient email; rejects header injection shapes. */
export function safeVCardEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return /^[^\s@?,;]+@[^\s@?,;]+\.[^\s@?,;]+$/.test(trimmed) ? trimmed : null;
}

/**
 * Provenance SOURCE value (RFC 2426 §3.2.4) — tells the recipient where the
 * vCard originated WITHOUT exposing anything sensitive:
 * - scheme + host only, plus an optional ALREADY-PUBLIC path (e.g. the public
 *   digital-card slug, which is published content in its own right);
 * - query strings, fragments, credentials, internal ids (user / contact /
 *   scan-session), and free text are structurally impossible here: the origin
 *   passes the same http(s) allowlist as every other URL (credentialed and
 *   non-http origins are rejected outright) and the path is rebuilt from
 *   encodeURIComponent'd segments.
 * Returns null when no safe origin exists — provenance is omitted, never
 * invented.
 */
export function vCardSourceUrl(
  origin: string | null | undefined,
  publicSlugPath?: string | null,
): string | null {
  const base = safeVCardHttpUrl(origin);
  if (!base) return null;
  try {
    const url = new URL(base);
    url.search = "";
    url.hash = "";
    const path = (publicSlugPath ?? "").trim().replace(/^\/+|\/+$/g, "");
    url.pathname = path
      ? `/${path
          .split("/")
          .map((seg) => encodeURIComponent(seg))
          .join("/")}`
      : "/";
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Build a vCard 3.0 document from the public projection. Only public
 * permitted fields are emitted; empty fields are omitted.
 */
export function buildVCard(card: PublicBusinessCard, origin: string): string {
  const name = (card.displayName ?? card.slug).trim() || card.slug;
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//Business Connect//Digital Card//VI",
  ];
  const text = (prop: string, value: string | null | undefined) => {
    const v = value?.trim();
    if (v) lines.push(`${prop};CHARSET=UTF-8:${escapeVCardValue(v)}`);
  };

  text("FN", name);
  // Safe N fallback: full display name in the family slot — never reorders
  // Vietnamese names to fit a Western given/family split.
  lines.push(`N;CHARSET=UTF-8:${escapeVCardValue(name)};;;;`);
  text("ORG", card.companyName);
  text("TITLE", card.professionalTitle);
  text("NICKNAME", null);

  const phone = safeVCardPhone(card.workPhone);
  if (phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(phone)}`);
  const email = safeVCardEmail(card.workEmail);
  if (email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeVCardValue(email)}`);

  // Canonical Public Card URL — the source of truth for the full channel list.
  const cardUrl = `${origin.replace(/\/+$/, "")}/b/${encodeURIComponent(card.slug)}`;
  lines.push(`URL;TYPE=WORK:${escapeVCardValue(cardUrl)}`);
  const website = safeVCardHttpUrl(card.website);
  if (website) lines.push(`URL;TYPE=HOME:${escapeVCardValue(website)}`);

  // Photo by reference only (https), never base64 blobs.
  const photo = safeVCardHttpUrl(card.avatarUrl);
  if (photo && photo.startsWith("https://"))
    lines.push(`PHOTO;VALUE=URI:${escapeVCardValue(photo)}`);

  // Provenance: SOURCE names the canonical public card URL — the recipient can
  // always fetch the freshest version there. Origin + public slug only; the
  // helper makes query/fragment/credential/internal-id leakage impossible.
  const source = vCardSourceUrl(origin, `/b/${card.slug}`);
  if (source) lines.push(`SOURCE:${escapeVCardValue(source)}`);

  lines.push("END:VCARD");
  return lines.map((l: any) => foldVCardLine(l)).join("\r\n") + "\r\n";
}

/**
 * Download filename derived from the routing-safe slug. Slugs are validated
 * against /^[a-z0-9][a-z0-9-]{0,59}$/ upstream, so the result can never
 * contain header-breaking characters — defense in depth: re-validate here.
 */
export function vcfFilenameForSlug(slug: string): string {
  const safe = /^[a-z0-9][a-z0-9-]{0,59}$/.test(slug) ? slug : "danh-thiep";
  return `${safe}.vcf`;
}

export const VCF_CONTENT_TYPE = "text/vcard; charset=utf-8";

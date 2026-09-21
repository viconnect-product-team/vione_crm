// BC-Mobile-5A — client-side "Save Contact" vCard for the digital identity.
//
// Built EXCLUSIVELY from the already-disclosed PublicIdentityCard projection.
// The generator can only emit fields the recipient was already shown — a
// PRIVATE email/phone is null on the DTO and therefore structurally absent
// here. Save Contact never creates a Business Connect connection.

import {
  escapeVCardValue,
  foldVCardLine,
  safeVCardEmail,
  safeVCardHttpUrl,
  safeVCardPhone,
} from "@/lib/business-card/vcard";
import type { PublicIdentityCard } from "./identity.types";

/**
 * Build a vCard 3.0 document from the public identity projection.
 * Returns null when there is no display name to anchor the contact.
 */
export function buildIdentityVCard(
  card: PublicIdentityCard,
  publicCardUrl: string | null,
): string | null {
  const name = card.displayName?.trim();
  if (!name) return null;

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//Business Connect//Digital Identity//VI",
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
  text("TITLE", card.jobTitle);
  text("NOTE", card.headline);

  const phone = safeVCardPhone(card.primaryPhone);
  if (phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(phone)}`);
  const email = safeVCardEmail(card.primaryEmail);
  if (email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeVCardValue(email)}`);

  // Canonical public card URL — source of truth for the freshest version.
  const cardUrl = safeVCardHttpUrl(publicCardUrl);
  if (cardUrl) lines.push(`URL;TYPE=WORK:${escapeVCardValue(cardUrl)}`);
  const website = safeVCardHttpUrl(card.website);
  if (website) lines.push(`URL;TYPE=HOME:${escapeVCardValue(website)}`);

  // Photo by reference only (https), never base64 blobs.
  const photo = safeVCardHttpUrl(card.avatarUrl);
  if (photo && photo.startsWith("https://")) {
    lines.push(`PHOTO;VALUE=URI:${escapeVCardValue(photo)}`);
  }

  lines.push("END:VCARD");
  return lines.map((l: any) => foldVCardLine(l)).join("\r\n") + "\r\n";
}

/** Download filename: safe ASCII base, never user-controlled path chars. */
export function identityVcfFilename(displayName: string | null): string {
  const base = (displayName ?? "danh-thiep")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "danh-thiep"}.vcf`;
}

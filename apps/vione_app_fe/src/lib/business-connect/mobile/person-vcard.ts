// Person → vCard 3.0 export (client-only).
//
// Builds a .vcf from the ALREADY-LOADED, visibility-cleared Person Detail DTO
// (`BcMobilePersonDetail`). No new network calls, no new server surface: the
// export can only contain what the viewer is already authorized to see on
// screen. Guest contacts export exactly the phone/email the guest shared;
// connection/saved-card persons export only channels that survived the
// card's public + visibility gates.
//
// Sanitizers are reused from the server-side vCard generator
// (src/lib/business-card/vcard.ts) — same escaping, folding, and URL/phone/
// email allowlists, so the output contract is identical to /api/public/card.

import {
  escapeVCardValue,
  foldVCardLine,
  safeVCardEmail,
  safeVCardHttpUrl,
  safeVCardPhone,
  vCardSourceUrl,
} from "@/lib/business-card/vcard";
import type { BcMobilePersonDetail } from "@/hooks/use-business-connect-person";

/** Download filename: ASCII-slugified display name, never header-breaking. */
export function personVcfFilename(displayName: string | null): string {
  const base = (displayName ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "lien-he"}.vcf`;
}

/**
 * Build a vCard 3.0 document from the person DTO. Only fields the viewer can
 * already see are emitted; empty fields are omitted. Returns null when there
 * is no name to anchor the card.
 */
export function buildPersonVCard(person: BcMobilePersonDetail, origin?: string): string | null {
  const name = person.displayName?.trim();
  if (!name) return null;

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//Business Connect//Person Detail//VI",
  ];
  const text = (prop: string, value: string | null | undefined) => {
    const v = value?.trim();
    if (v) lines.push(`${prop};CHARSET=UTF-8:${escapeVCardValue(v)}`);
  };

  text("FN", name);
  // Same safe N fallback as the public-card .vcf: full name in the family
  // slot — never reorders Vietnamese names to a Western given/family split.
  lines.push(`N;CHARSET=UTF-8:${escapeVCardValue(name)};;;;`);
  text("ORG", person.companyName);
  text("TITLE", person.headline);

  const contact = person.contact;
  const phone = safeVCardPhone(contact?.phone);
  if (phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(phone)}`);
  const email = safeVCardEmail(contact?.email);
  if (email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeVCardValue(email)}`);

  // The person's public digital card (when present) is the canonical source
  // for their full channel list; website is a second labeled URL.
  if (origin && person.primaryCardSlug) {
    const cardUrl = `${origin.replace(/\/+$/, "")}/b/${encodeURIComponent(person.primaryCardSlug)}`;
    lines.push(`URL;TYPE=WORK:${escapeVCardValue(cardUrl)}`);
  }
  const website = safeVCardHttpUrl(contact?.websiteHref);
  if (website) lines.push(`URL;TYPE=HOME:${escapeVCardValue(website)}`);

  const photo = safeVCardHttpUrl(person.avatarUrl);
  if (photo && photo.startsWith("https://")) {
    lines.push(`PHOTO;VALUE=URI:${escapeVCardValue(photo)}`);
  }

  // Provenance: the person's canonical public card URL when they have one,
  // otherwise the platform origin. Never internal ids — see vCardSourceUrl.
  const source = vCardSourceUrl(
    origin,
    person.primaryCardSlug ? `/b/${person.primaryCardSlug}` : null,
  );
  if (source) lines.push(`SOURCE:${escapeVCardValue(source)}`);

  lines.push("END:VCARD");
  return lines.map((l: any) => foldVCardLine(l)).join("\r\n") + "\r\n";
}

/** Shared blob → anchor download trigger. Client-only. */
export function triggerVcfDownload(vcf: string, filename: string): void {
  const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Share-first delivery for .vcf files: opens the native Share Sheet (Web
 * Share API Level 2 — iOS/Android) when the device can share files, so the
 * user can push the contact straight into Contacts/WhatsApp/Zalo/Mail. Falls
 * back to the anchor download everywhere else (desktop browsers, or when the
 * share call itself is rejected by the platform).
 *
 * Returns the delivery channel:
 * - "shared"     — the Share Sheet completed
 * - "cancelled"  — the user dismissed the sheet (intentional; no fallback)
 * - "downloaded" — anchor download fallback was used
 */
export async function shareOrDownloadVcf(
  vcf: string,
  filename: string,
): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([vcf], filename, { type: "text/vcard" });
  const nav = typeof navigator === "undefined" ? undefined : navigator;
  const canShareFiles =
    typeof nav?.share === "function" &&
    typeof nav.canShare === "function" &&
    nav.canShare({ files: [file] });
  if (canShareFiles) {
    try {
      // Files-only payload: adding text/title makes some Android targets
      // share the text instead of importing the .vcf.
      await nav.share({ files: [file] });
      return "shared";
    } catch (err) {
      // AbortError = the user dismissed the sheet — an intentional choice,
      // not a failure, so do NOT fall back to a surprise download.
      if ((err as DOMException | null)?.name === "AbortError") return "cancelled";
      // NotAllowedError / DataError / platform quirks → download fallback.
    }
  }
  triggerVcfDownload(vcf, filename);
  return "downloaded";
}

/**
 * Client-only share/download trigger: Share Sheet on mobile, download on
 * desktop. No-op on the server or when the person has no display name.
 */
export async function sharePersonVCard(
  person: BcMobilePersonDetail,
): Promise<"shared" | "downloaded" | "cancelled" | null> {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const vcf = buildPersonVCard(person, window.location.origin);
  if (!vcf) return null;
  return shareOrDownloadVcf(vcf, personVcfFilename(person.displayName));
}

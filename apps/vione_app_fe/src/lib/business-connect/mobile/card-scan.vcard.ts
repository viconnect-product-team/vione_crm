// Card-scan Review → vCard 3.0 export (client-only).
//
// Lets the user share the contact INSTANTLY from the Human Review screen —
// before (or without ever) pressing "Lưu vào mạng lưới". The export is built
// from the CURRENT DRAFT, so every keystroke of human correction is included,
// exactly the values that would be saved. No network calls: the data is a
// physical card the user already holds, sanitized with the same escaping /
// folding / allowlists as the server-side generator
// (src/lib/business-card/vcard.ts).

import {
  escapeVCardValue,
  foldVCardLine,
  safeVCardEmail,
  safeVCardHttpUrl,
  safeVCardPhone,
  vCardSourceUrl,
} from "@/lib/business-card/vcard";
import { personVcfFilename, shareOrDownloadVcf } from "@/lib/business-connect/mobile/person-vcard";
import type { ScanReviewDraft } from "@/lib/business-connect/mobile/card-scan.review";

/**
 * Build a vCard 3.0 document from the editable review draft. Mirrors the save
 * contract: the chosen PRIMARY phone/email are exported; empty fields are
 * omitted. Returns null when there is no name to anchor the card (the UI
 * disables the button in that state).
 *
 * `origin` (usually window.location.origin) adds a provenance SOURCE line so
 * the recipient knows which platform produced the file — platform root only:
 * an unsaved scan has no public URL, and the recognition session id must
 * never leave the device.
 */
export function buildScanDraftVCard(draft: ScanReviewDraft, origin?: string): string | null {
  const name = draft.displayName.trim();
  if (!name) return null;

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//Business Connect//Card Scan Review//VI",
  ];
  const text = (prop: string, value: string | null | undefined) => {
    const v = value?.trim();
    if (v) lines.push(`${prop};CHARSET=UTF-8:${escapeVCardValue(v)}`);
  };

  text("FN", name);
  // Same safe N fallback as the public-card .vcf: full name in the family
  // slot — never reorders Vietnamese names to a Western given/family split.
  lines.push(`N;CHARSET=UTF-8:${escapeVCardValue(name)};;;;`);
  text("ORG", draft.companyName);
  text("TITLE", draft.title);

  const phoneRaw = draft.primaryPhone >= 0 ? (draft.phones[draft.primaryPhone]?.value ?? "") : "";
  const phone = safeVCardPhone(phoneRaw);
  if (phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(phone)}`);

  const emailRaw = draft.primaryEmail >= 0 ? (draft.emails[draft.primaryEmail] ?? "") : "";
  const email = safeVCardEmail(emailRaw);
  if (email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeVCardValue(email)}`);

  const website = safeVCardHttpUrl(draft.website);
  if (website) lines.push(`URL;TYPE=WORK:${escapeVCardValue(website)}`);

  const address = draft.address.trim();
  if (address) {
    // Free-form single-line address lands in the street slot of ADR.
    lines.push(`ADR;TYPE=WORK;CHARSET=UTF-8:;;${escapeVCardValue(address)};;;;`);
  }

  // Provenance: platform origin root only (see the function docstring).
  const source = vCardSourceUrl(origin);
  if (source) lines.push(`SOURCE:${escapeVCardValue(source)}`);

  lines.push("END:VCARD");
  return lines.map((l: any) => foldVCardLine(l)).join("\r\n") + "\r\n";
}

/**
 * Client-only share/download trigger: native Share Sheet (iOS/Android) when
 * the device supports file sharing, anchor download otherwise. No-op on the
 * server or when the draft has no name.
 */
export async function shareScanDraftVCard(
  draft: ScanReviewDraft,
): Promise<"shared" | "downloaded" | "cancelled" | null> {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const vcf = buildScanDraftVCard(draft, window.location.origin);
  if (!vcf) return null;
  return shareOrDownloadVcf(vcf, personVcfFilename(draft.displayName));
}

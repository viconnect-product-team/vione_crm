// BC-Mobile-5D — centralized SAFE href builders for the Public Digital Card.
//
// Every recipient-facing link on /c/<token> is built HERE — never by raw
// string concatenation into an href. A field being present on the public
// projection is not enough: the value must also produce a safe, well-formed
// URL for its scheme, otherwise the action does not render at all.
//
// Blocked structurally: javascript:, data:, file:, vbscript:, protocol
// relatives, credential/userinfo abuse, malformed input.

import { safeVCardEmail, safeVCardHttpUrl, safeVCardPhone } from "@/lib/business-card/vcard";

/** tel: href — digits/+ only, needs a plausible length. */
export function safeTelHref(rawPhone: string | null | undefined): string | null {
  const phone = safeVCardPhone(rawPhone);
  if (!phone) return null;
  const compact = phone.replace(/[^0-9+]/g, "");
  const digits = compact.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 16) return null;
  const normalized = compact.startsWith("+") ? `+${digits}` : digits;
  return `tel:${normalized}`;
}

/** mailto: href — single-recipient address only, no header injection. */
export function safeMailtoHref(rawEmail: string | null | undefined): string | null {
  const email = safeVCardEmail(rawEmail);
  return email ? `mailto:${email}` : null;
}

/**
 * http(s) href — rejects every other scheme and credentialed URLs.
 * Returns the normalized absolute URL (never the raw input string).
 */
export function safeWebHref(rawUrl: string | null | undefined): string | null {
  return safeVCardHttpUrl(rawUrl);
}

/** Short human display for a safe web URL: host + path, no scheme. */
export function webDisplay(safeUrl: string): string {
  try {
    const url = new URL(safeUrl);
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.host}${path}`.slice(0, 60);
  } catch {
    return safeUrl.slice(0, 60);
  }
}

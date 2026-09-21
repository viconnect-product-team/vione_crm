// BusinessCard share primitives — pure, client-safe generation of the public
// URL, vCard, QR value, and theme resolution. No supabase, no DOM, no network.
// Consolidated from business-card-nfc.ts (vCard) + smart-qr.ts (QR) so the SDK
// and UI share one implementation. Behavior is unchanged.

import { buildSmartQrPayload, smartQrValue } from "@/lib/smart-qr";
import { CARD_THEMES, type CardTheme, type CardThemeId } from "@/lib/card-themes";
import { CARD_TEMPLATES } from "@/lib/card-templates";

export type ShareContact = {
  slug: string;
  name: string;
  title?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
};

/** Canonical public URL for a card slug. */
export function cardPublicUrl(origin: string, slug: string): string {
  return `${origin}/b/${slug}`;
}

/** RFC-style vCard text for a business card (shared by NFC + download flows). */
export function generateVCard(origin: string, c: ShareContact): string {
  const url = cardPublicUrl(origin, c.slug);
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${c.name}`,
    c.title ? `TITLE:${c.title}` : "",
    c.company ? `ORG:${c.company}` : "",
    c.phone ? `TEL;TYPE=WORK,VOICE:${c.phone}` : "",
    c.email ? `EMAIL;TYPE=WORK:${c.email}` : "",
    `URL:${url}`,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * QR value for a card. Encodes the public URL as the scannable target (works
 * from any camera app and offline). `code` is used for the versioned smart-QR
 * payload when a signed token is later attached server-side.
 */
export function generateQR(origin: string, slug: string, opts?: { code?: string }): string {
  if (opts?.code) {
    return smartQrValue(origin, buildSmartQrPayload(opts.code));
  }
  return cardPublicUrl(origin, slug);
}

/** A single shareable payload (URL + vCard + QR) for a card. */
export type CardSharePayload = {
  url: string;
  vcard: string;
  qr: string;
};

export function buildSharePayload(origin: string, c: ShareContact): CardSharePayload {
  return {
    url: cardPublicUrl(origin, c.slug),
    vcard: generateVCard(origin, c),
    qr: generateQR(origin, c.slug),
  };
}

/**
 * Theme resolution: map a stored themeId (nullable) to a concrete CardTheme,
 * falling back to the default. Data-driven — never hardcoded per card.
 */
export function resolveTheme(themeId: string | null | undefined): CardTheme {
  const id = themeId ?? "classic";
  // Check the industry template registry first (superset of legacy 7 themes).
  if (CARD_TEMPLATES[id]) return CARD_TEMPLATES[id];
  return CARD_THEMES[id as CardThemeId] ?? CARD_THEMES.classic;
}

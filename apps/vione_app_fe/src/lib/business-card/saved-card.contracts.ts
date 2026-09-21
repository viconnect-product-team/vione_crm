// BC-3.0 — Canonical Saved Business Card contracts (additive to BC-2.4).
//
// Pure types + normalizers. No supabase, no window — safe to import anywhere.
// These formalize the frozen-v1 surface (source enum, availability, normalized
// tags, error contract) on top of the existing saved_business_cards edge.

// ── Source contract ─────────────────────────────────────────────────────────
// The canonical set describes HOW a save was initiated. Legacy BC-2.4 values
// ("profile" | "url" | "import") remain valid at the storage layer for
// back-compat; new saves SHOULD use a canonical value.

export type CanonicalSavedCardSource =
  | "public_card"
  | "share_link"
  | "qr"
  | "nfc"
  | "wallet"
  | "association"
  | "business_connect"
  | "manual_url"
  | "internal"
  | "unknown";

export const CANONICAL_SAVED_CARD_SOURCES: CanonicalSavedCardSource[] = [
  "public_card",
  "share_link",
  "qr",
  "nfc",
  "wallet",
  "association",
  "business_connect",
  "manual_url",
  "internal",
  "unknown",
];

// Full set accepted by the DB CHECK constraint (canonical + legacy).
export const ACCEPTED_SAVED_CARD_SOURCES: string[] = [
  ...CANONICAL_SAVED_CARD_SOURCES,
  "profile",
  "url",
  "import",
];

/** Coerce any input into a storage-valid source token. */
export function normalizeSavedCardSource(input: unknown): string {
  const s = typeof input === "string" ? input.trim().toLowerCase() : "";
  return ACCEPTED_SAVED_CARD_SOURCES.includes(s) ? s : "unknown";
}

// ── Availability contract ────────────────────────────────────────────────────
// A saved edge always survives; the TARGET card may become unresolvable. We
// never leak private data — an unresolvable target simply reports as such.

export type SavedCardAvailability = "available" | "unavailable";

export function availabilityOf(target: { unavailable: boolean }): SavedCardAvailability {
  return target.unavailable ? "unavailable" : "available";
}

// ── Normalized tag contract ──────────────────────────────────────────────────

export type SavedCardTag = {
  id: string;
  name: string;
  normalizedName: string;
  /** Number of saved cards linked to this tag (when computed). */
  count: number;
  createdAt: string;
  updatedAt: string;
};

export function normalizeTagName(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 60);
}

// ── Error contract ───────────────────────────────────────────────────────────

export const SAVED_CARD_TAG_ERR = {
  INVALID_NAME: "SC_TAG_INVALID_NAME",
  DUPLICATE: "SC_TAG_DUPLICATE",
  NOT_FOUND: "SC_TAG_NOT_FOUND",
} as const;

// BC-Mobile-3B — Guest Contact domain (pure, framework-free).
//
// Contract: docs/business-connect/mobile/BC_MOBILE_3B_GUEST_ARCHITECTURE.md
//
// Client-safe: no server imports, no Supabase. This module owns the FROZEN
// validation/normalization rules for the anonymous share-contact pipeline;
// the share_guest_contact SQL function mirrors them 1:1 as defense in depth.
// It also owns the response contract — a success/error carries NO internal
// identifiers (no owner id, no card id, no guest uuid).

// ── Frozen constants ────────────────────────────────────────────────────────

/** Versioned consent. The RPC hard-rejects any other value. */
export const GUEST_CONSENT_VERSION = "bc-guest-exchange-v1";

export const GUEST_CONTACT_LIMITS = {
  displayName: 160,
  phone: 40,
  email: 160,
  companyName: 200,
  title: 160,
} as const;

/** A phone needs at least this many digits to be contactable. */
export const GUEST_MIN_PHONE_DIGITS = 6;

// ── API response contract (bounded, leak-free) ──────────────────────────────

export type GuestShareResultKind = "created" | "replay" | "merged";

export type GuestShareErrorCode =
  | "card_unavailable"
  | "exchange_disabled"
  | "invalid_payload"
  | "rate_limited"
  | "submission_failed";

export type GuestShareValidationDetail =
  | "consent_required"
  | "name_required"
  | "contact_method_required"
  | "invalid_phone"
  | "invalid_email"
  | "invalid_client_token"
  | "field_too_long";

export type GuestShareResponse =
  | { ok: true; result: GuestShareResultKind }
  | { ok: false; error: GuestShareErrorCode; detail?: GuestShareValidationDetail };

export function guestShareSuccess(result: GuestShareResultKind): GuestShareResponse {
  return { ok: true, result };
}

export function guestShareError(
  error: GuestShareErrorCode,
  detail?: GuestShareValidationDetail,
): GuestShareResponse {
  return detail ? { ok: false, error, detail } : { ok: false, error };
}

// ── Normalization (mirrored in share_guest_contact SQL) ─────────────────────

/** Strips control characters, collapses all whitespace runs to one space. */
export function sanitizeGuestPlainText(input: string, maxLen: number): string {
  return (
    input
      // eslint-disable-next-line no-control-regex -- intentional control-char strip (injection defense)
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLen)
  );
}

/** Digits only, single leading "+" preserved. Null when not contactable. */
export function normalizeGuestPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < GUEST_MIN_PHONE_DIGITS) return null;
  const normalized = trimmed.startsWith("+") ? `+${digits}` : digits;
  return normalized.length <= GUEST_CONTACT_LIMITS.phone ? normalized : null;
}

/** Trim + lowercase, single-recipient pattern. Null when invalid. */
export function normalizeGuestEmail(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v || v.length > GUEST_CONTACT_LIMITS.email) return null;
  return /^[^\s@?,;]+@[^\s@?,;]+\.[^\s@?,;]+$/.test(v) ? v : null;
}

const CLIENT_TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidGuestClientToken(raw: unknown): raw is string {
  return typeof raw === "string" && CLIENT_TOKEN_RE.test(raw);
}

// ── Submission validation ───────────────────────────────────────────────────

export type GuestContactSubmission = {
  displayName: string;
  phone: string | null;
  email: string | null;
  companyName: string | null;
  title: string | null;
  consentVersion: typeof GUEST_CONSENT_VERSION;
  clientToken: string;
};

const RAW_CAPS: ReadonlyArray<readonly [string, number]> = [
  ["displayName", GUEST_CONTACT_LIMITS.displayName + 64],
  ["phone", GUEST_CONTACT_LIMITS.phone + 32],
  ["email", GUEST_CONTACT_LIMITS.email + 32],
  ["companyName", GUEST_CONTACT_LIMITS.companyName + 64],
  ["title", GUEST_CONTACT_LIMITS.title + 64],
];

/**
 * Validates the raw anonymous payload. Consent is a hard gate: `consent`
 * must be explicitly true AND the version must match the frozen constant.
 * Requires displayName + at least one contact method (phone XOR email not
 * required — either suffices).
 */
export function validateGuestContactSubmission(
  raw: unknown,
): { ok: true; data: GuestContactSubmission } | { ok: false; detail: GuestShareValidationDetail } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, detail: "name_required" };
  }
  const body = raw as Record<string, unknown>;

  if (body.consent !== true || body.consentVersion !== GUEST_CONSENT_VERSION) {
    return { ok: false, detail: "consent_required" };
  }
  if (!isValidGuestClientToken(body.clientToken)) {
    return { ok: false, detail: "invalid_client_token" };
  }
  for (const [key, cap] of RAW_CAPS) {
    const v = body[key];
    if (typeof v === "string" && v.length > cap) return { ok: false, detail: "field_too_long" };
  }

  const displayName = sanitizeGuestPlainText(
    typeof body.displayName === "string" ? body.displayName : "",
    GUEST_CONTACT_LIMITS.displayName,
  );
  if (!displayName) return { ok: false, detail: "name_required" };

  let phone: string | null = null;
  if (typeof body.phone === "string" && body.phone.trim()) {
    phone = normalizeGuestPhone(body.phone);
    if (!phone) return { ok: false, detail: "invalid_phone" };
  }
  let email: string | null = null;
  if (typeof body.email === "string" && body.email.trim()) {
    email = normalizeGuestEmail(body.email);
    if (!email) return { ok: false, detail: "invalid_email" };
  }
  if (!phone && !email) return { ok: false, detail: "contact_method_required" };

  const companyName =
    typeof body.companyName === "string"
      ? sanitizeGuestPlainText(body.companyName, GUEST_CONTACT_LIMITS.companyName) || null
      : null;
  const title =
    typeof body.title === "string"
      ? sanitizeGuestPlainText(body.title, GUEST_CONTACT_LIMITS.title) || null
      : null;

  return {
    ok: true,
    data: {
      displayName,
      phone,
      email,
      companyName,
      title,
      consentVersion: GUEST_CONSENT_VERSION,
      clientToken: body.clientToken.toLowerCase(),
    },
  };
}

// ── Dedupe decision (mirrored in SQL) ───────────────────────────────────────

export type GuestDedupeDecision =
  | { kind: "none" }
  | { kind: "merge"; targetId: string }
  | { kind: "ambiguous" };

/**
 * Email match beats phone match. When email and phone match DIFFERENT rows
 * the identity is ambiguous — we NEVER merge into either row (safe conflict
 * path: a new row is created instead).
 */
export function decideGuestDedupe(input: {
  emailMatchId: string | null;
  phoneMatchId: string | null;
}): GuestDedupeDecision {
  const { emailMatchId, phoneMatchId } = input;
  if (emailMatchId && phoneMatchId && emailMatchId !== phoneMatchId) {
    return { kind: "ambiguous" };
  }
  const targetId = emailMatchId ?? phoneMatchId;
  return targetId ? { kind: "merge", targetId } : { kind: "none" };
}

// ── Contact origin (BC-Mobile-4B provenance model) ──────────────────────────
//
// ONE Guest Contact domain, explicit origin. Digital consent exists ONLY for
// the exchange flow — a scanned paper card is relationship provenance, never
// a fabricated consent record (enforced by guest_contacts_consent_coherence).

export const GUEST_SOURCE_PUBLIC_CARD_EXCHANGE = "public_card_exchange";
export const GUEST_SOURCE_BUSINESS_CARD_SCAN = "business_card_scan";

export type GuestContactSource =
  | typeof GUEST_SOURCE_PUBLIC_CARD_EXCHANGE
  | typeof GUEST_SOURCE_BUSINESS_CARD_SCAN
  | (string & {}); // forward-compatible: future origins map to their own UX

// ── Owner-side canonical row (RLS owner-scoped reads) ───────────────────────

export type GuestContactRow = {
  id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  title: string | null;
  consent_version: string | null;
  source: string;
  website: string | null;
  address: string | null;
  first_shared_at: string;
  last_shared_at: string;
  first_captured_at: string | null;
  owner_label?: string | null;
  owner_note?: string | null;
};

export type GuestContact = {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  companyName: string | null;
  title: string | null;
  /** Null for non-exchange origins (e.g. paper-card scans carry no consent). */
  consentVersion: string | null;
  source: GuestContactSource;
  website: string | null;
  address: string | null;
  firstSharedAt: string;
  lastSharedAt: string;
  /** BC-Mobile-4B — first paper-card capture time; null for pure exchange guests. */
  firstCapturedAt: string | null;
  /** Nhãn phân loại riêng tư của chủ sở hữu (không hiển thị cho khách). */
  ownerLabel: string | null;
  /** Ghi chú riêng tư của chủ sở hữu. */
  ownerNote: string | null;
};

export function mapGuestContactRow(row: GuestContactRow): GuestContact {
  return {
    id: row.id,
    displayName: row.display_name,
    phone: row.phone,
    email: row.email,
    companyName: row.company_name,
    title: row.title,
    consentVersion: row.consent_version,
    source: row.source,
    website: row.website,
    address: row.address,
    firstSharedAt: row.first_shared_at,
    lastSharedAt: row.last_shared_at,
    firstCapturedAt: row.first_captured_at,
    ownerLabel: row.owner_label ?? null,
    ownerNote: row.owner_note ?? null,
  };
}

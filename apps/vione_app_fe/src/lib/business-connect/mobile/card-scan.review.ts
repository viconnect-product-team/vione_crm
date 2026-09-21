// BC-Mobile-4B — Human Review model + deterministic duplicate contract.
//
// Pure, framework-free, client-safe (no server imports). This module owns:
//   1. The editable Review draft derived from a 4A BusinessCardCandidate.
//   2. Client-side validation that MIRRORS the save_scanned_guest_contact RPC
//      (the server re-normalizes everything; the browser is never trusted).
//   3. The DuplicateResolution presentation DTO + a pure classifier that
//      mirrors resolve_card_scan_duplicates semantics for tests/UI.
//
// Frozen rules:
// - OCR proposes; the human confirms. Only confirmed draft values are saved.
// - Fax candidates never become the canonical guest phone (4B omission,
//   documented in BC_MOBILE_4B_SAVE_ARCHITECTURE.md §7).
// - One primary phone + one primary email persist (current Guest schema);
//   secondary values are shown but explicitly not saved.
// - Name/company similarity NEVER produces a match: exact normalized
//   email/phone only.

import {
  GUEST_CONTACT_LIMITS,
  normalizeGuestEmail,
  normalizeGuestPhone,
  sanitizeGuestPlainText,
} from "@/lib/business-card/guest-contact";
import type { BusinessCardCandidate, PhoneLabel } from "./card-scan.types";

// ── Review draft ────────────────────────────────────────────────────────────

/** Caps keep the Review compact; the Guest schema persists ONE primary of each. */
export const SCAN_REVIEW_MAX_PHONES = 3;
export const SCAN_REVIEW_MAX_EMAILS = 3;

export const SCAN_REVIEW_LIMITS = {
  website: 200,
  address: 240,
} as const;

export type ScanReviewPhone = { value: string; label?: PhoneLabel };

export type ScanReviewDraft = {
  displayName: string;
  title: string;
  companyName: string;
  phones: ScanReviewPhone[];
  /** Index into phones; -1 when no phone exists. */
  primaryPhone: number;
  emails: string[];
  /** Index into emails; -1 when no email exists. */
  primaryEmail: number;
  website: string;
  address: string;
};

/**
 * Builds the initial Review draft from a 4A candidate. Fax-labeled numbers
 * are excluded from saveable phones (they are not a personal contact
 * channel; the candidate preview still showed them as OCR evidence).
 */
export function draftFromCandidate(candidate: BusinessCardCandidate): ScanReviewDraft {
  const { fields } = candidate;
  const phones: ScanReviewPhone[] = fields.phones
    .filter((p) => p.label !== "fax")
    .slice(0, SCAN_REVIEW_MAX_PHONES)
    .map((p) => ({ value: p.value, ...(p.label ? { label: p.label } : {}) }));
  const primaryPhone =
    phones.length === 0
      ? -1
      : Math.max(
          0,
          phones.findIndex((p) => p.label === "mobile"),
        );
  const emails = fields.emails.slice(0, SCAN_REVIEW_MAX_EMAILS).map((e: any) => e.value);
  return {
    displayName: fields.displayName?.value ?? "",
    title: fields.title?.value ?? "",
    companyName: fields.companyName?.value ?? "",
    phones,
    primaryPhone,
    emails,
    primaryEmail: emails.length > 0 ? 0 : -1,
    website: fields.website?.value ?? "",
    address: fields.address?.value ?? "",
  };
}

// ── Website normalization (safe schemes only; mirrored in SQL) ──────────────

/** Trim + https default + http/https allowlist. Null when invalid. */
export function normalizeScanWebsite(raw: string): string | null {
  let v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v.length > SCAN_REVIEW_LIMITS.website + 32) return null;
  if (!/^https?:\/\//.test(v)) v = `https://${v}`;
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const out = u.toString();
    return out.length <= SCAN_REVIEW_LIMITS.website ? out : null;
  } catch {
    return null;
  }
}

// ── Validation (mirrors save_scanned_guest_contact) ─────────────────────────

export type ScanReviewErrorCode =
  | "name_required"
  | "contact_method_required"
  | "invalid_phone"
  | "invalid_email"
  | "invalid_website";

export type ScanReviewErrors = Partial<Record<ScanReviewErrorCode, true>>;

export function validateScanReviewDraft(
  draft: ScanReviewDraft,
): { ok: true } | { ok: false; errors: ScanReviewErrors } {
  const errors: ScanReviewErrors = {};

  const name = sanitizeGuestPlainText(draft.displayName, GUEST_CONTACT_LIMITS.displayName);
  if (!name) errors.name_required = true;

  const phoneRaw = draft.primaryPhone >= 0 ? (draft.phones[draft.primaryPhone]?.value ?? "") : "";
  const emailRaw = draft.primaryEmail >= 0 ? (draft.emails[draft.primaryEmail] ?? "") : "";

  let phone: string | null = null;
  if (phoneRaw.trim()) {
    phone = normalizeGuestPhone(phoneRaw);
    if (!phone) errors.invalid_phone = true;
  }
  let email: string | null = null;
  if (emailRaw.trim()) {
    email = normalizeGuestEmail(emailRaw);
    if (!email) errors.invalid_email = true;
  }
  if (!phone && !email) errors.contact_method_required = true;

  if (draft.website.trim() && !normalizeScanWebsite(draft.website)) {
    errors.invalid_website = true;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true };
}

// ── Confirmed save payload (client projection; the RPC re-normalizes) ───────

export type ScanSavePayload = {
  displayName: string;
  phone: string | null;
  email: string | null;
  companyName: string | null;
  title: string | null;
  website: string | null;
  address: string | null;
};

/** Projects a VALID draft into the save payload. Call only after validation. */
export function toScanSavePayload(draft: ScanReviewDraft): ScanSavePayload {
  const phoneRaw = draft.primaryPhone >= 0 ? (draft.phones[draft.primaryPhone]?.value ?? "") : "";
  const emailRaw = draft.primaryEmail >= 0 ? (draft.emails[draft.primaryEmail] ?? "") : "";
  return {
    displayName: sanitizeGuestPlainText(draft.displayName, GUEST_CONTACT_LIMITS.displayName),
    phone: phoneRaw.trim() ? normalizeGuestPhone(phoneRaw) : null,
    email: emailRaw.trim() ? normalizeGuestEmail(emailRaw) : null,
    companyName:
      sanitizeGuestPlainText(draft.companyName, GUEST_CONTACT_LIMITS.companyName) || null,
    title: sanitizeGuestPlainText(draft.title, GUEST_CONTACT_LIMITS.title) || null,
    website: draft.website.trim() ? normalizeScanWebsite(draft.website) : null,
    address: sanitizeGuestPlainText(draft.address, SCAN_REVIEW_LIMITS.address) || null,
  };
}

// ── Duplicate resolution DTO (mirrors resolve_card_scan_duplicates) ─────────

/** Semantic match tier. exact = normalized email/phone; strong = name +
 *  organization (or name + email domain); possible = name-only/company-only.
 *  Similarity tiers NEVER merge — they only surface candidates. */
export type ScanMatchLevel = "exact" | "strong" | "possible";

export type ScanDuplicateReason =
  | "phone"
  | "email"
  | "phone_email"
  | "name_company"
  | "name_domain"
  | "name"
  | "company";
export type ScanDuplicateKind = "guest" | "saved_card" | "connection";
export type ScanDuplicateState = "none" | "exact" | "ambiguous";

export type ScanDuplicateCandidate = {
  /** Opaque prefixed person ref: g:<uuid> | c:<uuid> | u:<uuid>. */
  personId: string;
  kind: ScanDuplicateKind;
  displayName: string | null;
  title: string | null;
  companyName: string | null;
  matchLevel: ScanMatchLevel;
  reason: ScanDuplicateReason;
};

export type ScanDuplicateResolution = {
  state: ScanDuplicateState;
  candidates: ScanDuplicateCandidate[];
};

/** Raw per-source hit used by the pure classifier (mirrors the SQL UNION).
 *  Similarity flags default to false so exact-only fixtures stay valid. */
export type ScanDuplicateHit = {
  personId: string;
  kind: ScanDuplicateKind;
  displayName: string | null;
  title: string | null;
  companyName: string | null;
  emailHit: boolean;
  phoneHit: boolean;
  nameHit?: boolean;
  companyHit?: boolean;
  domainHit?: boolean;
};

type MergedHit = Required<Pick<ScanDuplicateHit, "emailHit" | "phoneHit">> &
  Omit<ScanDuplicateHit, "emailHit" | "phoneHit"> & {
    nameHit: boolean;
    companyHit: boolean;
    domainHit: boolean;
  };

function levelOf(h: MergedHit): ScanMatchLevel {
  if (h.emailHit || h.phoneHit) return "exact";
  if (h.nameHit && (h.companyHit || h.domainHit)) return "strong";
  return "possible";
}

function reasonOf(h: MergedHit): ScanDuplicateReason {
  if (h.emailHit && h.phoneHit) return "phone_email";
  if (h.emailHit) return "email";
  if (h.phoneHit) return "phone";
  if (h.nameHit && h.companyHit) return "name_company";
  if (h.nameHit && h.domainHit) return "name_domain";
  if (h.nameHit) return "name";
  return "company";
}

const LEVEL_RANK: Record<ScanMatchLevel, number> = { exact: 0, strong: 1, possible: 2 };

/**
 * Deterministic classification (mirrors the SQL exactly): dedupe by person
 * ref, merge hit flags, derive tier + reason.
 *   0 persons → none · exactly 1 exact-tier → exact · otherwise → ambiguous.
 * Weak tiers NEVER escalate: they surface candidates, never merge them.
 */
export function classifyScanDuplicates(hits: ScanDuplicateHit[]): ScanDuplicateResolution {
  const byId = new Map<string, MergedHit>();
  for (const h of hits) {
    const prev = byId.get(h.personId);
    if (!prev) {
      byId.set(h.personId, {
        ...h,
        nameHit: h.nameHit ?? false,
        companyHit: h.companyHit ?? false,
        domainHit: h.domainHit ?? false,
      });
    } else {
      byId.set(h.personId, {
        ...prev,
        emailHit: prev.emailHit || h.emailHit,
        phoneHit: prev.phoneHit || h.phoneHit,
        nameHit: prev.nameHit || (h.nameHit ?? false),
        companyHit: prev.companyHit || (h.companyHit ?? false),
        domainHit: prev.domainHit || (h.domainHit ?? false),
      });
    }
  }
  const candidates: ScanDuplicateCandidate[] = [...byId.values()]
    .map((h) => ({
      personId: h.personId,
      kind: h.kind,
      displayName: h.displayName,
      title: h.title,
      companyName: h.companyName,
      matchLevel: levelOf(h),
      reason: reasonOf(h),
    }))
    .sort((a, b) => {
      const rank = LEVEL_RANK[a.matchLevel] - LEVEL_RANK[b.matchLevel];
      if (rank !== 0) return rank;
      const bothA = a.reason === "phone_email" ? 0 : 1;
      const bothB = b.reason === "phone_email" ? 0 : 1;
      if (bothA !== bothB) return bothA - bothB;
      return (a.displayName ?? "").localeCompare(b.displayName ?? "");
    });
  const state: ScanDuplicateState =
    candidates.length === 0
      ? "none"
      : candidates.length === 1 && candidates[0]?.matchLevel === "exact"
        ? "exact"
        : "ambiguous";
  return { state, candidates };
}

// ── Field-level resolution (existing-person update; mirrors the save RPC) ───

export type ScanFieldKey =
  | "displayName"
  | "phone"
  | "email"
  | "companyName"
  | "title"
  | "website"
  | "address";
export type ScanFieldChoice = "current" | "card";
export type ScanFieldChoices = Partial<Record<ScanFieldKey, ScanFieldChoice>>;

/** The existing person's current values (owner-scoped read; GuestContact fits). */
export type ScanFieldTarget = {
  displayName: string | null;
  phone: string | null;
  email: string | null;
  companyName: string | null;
  title: string | null;
  website: string | null;
  address: string | null;
};

export type ScanFieldResolution = {
  key: ScanFieldKey;
  /** fill = canonical empty (auto-filled, shown for transparency);
   *  conflict = both populated and different (explicit human choice). */
  status: "fill" | "conflict";
  currentValue: string;
  cardValue: string;
};

function normTextKey(v: string | null): string {
  return (v ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}
function normPhoneKey(v: string | null): string {
  return (v ?? "").replace(/\D/g, "");
}

/**
 * Compares the CONFIRMED save payload against the existing person's fields,
 * using the same normalized equality as save_scanned_guest_contact:
 *  - card has nothing              → not listed (nothing to merge)
 *  - canonical empty               → fill (auto, but surfaced)
 *  - normalized-equal              → not listed (silent keep)
 *  - otherwise                     → conflict (explicit choice required)
 */
export function computeScanFieldResolutions(
  payload: ScanSavePayload,
  target: ScanFieldTarget,
): ScanFieldResolution[] {
  const out: ScanFieldResolution[] = [];
  const push = (
    key: ScanFieldKey,
    current: string | null,
    cardValue: string | null,
    equal: boolean,
  ) => {
    if (!cardValue) return;
    if (!current || !current.trim()) {
      out.push({ key, status: "fill", currentValue: "", cardValue });
      return;
    }
    if (equal) return;
    out.push({ key, status: "conflict", currentValue: current, cardValue });
  };
  push(
    "displayName",
    target.displayName,
    payload.displayName || null,
    normTextKey(target.displayName) === normTextKey(payload.displayName || null),
  );
  push(
    "phone",
    target.phone,
    payload.phone,
    normPhoneKey(target.phone) === normPhoneKey(payload.phone),
  );
  push(
    "email",
    target.email,
    payload.email,
    normTextKey(target.email) === normTextKey(payload.email),
  );
  push(
    "companyName",
    target.companyName,
    payload.companyName,
    normTextKey(target.companyName) === normTextKey(payload.companyName),
  );
  push(
    "title",
    target.title,
    payload.title,
    normTextKey(target.title) === normTextKey(payload.title),
  );
  push(
    "website",
    target.website,
    payload.website,
    normTextKey(target.website) === normTextKey(payload.website),
  );
  push(
    "address",
    target.address,
    payload.address,
    normTextKey(target.address) === normTextKey(payload.address),
  );
  return out;
}

// ── Save RPC response contract ──────────────────────────────────────────────

export type ScanSaveResultKind = "created" | "updated" | "replay";

export type ScanSaveFailureCode =
  | "unauthorized"
  | "invalid_payload"
  | "match_conflict"
  | "not_found"
  | "rate_limited"
  | "failed";

export type ScanSaveResponse =
  | {
      ok: true;
      result: ScanSaveResultKind;
      personId: string;
      displayName: string;
      title: string | null;
      companyName: string | null;
    }
  | { ok: false; code: ScanSaveFailureCode; detail?: string };

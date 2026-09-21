// BC-Mobile-5A — the SINGLE privacy projection for the digital identity.
//
// Hard privacy invariant:
//
//   PUBLIC RESPONSE ⊆ ALLOWED SHAREABLE FIELDS ∩ OWNER-SHARED FIELDS
//
// Both the anonymous public resolver (/c/:token) and the owner's
// "Preview as recipient" call toPublicIdentityCard — there is NO second
// privacy implementation that could drift.

import type {
  BusinessIdentity,
  IdentityVisibilityState,
  PublicIdentityCard,
} from "./identity.types";

/**
 * The fixed server-side allowlist of shareable field keys. Any key outside
 * this list is rejected everywhere — a field existing in the database never
 * implies it is public, and future/internal columns can never be exposed by
 * a crafted visibility update.
 */
export const IDENTITY_FIELD_KEYS = [
  "display_name",
  "headline",
  "job_title",
  "company_name",
  "bio",
  "avatar",
  "primary_email",
  "primary_phone",
  "website",
  "linkedin_url",
  "address",
  "city",
] as const;

export type IdentityFieldKey = (typeof IDENTITY_FIELD_KEYS)[number];

const FIELD_KEY_SET: ReadonlySet<string> = new Set(IDENTITY_FIELD_KEYS);

export function isIdentityFieldKey(key: string): key is IdentityFieldKey {
  return FIELD_KEY_SET.has(key);
}

/**
 * Sensible initial defaults (user-changeable). Contact coordinates start
 * PRIVATE — disclosure is an explicit owner decision.
 */
export const DEFAULT_IDENTITY_VISIBILITY: Record<IdentityFieldKey, IdentityVisibilityState> = {
  display_name: "SHARED",
  headline: "SHARED",
  job_title: "SHARED",
  company_name: "SHARED",
  bio: "SHARED",
  avatar: "SHARED",
  primary_email: "PRIVATE",
  primary_phone: "PRIVATE",
  website: "SHARED",
  linkedin_url: "SHARED",
  address: "PRIVATE",
  city: "SHARED",
};

/**
 * Resolve the effective visibility map: stored owner settings overlaid on the
 * defaults. Unknown stored keys are dropped (defense in depth — the DB CHECK
 * and the RPC allowlist already make them unreachable).
 */
export function resolveIdentityVisibility(
  stored: Record<string, IdentityVisibilityState> | null | undefined,
): Record<IdentityFieldKey, IdentityVisibilityState> {
  const resolved = { ...DEFAULT_IDENTITY_VISIBILITY };
  for (const key of IDENTITY_FIELD_KEYS) {
    const v = stored?.[key];
    if (v === "PRIVATE" || v === "SHARED") resolved[key] = v;
  }
  return resolved;
}

function gated(
  visibility: Record<IdentityFieldKey, IdentityVisibilityState>,
  key: IdentityFieldKey,
  value: string | null,
): string | null {
  return visibility[key] === "SHARED" ? value : null;
}

/**
 * Map the canonical identity to the recipient projection. PRIVATE fields are
 * hard-nulled HERE (server-side), never hidden in React afterwards.
 */
export function toPublicIdentityCard(
  identity: BusinessIdentity,
  storedVisibility?: Record<string, IdentityVisibilityState> | null,
): PublicIdentityCard {
  const v = resolveIdentityVisibility(storedVisibility);
  return {
    displayName: gated(v, "display_name", identity.displayName),
    headline: gated(v, "headline", identity.headline),
    jobTitle: gated(v, "job_title", identity.jobTitle),
    companyName: gated(v, "company_name", identity.companyName),
    bio: gated(v, "bio", identity.bio),
    avatarUrl: gated(v, "avatar", identity.avatarUrl),
    primaryEmail: gated(v, "primary_email", identity.primaryEmail),
    primaryPhone: gated(v, "primary_phone", identity.primaryPhone),
    website: gated(v, "website", identity.website),
    linkedinUrl: gated(v, "linkedin_url", identity.linkedinUrl),
    address: gated(v, "address", identity.address),
    city: gated(v, "city", identity.city),
  };
}

/**
 * Lightweight profile completeness (informational, never gamified).
 * Privacy choices are NOT punished: keeping email/phone PRIVATE does not
 * reduce the score — a filled field counts regardless of its visibility.
 */
export function identityCompleteness(identity: BusinessIdentity): {
  percent: number;
  total: number;
  filled: number;
} {
  const checks: boolean[] = [
    !!identity.displayName?.trim(),
    !!identity.avatarUrl,
    !!identity.jobTitle?.trim(),
    !!identity.companyName?.trim(),
    !!identity.headline?.trim(),
    !!(identity.primaryEmail?.trim() || identity.primaryPhone?.trim()),
    !!(identity.website?.trim() || identity.linkedinUrl?.trim()),
    !!identity.bio?.trim(),
  ];
  const filled = checks.filter(Boolean).length;
  return {
    percent: Math.round((filled / checks.length) * 100),
    total: checks.length,
    filled,
  };
}

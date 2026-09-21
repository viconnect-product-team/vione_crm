// BC-Mobile-5A — Me / My Digital Identity domain types (client-safe).
//
// Domain boundary: a Business Identity is the authenticated user's CANONICAL
// professional identity. It is NOT a guest contact, NOT a scanned card, NOT
// a connection, and NOT the member/association business card. No silent merge
// with any of those domains ever occurs (BC-Mobile-4B separation contract).

/** Lifecycle of the canonical identity. */
export type BusinessIdentityStatus = "active" | "disabled";

/** The two visibility states supported by 5A (no audience ACLs yet). */
export type IdentityVisibilityState = "PRIVATE" | "SHARED";

/**
 * The canonical identity as the OWNER sees it (server never returns this
 * shape to anonymous callers).
 */
export type BusinessIdentity = {
  id: string;
  ownerUserId: string;
  displayName: string | null;
  headline: string | null;
  jobTitle: string | null;
  companyName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  website: string | null;
  linkedinUrl: string | null;
  address: string | null;
  city: string | null;
  countryCode: string | null;
  preferredLocale: string | null;
  status: BusinessIdentityStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * The anonymous recipient projection — the ONLY shape that crosses the wire
 * to /c/:token and to the owner's "Preview as recipient". Visibility gates
 * have ALREADY been applied (PRIVATE fields are null). Contains no ownership,
 * internal, audit, visibility, or share-link metadata.
 */
export type PublicIdentityCard = {
  displayName: string | null;
  headline: string | null;
  jobTitle: string | null;
  companyName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  website: string | null;
  linkedinUrl: string | null;
  address: string | null;
  city: string | null;
};

/** Neutral public resolver result — never leaks why a token failed. */
export type PublicIdentityResult =
  | { state: "public"; card: PublicIdentityCard }
  | { state: "unavailable" };

/** Owner-facing share link DTO (no internal ids, no identity FK). */
export type IdentityShareLinkInfo = {
  /** Opaque 64-char hex public token (already public by design). */
  token: string;
  status: "active" | "revoked";
  createdAt: string;
  rotatedAt: string | null;
  lastUsedAt: string | null;
};

/** Payload returned to the owner by the "get my identity" RPC. */
export type MyIdentityPayload = {
  identity: BusinessIdentity | null;
  /** field_key → visibility; absent keys fall back to documented defaults. */
  visibility: Record<string, IdentityVisibilityState>;
};

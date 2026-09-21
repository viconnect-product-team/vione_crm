// BC-1.0 — Platform Identity types (client-safe, no server imports).
// Frozen contract per GLOBAL_IDENTITY_CONTRACT.md. Additive only.

export type OnboardingStatus = "new" | "in_progress" | "completed";
export type AccountStatus = "active" | "suspended" | "deactivated";

/** Global Platform Profile — NO association / member / fee data. */
export type UserProfile = {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  professionalTitle: string | null;
  companyName: string | null;
  industry: string | null;
  region: string | null;
  bio: string | null;
  locale: string;
  timezone: string;
  onboardingStatus: OnboardingStatus;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
};

/** The authenticated platform user, independent of any membership. */
export type GlobalIdentityContext = {
  userId: string;
  email: string | null;
  profile: UserProfile | null;
  hasProfile: boolean;
};

/** An association the user belongs to (compatibility projection). */
export type AssociationIdentity = {
  associationId: string;
  associationName: string | null;
  role: string;
  isDefault: boolean;
  memberId: string | null;
};

/** Reserved for BC-2+. Empty at BC-1.0. */
export type CommunityIdentity = {
  communityId: string;
  communityName: string | null;
  role: string;
};

/** Full resolved identity. Never throws because a member is missing. */
export type PlatformIdentity = {
  global: GlobalIdentityContext;
  associations: AssociationIdentity[];
  communities: CommunityIdentity[];
};

export type ProfileUpdateInput = {
  displayName?: string | null;
  avatarUrl?: string | null;
  professionalTitle?: string | null;
  companyName?: string | null;
  industry?: string | null;
  region?: string | null;
  bio?: string | null;
  locale?: string;
  timezone?: string;
  onboardingStatus?: OnboardingStatus;
};

// ===========================================================================
// BC-1.2 — Identity Bridge Contracts (additive, backward-compatible).
// These types prepare later phases (BC-2 Business Card, BC-6 Community) without
// migrating any domain. No schema, RLS, or Association-helper changes.
// ===========================================================================

/**
 * The user's active association, resolved server-side from the frozen
 * membership model (current_association_id / current_member_id stay
 * authoritative). `null` when the user has no active association.
 */
export type ActiveAssociationContext = {
  userId: string;
  memberId: string;
  associationId: string;
  memberStatus?: string;
  associationRole?: string;
};

/** Platform account status result — distinct from association member status. */
export type AccountStatusResult = {
  userId: string;
  accountStatus: AccountStatus;
  isActive: boolean;
};

/** How a Business Card owner was resolved. Prepares BC-2 without migrating. */
export type BusinessCardOwnershipMode = "global_user" | "legacy_member" | "unresolved";

/** Card-owner bridge contract. Read-only; never changes ownership. */
export type BusinessCardOwnerContext = {
  cardId: string;
  ownerUserId?: string;
  memberId?: string;
  associationId?: string;
  ownershipMode: BusinessCardOwnershipMode;
};

// --- Community placeholders (reserved for BC-6; stable signatures only) ---

/** Community role — reserved for BC-6. No values fabricated at BC-1.2. */
export type CommunityRole = "owner" | "admin" | "moderator" | "member";

/** Community membership status — reserved for BC-6. */
export type CommunityMembershipStatus = "active" | "invited" | "suspended" | "left";

/**
 * Community identity context — reserved for BC-6. Never fabricated. The
 * contract is frozen now so consumers can compile against it before the
 * community schema exists.
 */
export type CommunityIdentityContext = {
  communityId: string;
  communityName: string | null;
  role: CommunityRole;
  status: CommunityMembershipStatus;
};

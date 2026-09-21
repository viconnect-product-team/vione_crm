// BC-Mobile-7A — Community Foundation contracts (client-safe, no server imports).
// Additive. Community membership is NOT a personal relationship.

/** Viewer role inside a community (canonical: memberships.role). */
export type CommunityMembershipRole = "admin" | "member";

/** "TÔI ĐANG THUỘC NHỮNG CỘNG ĐỒNG NÀO?" — one community the viewer belongs to. */
export type CommunitySummaryDTO = {
  communityId: string;
  name: string;
  logoUrl: string | null;
  bannerUrl?: string | null;
  shortDescription: string | null;
  /** Canonical active-member count; null only when the count failed (rendered quiet). */
  memberCount: number | null;
  viewerRole: CommunityMembershipRole;
  isDefault: boolean;
};

/** Minimal upcoming-event preview. Tap hands off to the existing /m/events surface. */
export type CommunityEventPreviewDTO = {
  eventId: string;
  name: string;
  /** ISO date/datetime from the canonical events row. */
  date: string;
  location: string | null;
};

/** "CỘNG ĐỒNG NÀY LÀ GÌ?" — community identity + viewer context + previews. */
export type CommunityDetailDTO = {
  community: CommunitySummaryDTO & { description: string | null };
  upcomingEvents: CommunityEventPreviewDTO[];
  /** Count of opportunities with status='open'; null when the count failed. */
  openOpportunityCount: number | null;
};

/**
 * "NHỮNG AI ĐANG Ở TRONG CỘNG ĐỒNG NÀY?" — SAFE member projection.
 * NEVER contains email, phone, address, tax_code, fee, payment_status,
 * notes, or the platform user id (see BC_MOBILE_7A_COMMUNITY_AUDIT.md §3).
 */
export type CommunityMemberSummaryDTO = {
  /** Opaque reference (members.id). Never the platform user id. */
  memberRef: string;
  displayName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  companyName: string | null;
  industryLabel: string | null;
  /** True when an owner-published public business card exists. */
  hasPublicCard: boolean;
  isSelf: boolean;
  /** Canonical role inside this community (memberships.role); default "member". */
  role: CommunityMembershipRole;
};

/** Directory role filter. "all" = no filtering. */
export type CommunityMemberRoleFilter = "all" | "admin" | "member";

export type CommunityMemberPageDTO = {
  items: CommunityMemberSummaryDTO[];
  /** Exact (directory) or union-size (search, bounded) count. */
  totalCount: number;
  nextOffset: number | null;
  /** Viewer's canonical role in this community (drives admin-only controls). */
  viewerRole: CommunityMembershipRole;
};

/** Connection CTA state machine (mapped from the frozen 5E pair state). */
export type CommunityConnectionStateDTO =
  | "none"
  | "outgoing_pending"
  | "incoming_pending"
  | "connected"
  | "self"
  | "unavailable";

/** One shared-community membership entry shown in the member profile. */
export type CommunityMemberHistoryEntryDTO = {
  communityId: string;
  communityName: string;
  /** ISO date/timestamp when the member joined, when known. */
  joinedAt: string | null;
  role: CommunityMembershipRole;
  /** True for the community currently being viewed. */
  isCurrent: boolean;
};

/** Safe member profile — card fields only when owner-published + public. */
export type CommunityMemberProfileDTO = {
  member: CommunityMemberSummaryDTO;
  headline: string | null;
  bio: string | null;
  website: string | null;
  regionLabel: string | null;
  /** Shared community name — the ONLY relationship context shown. */
  communityName: string;
  viewerRole: CommunityMembershipRole;
  connection: { state: CommunityConnectionStateDTO; connectionId: string | null };
  /** Server-decided: a connect CTA may be rendered. */
  canConnect: boolean;
  /** Whether the member is linked to a platform identity (CTA availability hint). */
  hasPlatformIdentity: boolean;
  /** Shared-community join history (current community first). */
  history: CommunityMemberHistoryEntryDTO[];
};

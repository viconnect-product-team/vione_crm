// BC-Mobile-7A — Community pure mapping/policy helpers (client-safe).
// Every whitelist boundary lives here and is unit-tested: private members
// fields can never pass through these mappers.

import type {
  CommunityConnectionStateDTO,
  CommunityMemberHistoryEntryDTO,
  CommunityMemberProfileDTO,
  CommunityMemberSummaryDTO,
  CommunityMembershipRole,
  CommunitySummaryDTO,
} from "./community.types";

export const COMMUNITY_MEMBERS_PAGE_SIZE = 25;
export const COMMUNITY_SEARCH_CANDIDATE_CAP = 500;
export const COMMUNITY_UPCOMING_EVENTS_LIMIT = 2;
export const COMMUNITY_SEARCH_MAX_LEN = 80;

/** Raw memberships row joined with its association (request-scoped RLS read). */
export type CommunityMembershipRow = {
  association_id: string;
  role: string | null;
  is_default: boolean | null;
};

export type CommunityRow = {
  id: string;
  name: string;
  logo_url: string | null;
  tagline: string | null;
  about: string | null;
};

/**
 * Privileged members row. The index signature deliberately allows extra
 * (private) columns so tests can prove they never leak through the mapper.
 */
export type CommunityMemberRow = {
  id: string;
  name: string;
  industry: string | null;
  region: string | null;
  user_id: string | null;
  [privateField: string]: unknown;
};

/** Published+public card projection (viewer RLS already enforces visibility). */
export type CommunityCardRow = {
  member_id: string;
  avatar_url: string | null;
  professional_title: string | null;
  company_name: string | null;
  headline: string | null;
  bio: string | null;
  website: string | null;
  [extra: string]: unknown;
};

export function normalizeCommunityRole(role: string | null | undefined): CommunityMembershipRole {
  return role === "admin" ? "admin" : "member";
}

export function mapCommunitySummary(
  membership: CommunityMembershipRow,
  community: CommunityRow,
  memberCount: number | null,
): CommunitySummaryDTO {
  return {
    communityId: community.id,
    name: community.name,
    logoUrl: community.logo_url ?? null,
    shortDescription: community.tagline ?? null,
    memberCount,
    viewerRole: normalizeCommunityRole(membership.role),
    isDefault: membership.is_default === true,
  };
}

/** Deterministic, calm ordering: default community first, then name (vi collation). */
export function sortCommunitySummaries(list: CommunitySummaryDTO[]): CommunitySummaryDTO[] {
  return [...list].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return a.name.localeCompare(b.name, "vi");
  });
}

/**
 * Normalize a member search query: trim, collapse whitespace, strip characters
 * that break PostgREST .or() filter strings, clamp length. Returns "" when empty.
 */
export function normalizeCommunitySearch(raw: string): string {
  return raw
    .replace(/[(),."\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, COMMUNITY_SEARCH_MAX_LEN);
}

/** WHITELIST mapper — only the fields below ever leave the server. */
export function mapCommunityMemberSummary(
  row: CommunityMemberRow,
  card: CommunityCardRow | null,
  viewerUserId: string,
  role: CommunityMembershipRole = "member",
): CommunityMemberSummaryDTO {
  return {
    memberRef: row.id,
    displayName: row.name,
    avatarUrl: card?.avatar_url ?? null,
    jobTitle: card?.professional_title ?? null,
    companyName: card?.company_name ?? null,
    industryLabel: row.industry ?? null,
    hasPublicCard: card !== null,
    isSelf: row.user_id !== null && row.user_id === viewerUserId,
    role,
  };
}

/** WHITELIST mapper for the profile surface (adds owner-published narrative fields). */
export function mapCommunityMemberProfile(input: {
  row: CommunityMemberRow;
  card: CommunityCardRow | null;
  viewerUserId: string;
  communityName: string;
  viewerRole: CommunityMembershipRole;
  memberRole?: CommunityMembershipRole;
  connectionState: CommunityConnectionStateDTO;
  connectionId: string | null;
  history?: CommunityMemberHistoryEntryDTO[];
}): CommunityMemberProfileDTO {
  const member = mapCommunityMemberSummary(
    input.row,
    input.card,
    input.viewerUserId,
    input.memberRole ?? "member",
  );
  const hasPlatformIdentity = input.row.user_id !== null;
  return {
    member,
    headline: input.card?.headline ?? null,
    bio: input.card?.bio ?? null,
    website: input.card?.website ?? null,
    regionLabel: input.row.region ?? null,
    communityName: input.communityName,
    viewerRole: input.viewerRole,
    connection: { state: input.connectionState, connectionId: input.connectionId },
    canConnect: canInitiateConnect({
      isSelf: member.isSelf,
      hasPlatformIdentity,
      state: input.connectionState,
    }),
    hasPlatformIdentity,
    history: input.history ?? [],
  };
}

/** Connect CTA policy: explicit, calm, never from list rows. */
export function canInitiateConnect(input: {
  isSelf: boolean;
  hasPlatformIdentity: boolean;
  state: CommunityConnectionStateDTO;
}): boolean {
  return !input.isSelf && input.hasPlatformIdentity && input.state === "none";
}

/** Offset pagination math (deterministic, bounded). */
export function nextCommunityOffset(
  loadedInPage: number,
  offset: number,
  totalCount: number,
): number | null {
  const next = offset + loadedInPage;
  return next < totalCount ? next : null;
}

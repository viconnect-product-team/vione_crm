// BC-Mobile-7A — Community server adapter. SERVER ONLY.
//
// Boundary (frozen in BC_MOBILE_7A_COMMUNITY_AUDIT.md):
//  - memberships / associations / member_business_cards / events / opportunities
//    are read with the REQUEST-SCOPED client (viewer RLS applies).
//  - members (admin/self RLS only) is read with the privileged admin client
//    using an explicit whitelist SELECT, and every row passes through the
//    tested whitelist mappers in community.service.ts before leaving here.
//  - members.user_id NEVER leaves this module (server-only identity linkage).
//  - Connection handoff delegates to the frozen 5E GlobalConnectionService.

import { GlobalConnectionService } from "@/lib/global-network/service";
import { pairStateToIdentityConnection } from "./identity-connect.service";
import {
  COMMUNITY_MEMBERS_PAGE_SIZE,
  COMMUNITY_SEARCH_CANDIDATE_CAP,
  COMMUNITY_UPCOMING_EVENTS_LIMIT,
  mapCommunityMemberProfile,
  mapCommunityMemberSummary,
  mapCommunitySummary,
  nextCommunityOffset,
  normalizeCommunitySearch,
  normalizeCommunityRole,
  sortCommunitySummaries,
  type CommunityCardRow,
  type CommunityMemberRow,
  type CommunityMembershipRow,
} from "./community.service";
import type {
  CommunityConnectionStateDTO,
  CommunityDetailDTO,
  CommunityEventPreviewDTO,
  CommunityMemberPageDTO,
  CommunityMemberHistoryEntryDTO,
  CommunityMemberProfileDTO,
  CommunityMemberRoleFilter,
  CommunityMembershipRole,
  CommunitySummaryDTO,
} from "./community.types";

type AnyClient = { from: (table: string) => any };

/** Whitelist SELECT — never add private columns here (audit §3). */
const MEMBER_SELECT = "id, name, industry, region, user_id, joined_at, created_at";
const CARD_SELECT =
  "member_id, avatar_url, professional_title, company_name, headline, bio, website";

async function requireCommunityMembership(
  user: AnyClient,
  viewerId: string,
  communityId: string,
): Promise<CommunityMembershipRow | null> {
  const { data, error } = await user
    .from("memberships")
    .select("association_id, role, is_default")
    .eq("user_id", viewerId)
    .eq("association_id", communityId)
    .maybeSingle();
  if (error || !data) return null;
  return data as CommunityMembershipRow;
}

async function activeMemberCount(admin: AnyClient, communityId: string): Promise<number | null> {
  const { count, error } = await admin
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("association_id", communityId)
    .eq("status", "active");
  if (error || count === null) return null;
  return count;
}

export async function listMyCommunities(
  user: AnyClient,
  viewerId: string,
): Promise<CommunitySummaryDTO[]> {
  const { data, error } = await user
    .from("memberships")
    .select("association_id, role, is_default, associations(id, name, logo_url, tagline, about)")
    .eq("user_id", viewerId);
  if (error || !data) return [];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const out: CommunitySummaryDTO[] = [];
  for (const row of data as any[]) {
    const assoc = row.associations;
    if (!assoc) continue; // RLS hid it — never fabricate
    const count = await activeMemberCount(supabaseAdmin as AnyClient, assoc.id);
    out.push(mapCommunitySummary(row, assoc, count));
  }
  return sortCommunitySummaries(out);
}

export async function getCommunityDetail(
  user: AnyClient,
  viewerId: string,
  communityId: string,
): Promise<CommunityDetailDTO | null> {
  const membership = await requireCommunityMembership(user, viewerId, communityId);
  if (!membership) return null; // neutral: no existence disclosure

  const { data: assoc, error } = await user
    .from("associations")
    .select("id, name, logo_url, tagline, about")
    .eq("id", communityId)
    .maybeSingle();
  if (error || !assoc) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const memberCount = await activeMemberCount(supabaseAdmin as AnyClient, communityId);

  // Upcoming events preview — viewer member RLS applies; failure stays quiet.
  let upcomingEvents: CommunityEventPreviewDTO[] = [];
  try {
    const { data: events } = await user
      .from("events")
      .select("id, name, date, location")
      .eq("association_id", communityId)
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .limit(COMMUNITY_UPCOMING_EVENTS_LIMIT);
    upcomingEvents = (events ?? []).map((e: any) => ({
      eventId: e.id,
      name: e.name,
      date: String(e.date),
      location: e.location ?? null,
    }));
  } catch {
    upcomingEvents = [];
  }

  // Open opportunities count — viewer member RLS; failure stays quiet.
  let openOpportunityCount: number | null = null;
  try {
    const { count } = await user
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("association_id", communityId)
      .eq("status", "open");
    openOpportunityCount = count ?? null;
  } catch {
    openOpportunityCount = null;
  }

  return {
    community: {
      ...mapCommunitySummary(membership, assoc as any, memberCount),
      description: (assoc as any).about ?? null,
    },
    upcomingEvents,
    openOpportunityCount,
  };
}

async function fetchCardsForMembers(
  user: AnyClient,
  communityId: string,
  memberIds: string[],
): Promise<Map<string, CommunityCardRow>> {
  const byMember = new Map<string, CommunityCardRow>();
  if (memberIds.length === 0) return byMember;
  // Viewer RLS keeps this to published+public cards only — enforced by policy.
  const { data } = await user
    .from("member_business_cards")
    .select(CARD_SELECT)
    .eq("association_id", communityId)
    .in("member_id", memberIds);
  for (const card of (data ?? []) as CommunityCardRow[]) {
    if (!byMember.has(card.member_id)) byMember.set(card.member_id, card);
  }
  return byMember;
}

/**
 * Canonical role map for a community: memberships.role keyed by platform user id.
 * `members` rows carry no role column — roles live ONLY on memberships (7A rule).
 */
async function fetchCommunityRoleMap(
  admin: AnyClient,
  communityId: string,
): Promise<Map<string, CommunityMembershipRole>> {
  const roles = new Map<string, CommunityMembershipRole>();
  const { data } = await admin
    .from("memberships")
    .select("user_id, role")
    .eq("association_id", communityId);
  for (const row of (data ?? []) as { user_id: string | null; role: string | null }[]) {
    if (!row.user_id) continue;
    roles.set(row.user_id, normalizeCommunityRole(row.role));
  }
  return roles;
}

export async function listCommunityMembers(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  query?: string;
  offset?: number;
  roleFilter?: CommunityMemberRoleFilter;
}): Promise<CommunityMemberPageDTO | null> {
  const { user, viewerId, communityId } = input;
  const membership = await requireCommunityMembership(user, viewerId, communityId);
  if (!membership) return null;

  const offset = Math.max(0, input.offset ?? 0);
  const q = normalizeCommunitySearch(input.query ?? "");
  const roleFilter: CommunityMemberRoleFilter = input.roleFilter ?? "all";
  const viewerRole = normalizeCommunityRole(membership.role);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;

  const roleMap = await fetchCommunityRoleMap(admin, communityId);
  const adminUserIds = [...roleMap.entries()]
    .filter(([, r]) => r === "admin")
    .map(([userId]) => userId);

  let totalCount = 0;
  let baseQuery = admin
    .from("members")
    .select(MEMBER_SELECT)
    .eq("association_id", communityId)
    .eq("status", "active")
    .order("name", { ascending: true })
    .order("id", { ascending: true });

  if (roleFilter === "admin") {
    if (adminUserIds.length === 0) return { items: [], totalCount: 0, nextOffset: null, viewerRole };
    baseQuery = baseQuery.in("user_id", adminUserIds);
  } else if (roleFilter === "member" && adminUserIds.length > 0) {
    baseQuery = baseQuery.or(
      `user_id.is.null,user_id.not.in.(${adminUserIds.join(",")})`,
    );
  }

  if (q.length > 0) {
    // Search union: member name OR published-card company/title (viewer RLS).
    const like = `%${q}%`;
    const [{ data: byName }, { data: byCard }] = await Promise.all([
      admin
        .from("members")
        .select("id")
        .eq("association_id", communityId)
        .eq("status", "active")
        .ilike("name", like)
        .limit(COMMUNITY_SEARCH_CANDIDATE_CAP),
      user
        .from("member_business_cards")
        .select("member_id")
        .eq("association_id", communityId)
        .or(`company_name.ilike.${like},professional_title.ilike.${like}`)
        .limit(COMMUNITY_SEARCH_CANDIDATE_CAP),
    ]);
    const ids = Array.from(
      new Set([
        ...((byName ?? []) as { id: string }[]).map((r: any) => r.id),
        ...((byCard ?? []) as { member_id: string }[]).map((r: any) => r.member_id),
      ]),
    );
    totalCount = ids.length;
    if (ids.length === 0) {
      return { items: [], totalCount: 0, nextOffset: null, viewerRole };
    }
    baseQuery = baseQuery.in("id", ids);
  } else {
    let countQuery = admin
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("association_id", communityId)
      .eq("status", "active");
    if (roleFilter === "admin") {
      countQuery = countQuery.in("user_id", adminUserIds);
    } else if (roleFilter === "member" && adminUserIds.length > 0) {
      countQuery = countQuery.or(`user_id.is.null,user_id.not.in.(${adminUserIds.join(",")})`);
    }
    const { count } = await countQuery;
    totalCount = count ?? 0;
  }

  const { data: rows, error } = await baseQuery.range(
    offset,
    offset + COMMUNITY_MEMBERS_PAGE_SIZE - 1,
  );
  if (error) return { items: [], totalCount, nextOffset: null, viewerRole };

  const members = (rows ?? []) as CommunityMemberRow[];
  const cards = await fetchCardsForMembers(
    user,
    communityId,
    members.map((m) => m.id),
  );
  const items = members.map((m) =>
    mapCommunityMemberSummary(
      m,
      cards.get(m.id) ?? null,
      viewerId,
      (m.user_id && roleMap.get(m.user_id)) || "member",
    ),
  );

  return {
    items,
    totalCount,
    viewerRole,
    nextOffset: nextCommunityOffset(items.length, offset, totalCount),
  };
}

/** Shared-community join history. Only communities the VIEWER also belongs to. */
async function fetchMemberCommunityHistory(input: {
  user: AnyClient;
  admin: AnyClient;
  viewerId: string;
  communityId: string;
  communityName: string;
  memberRow: CommunityMemberRow;
  memberRole: CommunityMembershipRole;
}): Promise<CommunityMemberHistoryEntryDTO[]> {
  const { user, admin, viewerId, communityId, communityName, memberRow, memberRole } = input;
  const joinedHere =
    (memberRow['joined_at'] as string | null) ?? (memberRow['created_at'] as string | null) ?? null;
  const current: CommunityMemberHistoryEntryDTO = {
    communityId,
    communityName,
    joinedAt: joinedHere,
    role: memberRole,
    isCurrent: true,
  };

  const platformUserId = memberRow.user_id;
  if (!platformUserId) return [current];

  try {
    const { data: viewerMemberships } = await user
      .from("memberships")
      .select("association_id, associations(id, name)")
      .eq("user_id", viewerId);
    const shared = new Map<string, string>();
    for (const row of (viewerMemberships ?? []) as any[]) {
      if (row.associations) shared.set(row.associations.id, row.associations.name);
    }
    shared.delete(communityId);
    if (shared.size === 0) return [current];

    const [{ data: rows }, { data: roleRows }] = await Promise.all([
      admin
        .from("members")
        .select("association_id, joined_at, created_at")
        .eq("user_id", platformUserId)
        .eq("status", "active")
        .in("association_id", [...shared.keys()]),
      admin
        .from("memberships")
        .select("association_id, role")
        .eq("user_id", platformUserId)
        .in("association_id", [...shared.keys()]),
    ]);
    const roles = new Map<string, CommunityMembershipRole>();
    for (const r of (roleRows ?? []) as any[]) {
      roles.set(r.association_id, normalizeCommunityRole(r.role));
    }

    const others: CommunityMemberHistoryEntryDTO[] = ((rows ?? []) as any[]).map((r: any) => ({
      communityId: r.association_id,
      communityName: shared.get(r.association_id) ?? "",
      joinedAt: (r.joined_at as string | null) ?? (r.created_at as string | null) ?? null,
      role: roles.get(r.association_id) ?? ("member" as CommunityMembershipRole),
      isCurrent: false,
    }));

    return [current, ...others].sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
      return (b.joinedAt ?? "").localeCompare(a.joinedAt ?? "");
    });
  } catch {
    return [current];
  }
}

export async function getCommunityMemberProfile(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  memberRef: string;
}): Promise<CommunityMemberProfileDTO | null> {
  const { user, viewerId, communityId, memberRef } = input;
  const membership = await requireCommunityMembership(user, viewerId, communityId);
  if (!membership) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;

  const [{ data: member }, { data: assoc }] = await Promise.all([
    admin
      .from("members")
      .select(MEMBER_SELECT)
      .eq("id", memberRef)
      .eq("association_id", communityId)
      .eq("status", "active")
      .maybeSingle(),
    user.from("associations").select("id, name").eq("id", communityId).maybeSingle(),
  ]);
  if (!member || !assoc) return null; // one neutral unavailable state

  const profileRoleMap = await fetchCommunityRoleMap(admin, communityId);
  const cards = await fetchCardsForMembers(user, communityId, [member.id]);
  const card = cards.get(member.id) ?? null;

  // Connection state via the frozen 5E pair contract (server-side only).
  let state: CommunityConnectionStateDTO = "unavailable";
  let connectionId: string | null = null;
  const platformUserId = (member as CommunityMemberRow).user_id;
  if (platformUserId === viewerId) {
    state = "self";
  } else if (platformUserId) {
    const pair = await GlobalConnectionService.getState(user as never, viewerId, platformUserId);
    const mapped = pairStateToIdentityConnection(pair);
    state = mapped.state;
    connectionId = mapped.connectionId;
  }

  const history = await fetchMemberCommunityHistory({
    user,
    admin,
    viewerId,
    communityId,
    communityName: (assoc as any).name,
    memberRow: member as CommunityMemberRow,
    memberRole:
      (platformUserId && profileRoleMap.get(platformUserId)) || ("member" as CommunityMembershipRole),
  });

  return mapCommunityMemberProfile({
    history,
    row: member as CommunityMemberRow,
    card,
    viewerUserId: viewerId,
    communityName: (assoc as any).name,
    viewerRole: normalizeCommunityRole(membership.role),
    memberRole:
      (platformUserId && profileRoleMap.get(platformUserId)) || ("member" as CommunityMembershipRole),
    connectionState: state,
    connectionId,
  });
}

/**
 * Member-to-identity handoff: resolves the opaque memberRef to a platform
 * user server-side, then delegates to the frozen 5E sendRequest verb.
 * One neutral error for every failure (no existence disclosure).
 */
export async function connectCommunityMember(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  memberRef: string;
  mutationKey?: string;
}): Promise<{ ok: true }> {
  const { user, viewerId, communityId, memberRef } = input;
  const membership = await requireCommunityMembership(user, viewerId, communityId);
  if (!membership) throw new Error("community_connect_unavailable");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: member } = await (supabaseAdmin as AnyClient)
    .from("members")
    .select("id, user_id")
    .eq("id", memberRef)
    .eq("association_id", communityId)
    .eq("status", "active")
    .maybeSingle();

  const targetUserId = (member as { user_id: string | null } | null)?.user_id ?? null;
  if (!targetUserId || targetUserId === viewerId) {
    throw new Error("community_connect_unavailable");
  }

  await GlobalConnectionService.sendRequest(user as never, viewerId, {
    targetUserId,
    source: { type: "association", id: communityId },
    mutationKey: input.mutationKey,
  });
  return { ok: true };
}

/**
 * Admin-only role change inside a community.
 * Actor role is re-read server-side; the last remaining admin cannot be demoted.
 * One neutral error for every failure (no existence disclosure).
 */
export async function updateCommunityMemberRole(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  memberRef: string;
  role: CommunityMembershipRole;
}): Promise<{ ok: true }> {
  const { user, viewerId, communityId, memberRef, role } = input;
  const membership = await requireCommunityMembership(user, viewerId, communityId);
  if (!membership || normalizeCommunityRole(membership.role) !== "admin") {
    throw new Error("community_role_update_unavailable");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;

  const { data: member } = await admin
    .from("members")
    .select("id, user_id")
    .eq("id", memberRef)
    .eq("association_id", communityId)
    .eq("status", "active")
    .maybeSingle();
  const targetUserId = (member as { user_id: string | null } | null)?.user_id ?? null;
  if (!targetUserId) throw new Error("community_role_update_unavailable");

  const roleMap = await fetchCommunityRoleMap(admin, communityId);
  const currentRole = roleMap.get(targetUserId) ?? "member";
  if (currentRole === role) return { ok: true };

  if (currentRole === "admin" && role === "member") {
    const adminCount = [...roleMap.values()].filter((r) => r === "admin").length;
    if (adminCount <= 1) throw new Error("community_role_last_admin");
  }

  const { data: existing } = await admin
    .from("memberships")
    .select("id")
    .eq("association_id", communityId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("memberships")
      .update({ role })
      .eq("id", (existing as { id: string }).id);
    if (error) throw new Error("community_role_update_unavailable");
  } else {
    const { error } = await admin
      .from("memberships")
      .insert({ association_id: communityId, user_id: targetUserId, role });
    if (error) throw new Error("community_role_update_unavailable");
  }

  return { ok: true };
}

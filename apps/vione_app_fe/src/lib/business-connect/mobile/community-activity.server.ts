// BC-Mobile-7B — Community activity server adapter. SERVER ONLY.
//
// Boundary (BC_MOBILE_7B_ACTIVITY_AUDIT.md):
//  - events / opportunities are read with the REQUEST-SCOPED client
//    (viewer member RLS applies — cross-community isolation).
//  - event_registrations / opportunity_interests are read + written with the
//    privileged admin client AFTER full server-side validation, because the
//    canonical RLS policies are admin-only / id-mismatched for regular
//    members (audit §1.2, §2.2). Writes land in the SAME canonical tables —
//    no parallel backend.
//  - members is read with the privileged whitelist only (id/code/name/email/
//    phone) and email/phone NEVER leave this module except inside the
//    canonical registration/interest row written by the viewer's own
//    explicit action.
//  - Zero cross-domain writes: no connections, guest contacts, graph edges,
//    journeys, moments, notifications, or AI calls.

import {
  COMMUNITY_ACTIVITY_PREVIEW_LIMIT,
  COMMUNITY_EVENTS_PAGE_SIZE,
  COMMUNITY_OPPORTUNITIES_PAGE_SIZE,
  canInitiateInterest,
  canInitiateRegistration,
  isEventListableStatus,
  isOpportunityActive,
  isRegistrationActive,
  mapCommunityEventSummary,
  mapCommunityOpportunityPreview,
  mapCommunityOpportunitySummary,
  nextActivityOffset,
  normalizeActivitySearch,
  todayIsoDate,
  type CommunityEventRow,
  type CommunityOpportunityRow,
} from "./community-activity.service";
import type {
  CommunityActivityPreviewDTO,
  CommunityEventDetailDTO,
  CommunityEventPageDTO,
  CommunityEventsTabDTO,
  CommunityInterestLevel,
  CommunityOpportunityDetailDTO,
  CommunityOpportunityFollowUpDTO,
  CommunityOpportunityFollowUpEventDTO,
  CommunityOpportunityAttachmentDTO,
  CommunityOpportunityProgressDTO,
  CommunityOpportunityPageDTO,
} from "./community-activity.types";

type AnyClient = { from: (table: string) => any };

/** Whitelist SELECTs — never add private columns here (audit §1/§2). */
const EVENT_SELECT = "id, name, date, location, type, status, capacity";
const OPP_SELECT =
  "id, title, description, type, budget_min, budget_max, region, industry, deadline, status, created_at, poster_id";
const MEMBER_CONTEXT_SELECT = "id, code, name, email, phone";
const CARD_ORG_SELECT = "member_id, company_name";

const LISTABLE_STATUSES = ["upcoming", "ongoing"] as const;

async function requireCommunityMembership(
  user: AnyClient,
  viewerId: string,
  communityId: string,
): Promise<boolean> {
  const { data, error } = await user
    .from("memberships")
    .select("association_id")
    .eq("user_id", viewerId)
    .eq("association_id", communityId)
    .maybeSingle();
  return !error && !!data;
}

type ViewerMemberContext = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
};

/** Viewer's own member record inside this community (whitelist, privileged). */
async function viewerMemberContext(
  admin: AnyClient,
  communityId: string,
  viewerId: string,
): Promise<ViewerMemberContext | null> {
  const { data } = await admin
    .from("members")
    .select(MEMBER_CONTEXT_SELECT)
    .eq("association_id", communityId)
    .eq("user_id", viewerId)
    .eq("status", "active")
    .maybeSingle();
  return (data as ViewerMemberContext | null) ?? null;
}

/** Active (non-cancelled) registration event ids for one member code. */
async function activeRegistrationIds(
  admin: AnyClient,
  communityId: string,
  memberCode: string,
  eventIds?: string[],
): Promise<Set<string>> {
  let q = admin
    .from("event_registrations")
    .select("event_id, status")
    .eq("association_id", communityId)
    .eq("member_code", memberCode);
  if (eventIds && eventIds.length > 0) q = q.in("event_id", eventIds);
  const { data } = await q;
  const out = new Set<string>();
  for (const r of (data ?? []) as { event_id: string; status: string }[]) {
    if (isRegistrationActive(r.status)) out.add(r.event_id);
  }
  return out;
}

/** Active registration counts per event (canonical rows, not the stale counter). */
async function registrationCounts(
  admin: AnyClient,
  communityId: string,
  eventIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (eventIds.length === 0) return counts;
  const { data } = await admin
    .from("event_registrations")
    .select("event_id, status")
    .eq("association_id", communityId)
    .in("event_id", eventIds);
  for (const r of (data ?? []) as { event_id: string; status: string }[]) {
    if (!isRegistrationActive(r.status)) continue;
    counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
  }
  return counts;
}

export async function listCommunityEvents(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  tab: CommunityEventsTabDTO;
  offset?: number;
}): Promise<CommunityEventPageDTO | null> {
  const { user, viewerId, communityId, tab } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) return null;

  const offset = Math.max(0, input.offset ?? 0);
  const today = todayIsoDate(Date.now());
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;
  const member = await viewerMemberContext(admin, communityId, viewerId);

  let registeredOnly: Set<string> | null = null;
  if (tab === "registered") {
    if (!member) return { items: [], totalCount: 0, nextOffset: null };
    registeredOnly = await activeRegistrationIds(admin, communityId, member.code);
    if (registeredOnly.size === 0) return { items: [], totalCount: 0, nextOffset: null };
  }

  const buildQuery = (select: string, opts?: { count?: "exact"; head?: boolean }) => {
    let q = user
      .from("events")
      .select(select, opts)
      .eq("association_id", communityId)
      .in("status", [...LISTABLE_STATUSES])
      .gte("date", today);
    if (registeredOnly) q = q.in("id", [...registeredOnly]);
    return q;
  };

  const { count } = await buildQuery("id", { count: "exact", head: true });
  const totalCount = count ?? 0;

  const { data: rows, error } = await buildQuery(EVENT_SELECT)
    .order("date", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + COMMUNITY_EVENTS_PAGE_SIZE - 1);
  if (error) return { items: [], totalCount, nextOffset: null };

  const events = ((rows ?? []) as CommunityEventRow[]).filter((e: any) =>
    isEventListableStatus(e.status),
  );
  const ids = events.map((e: any) => e.id);
  const [registered, counts] = await Promise.all([
    member
      ? activeRegistrationIds(admin, communityId, member.code, ids)
      : Promise.resolve(new Set<string>()),
    registrationCounts(admin, communityId, ids),
  ]);

  const items = events.map((e: any) =>
    mapCommunityEventSummary(e, {
      isRegistered: registered.has(e.id),
      activeRegistrations: counts.get(e.id) ?? 0,
    }),
  );

  return {
    items,
    totalCount,
    nextOffset: nextActivityOffset(items.length, offset, totalCount),
  };
}

async function fetchCommunityEvent(
  user: AnyClient,
  communityId: string,
  eventRef: string,
): Promise<CommunityEventRow | null> {
  const { data } = await user
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", eventRef)
    .eq("association_id", communityId)
    .maybeSingle();
  return (data as CommunityEventRow | null) ?? null;
}

export async function getCommunityEventDetail(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  eventRef: string;
}): Promise<CommunityEventDetailDTO | null> {
  const { user, viewerId, communityId, eventRef } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) return null;

  const [event, assoc] = await Promise.all([
    fetchCommunityEvent(user, communityId, eventRef),
    user.from("associations").select("id, name").eq("id", communityId).maybeSingle(),
  ]);
  if (!event || !assoc?.data) return null; // one neutral unavailable state

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;
  const member = await viewerMemberContext(admin, communityId, viewerId);
  const [registered, counts] = await Promise.all([
    member
      ? activeRegistrationIds(admin, communityId, member.code, [eventRef])
      : Promise.resolve(new Set<string>()),
    registrationCounts(admin, communityId, [eventRef]),
  ]);

  const summary = mapCommunityEventSummary(event, {
    isRegistered: registered.has(eventRef),
    activeRegistrations: counts.get(eventRef) ?? 0,
  });

  const canRegister = canInitiateRegistration({
    registrationState: summary.registrationState,
    hasMemberRecord: member !== null,
    dateInFutureOrToday: summary.startAt >= todayIsoDate(Date.now()),
  });

  return {
    event: summary,
    communityId,
    communityName: (assoc.data as any).name,
    canRegister,
    checkinHandoff: summary.registrationState === "registered",
  };
}

const REGISTER_ERROR = "community_event_register_unavailable";

/**
 * Canonical event registration — privileged write into the SAME
 * event_registrations table after independent server validation (audit §1.3).
 * Idempotent: an existing active registration returns ok without a duplicate.
 */
export async function registerCommunityEvent(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  eventRef: string;
}): Promise<{ ok: true }> {
  const { user, viewerId, communityId, eventRef } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) {
    throw new Error(REGISTER_ERROR);
  }
  const event = await fetchCommunityEvent(user, communityId, eventRef);
  if (!event) throw new Error(REGISTER_ERROR);
  if (event.status !== "upcoming" || String(event.date) < todayIsoDate(Date.now())) {
    throw new Error("community_event_registration_closed");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;
  const member = await viewerMemberContext(admin, communityId, viewerId);
  if (!member) throw new Error(REGISTER_ERROR);

  const [registered, counts] = await Promise.all([
    activeRegistrationIds(admin, communityId, member.code, [eventRef]),
    registrationCounts(admin, communityId, [eventRef]),
  ]);
  if (registered.has(eventRef)) return { ok: true }; // idempotent
  const capacity = typeof event.capacity === "number" ? event.capacity : 0;
  if (capacity > 0 && (counts.get(eventRef) ?? 0) >= capacity) {
    throw new Error("community_event_full");
  }

  const { error } = await admin.from("event_registrations").insert({
    id: crypto.randomUUID(),
    event_id: eventRef,
    member_code: member.code,
    member_name: member.name,
    email: member.email ?? "",
    registered_at: todayIsoDate(Date.now()),
    status: "registered",
    ticket_type: "standard",
    association_id: communityId,
  });
  if (error) throw new Error(REGISTER_ERROR);
  return { ok: true };
}

const CANCEL_ERROR = "community_event_cancel_unavailable";

/**
 * Huỷ đăng ký sự kiện — ghi có kiểm soát vào CHÍNH bảng event_registrations
 * (không có backend song song). Chủ thể luôn lấy từ phiên đăng nhập.
 * Idempotent: không còn đăng ký hoạt động vẫn trả ok.
 */
export async function cancelCommunityEventRegistration(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  eventRef: string;
}): Promise<{ ok: true }> {
  const { user, viewerId, communityId, eventRef } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) {
    throw new Error(CANCEL_ERROR);
  }
  const event = await fetchCommunityEvent(user, communityId, eventRef);
  if (!event) throw new Error(CANCEL_ERROR);
  // Chỉ được rút tham dự khi sự kiện chưa diễn ra (canonical: upcoming + ngày chưa qua).
  if (event.status !== "upcoming" || String(event.date) < todayIsoDate(Date.now())) {
    throw new Error("community_event_cancel_closed");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;
  const member = await viewerMemberContext(admin, communityId, viewerId);
  if (!member) throw new Error(CANCEL_ERROR);

  const active = await activeRegistrationIds(admin, communityId, member.code, [eventRef]);
  if (!active.has(eventRef)) return { ok: true }; // idempotent

  const { error } = await admin
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("association_id", communityId)
    .eq("event_id", eventRef)
    .eq("member_code", member.code)
    .neq("status", "cancelled");
  if (error) throw new Error(CANCEL_ERROR);
  return { ok: true };
}

/** Poster company labels from owner-published public cards (viewer RLS). */
async function posterOrganizationLabels(
  user: AnyClient,
  communityId: string,
  posterIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ids = [...new Set(posterIds.filter(Boolean))];
  if (ids.length === 0) return out;
  const { data } = await user
    .from("member_business_cards")
    .select(CARD_ORG_SELECT)
    .eq("association_id", communityId)
    .in("member_id", ids);
  for (const c of (data ?? []) as { member_id: string; company_name: string | null }[]) {
    if (c.company_name && !out.has(c.member_id)) out.set(c.member_id, c.company_name);
  }
  return out;
}

/**
 * Cơ hội người xem đã quan tâm, kèm mức độ quan tâm canonical
 * (member_id = members.id). Mức không hợp lệ được quy về "high".
 */
async function interestedOpportunityLevels(
  admin: AnyClient,
  memberId: string,
  opportunityIds?: string[],
): Promise<Map<string, CommunityInterestLevel>> {
  let q = admin
    .from("opportunity_interests")
    .select("opportunity_id, interest_level")
    .eq("member_id", memberId);
  if (opportunityIds && opportunityIds.length > 0) q = q.in("opportunity_id", opportunityIds);
  const { data } = await q;
  const out = new Map<string, CommunityInterestLevel>();
  for (const r of (data ?? []) as { opportunity_id: string; interest_level: string | null }[]) {
    out.set(r.opportunity_id, r.interest_level === "low" ? "low" : "high");
  }
  return out;
}

export async function listCommunityOpportunities(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  query?: string;
  offset?: number;
}): Promise<CommunityOpportunityPageDTO | null> {
  const { user, viewerId, communityId } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) return null;

  const offset = Math.max(0, input.offset ?? 0);
  const nowMs = Date.now();
  const q = normalizeActivitySearch(input.query ?? "");

  const buildQuery = (select: string, opts?: { count?: "exact"; head?: boolean }) => {
    let query = user
      .from("opportunities")
      .select(select, opts)
      .eq("association_id", communityId)
      .eq("status", "open")
      .gte("deadline", new Date(nowMs).toISOString());
    if (q.length > 0) {
      const like = `%${q}%`;
      query = query.or(`title.ilike.${like},industry.ilike.${like},region.ilike.${like}`);
    }
    return query;
  };

  const { count } = await buildQuery("id", { count: "exact", head: true });
  const totalCount = count ?? 0;

  const { data: rows, error } = await buildQuery(OPP_SELECT)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + COMMUNITY_OPPORTUNITIES_PAGE_SIZE - 1);
  if (error) return { items: [], totalCount, nextOffset: null };

  const opps = ((rows ?? []) as CommunityOpportunityRow[]).filter((o) =>
    isOpportunityActive(o, nowMs),
  );

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;
  const member = await viewerMemberContext(admin, communityId, viewerId);
  const ids = opps.map((o) => o.id);
  const [orgLabels, interested] = await Promise.all([
    posterOrganizationLabels(user, communityId, opps.map((o) => o.poster_id ?? "").filter(Boolean)),
    member
      ? interestedOpportunityLevels(admin, member.id, ids)
      : Promise.resolve(new Map<string, CommunityInterestLevel>()),
  ]);

  const items = opps.map((o) =>
    mapCommunityOpportunitySummary(o, {
      organizationLabel: (o.poster_id && orgLabels.get(o.poster_id)) || null,
      interested: interested.has(o.id),
      interestLevel: interested.get(o.id) ?? null,
      nowMs,
    }),
  );

  return {
    items,
    totalCount,
    nextOffset: nextActivityOffset(items.length, offset, totalCount),
  };
}

async function fetchCommunityOpportunity(
  user: AnyClient,
  communityId: string,
  opportunityRef: string,
): Promise<CommunityOpportunityRow | null> {
  const { data } = await user
    .from("opportunities")
    .select(OPP_SELECT)
    .eq("id", opportunityRef)
    .eq("association_id", communityId)
    .maybeSingle();
  return (data as CommunityOpportunityRow | null) ?? null;
}

export async function getCommunityOpportunityDetail(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  opportunityRef: string;
}): Promise<CommunityOpportunityDetailDTO | null> {
  const { user, viewerId, communityId, opportunityRef } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) return null;

  const [opp, assoc] = await Promise.all([
    fetchCommunityOpportunity(user, communityId, opportunityRef),
    user.from("associations").select("id, name").eq("id", communityId).maybeSingle(),
  ]);
  // Fail closed for drafts / non-open statuses (audit §2.3). Expired-but-open
  // rows still render a truthful read-only detail on deep links.
  if (!opp || !assoc?.data || opp.status !== "open") return null;

  const nowMs = Date.now();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;
  const member = await viewerMemberContext(admin, communityId, viewerId);

  const [orgLabels, interested, posterRow, followUp] = await Promise.all([
    posterOrganizationLabels(user, communityId, opp.poster_id ? [opp.poster_id] : []),
    member
      ? interestedOpportunityLevels(admin, member.id, [opportunityRef])
      : Promise.resolve(new Map<string, CommunityInterestLevel>()),
    opp.poster_id
      ? admin
          .from("members")
          .select("id, name")
          .eq("id", opp.poster_id)
          .eq("association_id", communityId)
          .eq("status", "active")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    fetchOpportunityFollowUp(user, viewerId, opportunityRef, nowMs),
  ]);
  const [followUpHistory, followUpAttachments] = await Promise.all([
    fetchOpportunityFollowUpHistory(user, viewerId, opportunityRef),
    fetchOpportunityAttachments(user, viewerId, opportunityRef),
  ]);

  const summary = mapCommunityOpportunitySummary(opp, {
    organizationLabel: (opp.poster_id && orgLabels.get(opp.poster_id)) || null,
    interested: interested.has(opportunityRef),
    interestLevel: interested.get(opportunityRef) ?? null,
    nowMs,
  });

  const posterData = (posterRow as any)?.data as { id: string; name: string } | null;

  return {
    opportunity: summary,
    description: opp.description ?? null,
    regionLabel: opp.region ?? null,
    industryLabel: opp.industry ?? null,
    budgetMin: typeof opp.budget_min === "number" ? opp.budget_min : null,
    budgetMax: typeof opp.budget_max === "number" ? opp.budget_max : null,
    poster: posterData ? { memberRef: posterData.id, displayName: posterData.name } : null,
    communityId,
    communityName: (assoc.data as any).name,
    canExpressInterest: canInitiateInterest({
      status: opp.status,
      deadline: opp.deadline,
      nowMs,
      isOwnPost: member !== null && opp.poster_id === member.id,
      hasMemberRecord: member !== null,
      alreadyInterested: summary.interested,
    }),
    followUp,
    followUpHistory,
    followUpAttachments,
  };
}

// ── Nhắc hẹn liên hệ lại (community_opportunity_followups) ─────────────────
// Chỉ đọc/ghi bản ghi của CHÍNH người xem qua client RLS — không dùng admin,
// không tạo lịch họp hay backend song song.

const FOLLOW_UP_ERROR = "community_opportunity_follow_up_unavailable";
const FOLLOW_UP_MAX_DAYS = 180;

function todayIso(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

function dayDiff(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

type FollowUpRow = {
  remind_at: string | null;
  status: string;
  progress?: string | null;
  note?: string | null;
};

const PROGRESS_VALUES = ["planned", "messaged", "replied", "closed"] as const;

function mapProgress(raw: unknown): CommunityOpportunityProgressDTO {
  return (PROGRESS_VALUES as readonly string[]).includes(String(raw))
    ? (raw as CommunityOpportunityProgressDTO)
    : "planned";
}

function mapFollowUp(
  row: FollowUpRow | null,
  nowMs: number,
): CommunityOpportunityFollowUpDTO | null {
  if (!row) return null;
  const status =
    row.status === "done" || row.status === "cancelled" ? row.status : ("pending" as const);
  if (status === "cancelled") return null;
  const remindAt = row.remind_at ? String(row.remind_at).slice(0, 10) : null;
  const daysUntil = remindAt ? dayDiff(todayIso(nowMs), remindAt) : null;
  const note = typeof row.note === "string" && row.note.trim() ? row.note.trim() : null;
  return {
    remindAt,
    progress: mapProgress(row.progress),
    note,
    status,
    due: status === "pending" && daysUntil !== null && daysUntil <= 0,
    daysUntil,
  };
}

async function fetchOpportunityFollowUp(
  user: AnyClient,
  viewerId: string,
  opportunityRef: string,
  nowMs: number,
): Promise<CommunityOpportunityFollowUpDTO | null> {
  const { data } = await user
    .from("community_opportunity_followups")
    .select("remind_at, status, progress, note")
    .eq("user_id", viewerId)
    .eq("opportunity_id", opportunityRef)
    .maybeSingle();
  return mapFollowUp((data as FollowUpRow | null) ?? null, nowMs);
}

const FOLLOW_UP_HISTORY_LIMIT = 12;

/** Lịch sử ghi chú / đổi trạng thái của chính người xem (mới nhất trước). */
async function fetchOpportunityFollowUpHistory(
  user: AnyClient,
  viewerId: string,
  opportunityRef: string,
): Promise<CommunityOpportunityFollowUpEventDTO[]> {
  const { data } = await user
    .from("community_opportunity_followup_events")
    .select("id, kind, progress, remind_at, note, created_at")
    .eq("user_id", viewerId)
    .eq("opportunity_id", opportunityRef)
    .order("created_at", { ascending: false })
    .limit(FOLLOW_UP_HISTORY_LIMIT);
  const rows = (data as any[] | null) ?? [];
  return rows.map((row) => ({
    id: String(row.id),
    kind: row.kind as CommunityOpportunityFollowUpEventDTO["kind"],
    progress: row.progress ? mapProgress(row.progress) : null,
    remindAt: row.remind_at ? String(row.remind_at).slice(0, 10) : null,
    note: typeof row.note === "string" && row.note.trim() ? row.note.trim() : null,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

/** Đặt/đổi lịch nhắc liên hệ lại cho một cơ hội (một nhắc hẹn mỗi cơ hội). */
export async function scheduleCommunityOpportunityFollowUp(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  opportunityRef: string;
  inDays: number;
}): Promise<{ ok: true }> {
  const { user, viewerId, communityId, opportunityRef } = input;
  const inDays = Math.trunc(input.inDays);
  if (!Number.isFinite(inDays) || inDays < 1 || inDays > FOLLOW_UP_MAX_DAYS) {
    throw new Error(FOLLOW_UP_ERROR);
  }
  if (!(await requireCommunityMembership(user, viewerId, communityId))) {
    throw new Error(FOLLOW_UP_ERROR);
  }
  const opp = await fetchCommunityOpportunity(user, communityId, opportunityRef);
  if (!opp) throw new Error(FOLLOW_UP_ERROR);

  const remindAt = todayIso(Date.now() + inDays * 86_400_000);
  const { error } = await user.from("community_opportunity_followups").upsert(
    {
      user_id: viewerId,
      association_id: communityId,
      opportunity_id: opportunityRef,
      remind_at: remindAt,
      status: "pending",
    },
    { onConflict: "user_id,opportunity_id" },
  );
  if (error) throw new Error(FOLLOW_UP_ERROR);
  await recordFollowUpEvent({
    user,
    viewerId,
    communityId,
    opportunityRef,
    kind: "scheduled",
    status: "pending",
    remindAt,
  });
  return { ok: true };
}

/** Cập nhật tiến độ nhắc hẹn: đánh dấu đã liên hệ hoặc bỏ nhắc. */
export async function updateCommunityOpportunityFollowUp(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  opportunityRef: string;
  action: "done" | "cancel";
}): Promise<{ ok: true }> {
  const { user, viewerId, communityId, opportunityRef, action } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) {
    throw new Error(FOLLOW_UP_ERROR);
  }
  const { error } = await user
    .from("community_opportunity_followups")
    .update({ status: action === "done" ? "done" : "cancelled" })
    .eq("user_id", viewerId)
    .eq("opportunity_id", opportunityRef);
  if (error) throw new Error(FOLLOW_UP_ERROR);
  await recordFollowUpEvent({
    user,
    viewerId,
    communityId,
    opportunityRef,
    kind: action === "done" ? "done" : "cancelled",
    status: action === "done" ? "done" : "cancelled",
  });
  return { ok: true };
}

const PROGRESS_NOTE_MAX = 1000;

/**
 * Lưu tiến độ theo đuổi cơ hội của CHÍNH người xem (kèm nội dung tin nhắn đã
 * gửi, nếu có). Không tạo hội thoại/backend nhắn tin song song — việc gửi tin
 * do người dùng thực hiện qua ứng dụng nhắn tin trên thiết bị.
 */
export async function saveCommunityOpportunityProgress(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  opportunityRef: string;
  progress: CommunityOpportunityProgressDTO;
  note?: string | null;
}): Promise<{ ok: true }> {
  const { user, viewerId, communityId, opportunityRef, progress } = input;
  if (!(PROGRESS_VALUES as readonly string[]).includes(progress)) {
    throw new Error(FOLLOW_UP_ERROR);
  }
  if (!(await requireCommunityMembership(user, viewerId, communityId))) {
    throw new Error(FOLLOW_UP_ERROR);
  }
  const opp = await fetchCommunityOpportunity(user, communityId, opportunityRef);
  if (!opp) throw new Error(FOLLOW_UP_ERROR);

  const note =
    typeof input.note === "string" && input.note.trim()
      ? input.note.trim().slice(0, PROGRESS_NOTE_MAX)
      : null;

  const { error } = await user.from("community_opportunity_followups").upsert(
    {
      user_id: viewerId,
      association_id: communityId,
      opportunity_id: opportunityRef,
      progress,
      ...(note === null ? {} : { note }),
      status: progress === "closed" ? "done" : "pending",
    },
    { onConflict: "user_id,opportunity_id" },
  );
  if (error) throw new Error(FOLLOW_UP_ERROR);
  await recordFollowUpEvent({
    user,
    viewerId,
    communityId,
    opportunityRef,
    kind: note !== null && progress === "planned" ? "note" : "progress",
    progress,
    status: progress === "closed" ? "done" : "pending",
    note,
  });
  return { ok: true };
}

/** Ghi một mốc lịch sử; lỗi ghi lịch sử không được làm hỏng hành động chính. */
async function recordFollowUpEvent(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  opportunityRef: string;
  kind: CommunityOpportunityFollowUpEventDTO["kind"];
  progress?: CommunityOpportunityProgressDTO | null;
  status?: "pending" | "done" | "cancelled" | null;
  remindAt?: string | null;
  note?: string | null;
}): Promise<void> {
  try {
    await input.user.from("community_opportunity_followup_events").insert({
      user_id: input.viewerId,
      association_id: input.communityId,
      opportunity_id: input.opportunityRef,
      kind: input.kind,
      progress: input.progress ?? null,
      status: input.status ?? null,
      remind_at: input.remindAt ?? null,
      note: input.note ?? null,
    });
  } catch {
    // lịch sử là phụ trợ — bỏ qua lỗi
  }
}

const INTEREST_ERROR = "community_opportunity_interest_unavailable";

/**
 * Canonical opportunity interest — privileged write into the SAME
 * opportunity_interests table with member_id = members.id (audit §2.3).
 * Idempotent: an existing interest returns ok without a duplicate.
 * Never creates connections, guest contacts, or CRM records.
 */
export async function expressCommunityOpportunityInterest(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  opportunityRef: string;
  interestLevel?: CommunityInterestLevel;
}): Promise<{ ok: true }> {
  const { user, viewerId, communityId, opportunityRef } = input;
  const interestLevel: CommunityInterestLevel = input.interestLevel === "low" ? "low" : "high";
  if (!(await requireCommunityMembership(user, viewerId, communityId))) {
    throw new Error(INTEREST_ERROR);
  }
  const opp = await fetchCommunityOpportunity(user, communityId, opportunityRef);
  if (!opp || opp.status !== "open") throw new Error(INTEREST_ERROR);
  if (!isOpportunityActive(opp, Date.now())) throw new Error("community_opportunity_expired");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;
  const member = await viewerMemberContext(admin, communityId, viewerId);
  if (!member) throw new Error(INTEREST_ERROR);
  if (opp.poster_id === member.id) throw new Error(INTEREST_ERROR); // own post

  const existing = await interestedOpportunityLevels(admin, member.id, [opportunityRef]);
  const current = existing.get(opportunityRef);
  if (current) {
    // Idempotent: đã quan tâm rồi thì chỉ cập nhật mức độ khi có thay đổi.
    if (current === interestLevel) return { ok: true };
    const { error: updateError } = await admin
      .from("opportunity_interests")
      .update({ interest_level: interestLevel })
      .eq("association_id", communityId)
      .eq("opportunity_id", opportunityRef)
      .eq("member_id", member.id);
    if (updateError) throw new Error(INTEREST_ERROR);
    return { ok: true };
  }

  const { error } = await admin.from("opportunity_interests").insert({
    id: crypto.randomUUID(),
    opportunity_id: opportunityRef,
    member_id: member.id,
    message: "Tôi quan tâm cơ hội này.",
    contact: member.phone ?? member.email ?? "",
    association_id: communityId,
    interest_level: interestLevel,
  });
  if (error) throw new Error(INTEREST_ERROR);
  return { ok: true };
}

const WITHDRAW_INTEREST_ERROR = "community_opportunity_withdraw_unavailable";

/**
 * Bỏ quan tâm cơ hội — gỡ CHÍNH bản ghi quan tâm của người xem trên bảng
 * canonical opportunity_interests (không có backend song song, không xoá của
 * người khác). Idempotent: chưa quan tâm vẫn trả ok.
 */
export async function withdrawCommunityOpportunityInterest(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  opportunityRef: string;
}): Promise<{ ok: true }> {
  const { user, viewerId, communityId, opportunityRef } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) {
    throw new Error(WITHDRAW_INTEREST_ERROR);
  }
  const opp = await fetchCommunityOpportunity(user, communityId, opportunityRef);
  if (!opp) throw new Error(WITHDRAW_INTEREST_ERROR);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;
  const member = await viewerMemberContext(admin, communityId, viewerId);
  if (!member) throw new Error(WITHDRAW_INTEREST_ERROR);

  const existing = await interestedOpportunityLevels(admin, member.id, [opportunityRef]);
  if (!existing.has(opportunityRef)) return { ok: true }; // idempotent

  const { error } = await admin
    .from("opportunity_interests")
    .delete()
    .eq("association_id", communityId)
    .eq("opportunity_id", opportunityRef)
    .eq("member_id", member.id);
  if (error) throw new Error(WITHDRAW_INTEREST_ERROR);
  return { ok: true };
}

/**
 * Bounded Community Detail preview (§40/§64): next 2 events + next 2 open
 * opportunities. Sections fail independently — a broken section renders quiet.
 */
export async function getCommunityActivityPreview(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
}): Promise<CommunityActivityPreviewDTO | null> {
  const { user, viewerId, communityId } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) return null;

  const nowMs = Date.now();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;
  const member = await viewerMemberContext(admin, communityId, viewerId);

  let nextEvents: CommunityActivityPreviewDTO["nextEvents"] = [];
  try {
    const { data: rows } = await user
      .from("events")
      .select(EVENT_SELECT)
      .eq("association_id", communityId)
      .in("status", [...LISTABLE_STATUSES])
      .gte("date", todayIsoDate(nowMs))
      .order("date", { ascending: true })
      .order("id", { ascending: true })
      .limit(COMMUNITY_ACTIVITY_PREVIEW_LIMIT);
    const events = ((rows ?? []) as CommunityEventRow[]).filter((e: any) =>
      isEventListableStatus(e.status),
    );
    const ids = events.map((e: any) => e.id);
    const [registered, counts] = await Promise.all([
      member
        ? activeRegistrationIds(admin, communityId, member.code, ids)
        : Promise.resolve(new Set<string>()),
      registrationCounts(admin, communityId, ids),
    ]);
    nextEvents = events.map((e: any) =>
      mapCommunityEventSummary(e, {
        isRegistered: registered.has(e.id),
        activeRegistrations: counts.get(e.id) ?? 0,
      }),
    );
  } catch {
    nextEvents = [];
  }

  let openOpportunities: CommunityActivityPreviewDTO["openOpportunities"] = [];
  try {
    const { data: rows } = await user
      .from("opportunities")
      .select(OPP_SELECT)
      .eq("association_id", communityId)
      .eq("status", "open")
      .gte("deadline", new Date(nowMs).toISOString())
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(COMMUNITY_ACTIVITY_PREVIEW_LIMIT);
    const opps = ((rows ?? []) as CommunityOpportunityRow[]).filter((o) =>
      isOpportunityActive(o, nowMs),
    );
    const orgLabels = await posterOrganizationLabels(
      user,
      communityId,
      opps.map((o) => o.poster_id ?? "").filter(Boolean),
    );
    openOpportunities = opps.map((o) =>
      mapCommunityOpportunityPreview(o, {
        organizationLabel: (o.poster_id && orgLabels.get(o.poster_id)) || null,
        nowMs,
      }),
    );
  } catch {
    openOpportunities = [];
  }

  return { nextEvents, openOpportunities };
}

// ── Đính kèm tệp/liên kết own-row (community_opportunity_followup_attachments) ──
// Chỉ đọc/ghi bản ghi của CHÍNH người xem qua client RLS. Tệp nằm trong kho
// riêng "opportunity-attachments" (thư mục theo user id) — không có backend
// tài liệu song song.

const ATTACHMENT_ERROR = "community_opportunity_attachment_unavailable";
const ATTACHMENT_LIMIT = 10;
const ATTACHMENT_TITLE_MAX = 160;

function mapAttachment(row: any): CommunityOpportunityAttachmentDTO {
  const kind = row.kind === "file" ? "file" : "link";
  return {
    id: String(row.id),
    kind,
    title:
      typeof row.title === "string" && row.title.trim()
        ? row.title.trim().slice(0, ATTACHMENT_TITLE_MAX)
        : kind === "link"
          ? String(row.url ?? "")
          : String(row.storage_path ?? "")
              .split("/")
              .pop() || "",
    url: kind === "link" ? (row.url ? String(row.url) : null) : null,
    storagePath: kind === "file" ? (row.storage_path ? String(row.storage_path) : null) : null,
    mimeType: row.mime_type ? String(row.mime_type) : null,
    sizeBytes: typeof row.size_bytes === "number" ? row.size_bytes : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function fetchOpportunityAttachments(
  user: AnyClient,
  viewerId: string,
  opportunityRef: string,
): Promise<CommunityOpportunityAttachmentDTO[]> {
  const { data } = await user
    .from("community_opportunity_followup_attachments")
    .select("id, kind, title, url, storage_path, mime_type, size_bytes, created_at")
    .eq("user_id", viewerId)
    .eq("opportunity_id", opportunityRef)
    .order("created_at", { ascending: false })
    .limit(ATTACHMENT_LIMIT);
  return ((data as any[] | null) ?? []).map(mapAttachment);
}

function safeExternalLink(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().slice(0, 2000);
  } catch {
    return null;
  }
}

/** Thêm một đính kèm (liên kết hoặc tệp đã tải lên kho riêng) cho cơ hội. */
export async function addCommunityOpportunityAttachment(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  opportunityRef: string;
  kind: "link" | "file";
  title?: string | null;
  url?: string | null;
  storagePath?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
}): Promise<{ ok: true }> {
  const { user, viewerId, communityId, opportunityRef, kind } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) {
    throw new Error(ATTACHMENT_ERROR);
  }
  const opp = await fetchCommunityOpportunity(user, communityId, opportunityRef);
  if (!opp) throw new Error(ATTACHMENT_ERROR);

  const existing = await fetchOpportunityAttachments(user, viewerId, opportunityRef);
  if (existing.length >= ATTACHMENT_LIMIT)
    throw new Error("community_opportunity_attachment_limit");

  let url: string | null = null;
  let storagePath: string | null = null;
  if (kind === "link") {
    url = safeExternalLink(String(input.url ?? ""));
    if (!url) throw new Error("community_opportunity_attachment_invalid_link");
  } else {
    const path = String(input.storagePath ?? "").trim();
    // Chỉ chấp nhận tệp nằm trong thư mục riêng của chính người xem.
    if (!path.startsWith(`${viewerId}/`) || path.includes("..")) throw new Error(ATTACHMENT_ERROR);
    storagePath = path;
  }

  const title =
    typeof input.title === "string" && input.title.trim()
      ? input.title.trim().slice(0, ATTACHMENT_TITLE_MAX)
      : null;

  const { error } = await user.from("community_opportunity_followup_attachments").insert({
    user_id: viewerId,
    association_id: communityId,
    opportunity_id: opportunityRef,
    kind,
    title,
    url,
    storage_path: storagePath,
    mime_type: input.mimeType ? String(input.mimeType).slice(0, 120) : null,
    size_bytes:
      typeof input.sizeBytes === "number" && Number.isFinite(input.sizeBytes)
        ? Math.max(0, Math.trunc(input.sizeBytes))
        : null,
  });
  if (error) throw new Error(ATTACHMENT_ERROR);
  return { ok: true };
}

/** Gỡ một đính kèm của CHÍNH người xem (kèm xoá tệp trong kho riêng). */
export async function removeCommunityOpportunityAttachment(input: {
  user: AnyClient;
  viewerId: string;
  attachmentId: string;
}): Promise<{ ok: true }> {
  const { user, viewerId, attachmentId } = input;
  const { data } = await user
    .from("community_opportunity_followup_attachments")
    .select("id, kind, title, url, storage_path, mime_type, size_bytes, created_at")
    .eq("user_id", viewerId)
    .eq("id", attachmentId)
    .maybeSingle();
  if (!data) return { ok: true }; // idempotent
  const row = mapAttachment(data);
  const { error } = await user
    .from("community_opportunity_followup_attachments")
    .delete()
    .eq("user_id", viewerId)
    .eq("id", attachmentId);
  if (error) throw new Error(ATTACHMENT_ERROR);
  if (row.kind === "file" && row.storagePath?.startsWith(`${viewerId}/`)) {
    try {
      await (user as any).storage.from("opportunity-attachments").remove([row.storagePath]);
    } catch {
      // tệp có thể đã bị gỡ trước đó — bỏ qua
    }
  }
  return { ok: true };
}

// BC-Mobile-7B+ — Adapter yêu cầu tham gia cộng đồng. SERVER ONLY.
//
// Nguyên tắc:
//  - Danh sách cộng đồng có thể tham gia chỉ gồm associations đã publish
//    (landing_published = true) và viewer CHƯA là thành viên.
//  - Trạng thái yêu cầu đọc/ghi bằng client theo phiên (RLS: chỉ chính chủ).
//  - Không tiết lộ dữ liệu riêng của cộng đồng: chỉ tên/logo/tagline.

import type {
  CommunityJoinCandidateDTO,
  CommunityJoinAdminRequestDTO,
  CommunityJoinHistoryItemDTO,
  CommunityJoinStatus,
} from "./community-join.types";

type AnyClient = { from: (table: string) => any };

const ASSOC_SELECT = "id, name, logo_url, tagline";

function normalizeStatus(value: unknown): CommunityJoinStatus {
  return value === "pending" || value === "approved" || value === "rejected" || value === "cancelled"
    ? value
    : "none";
}

export async function listJoinableCommunities(
  user: AnyClient,
  viewerId: string,
): Promise<CommunityJoinCandidateDTO[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: memberships } = await user
    .from("memberships")
    .select("association_id")
    .eq("user_id", viewerId);
  const joined = new Set(((memberships ?? []) as any[]).map((m) => m.association_id));

  const { data: assocs, error } = await (supabaseAdmin as AnyClient)
    .from("associations")
    .select(ASSOC_SELECT)
    .eq("landing_published", true)
    .order("name", { ascending: true })
    .limit(50);
  if (error || !assocs) return [];

  const { data: requests } = await user
    .from("community_join_requests")
    .select("association_id, status, created_at")
    .eq("user_id", viewerId);
  const byAssoc = new Map<string, { status: CommunityJoinStatus; createdAt: string | null }>();
  for (const r of (requests ?? []) as any[]) {
    byAssoc.set(r.association_id, {
      status: normalizeStatus(r.status),
      createdAt: r.created_at ?? null,
    });
  }

  return (assocs as any[])
    .filter((a: any) => !joined.has(a.id))
    .map((a: any) => {
      const req = byAssoc.get(a.id);
      return {
        communityId: a.id as string,
        name: a.name as string,
        logoUrl: (a.logo_url as string | null) ?? null,
        shortDescription: (a.tagline as string | null) ?? null,
        status: req?.status ?? "none",
        requestedAt: req?.createdAt ?? null,
      };
    });
}

/** Gửi yêu cầu tham gia. Idempotent: gửi lại sau khi bị từ chối/huỷ sẽ mở lại. */
export async function requestCommunityJoin(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  note?: string | null;
}): Promise<{ status: CommunityJoinStatus }> {
  const { user, viewerId, communityId } = input;
  const note = (input.note ?? "").trim().slice(0, 500) || null;

  const { data: membership } = await user
    .from("memberships")
    .select("association_id")
    .eq("user_id", viewerId)
    .eq("association_id", communityId)
    .maybeSingle();
  if (membership) return { status: "approved" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: assoc } = await (supabaseAdmin as AnyClient)
    .from("associations")
    .select("id")
    .eq("id", communityId)
    .eq("landing_published", true)
    .maybeSingle();
  if (!assoc) throw new Error("community_join_unavailable");

  const { data: existing } = await user
    .from("community_join_requests")
    .select("id, status")
    .eq("user_id", viewerId)
    .eq("association_id", communityId)
    .maybeSingle();

  if (existing) {
    const current = normalizeStatus((existing as any).status);
    if (current === "pending" || current === "approved") return { status: current };
    const { error } = await user
      .from("community_join_requests")
      .update({ status: "pending", decided_at: null, message: note })
      .eq("id", (existing as any).id);
    if (error) throw new Error("community_join_unavailable");
    return { status: "pending" };
  }

  const { error } = await user
    .from("community_join_requests")
    .insert({ user_id: viewerId, association_id: communityId, status: "pending" });
  if (error) throw new Error("community_join_unavailable");
  return { status: "pending" };
}

/** Huỷ yêu cầu đang chờ. Chỉ tác động lên yêu cầu của chính viewer. */
export async function cancelCommunityJoinRequest(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  cancelReason?: string | null;
}): Promise<{ status: CommunityJoinStatus }> {
  const { user, viewerId, communityId } = input;
  const reason = (input.cancelReason ?? "").trim().slice(0, 500) || null;

  const { data: existing } = await user
    .from("community_join_requests")
    .select("id, status")
    .eq("user_id", viewerId)
    .eq("association_id", communityId)
    .maybeSingle();

  if (!existing) return { status: "none" };
  const current = normalizeStatus((existing as any).status);
  if (current !== "pending") return { status: current };

  const { error } = await user
    .from("community_join_requests")
    .update({
      status: "cancelled",
      decided_at: new Date().toISOString(),
      cancel_reason: reason,
    })
    .eq("id", (existing as any).id);
  if (error) throw new Error("community_join_cancel_unavailable");
  return { status: "cancelled" };
}

/** Lịch sử yêu cầu tham gia của chính viewer (mới nhất trước). */
export async function listCommunityJoinHistory(
  user: AnyClient,
  viewerId: string,
): Promise<CommunityJoinHistoryItemDTO[]> {
  const { data: requests } = await user
    .from("community_join_requests")
    .select("id, association_id, status, message, cancel_reason, created_at, decided_at")
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(30);

  const rows = (requests ?? []) as any[];
  if (rows.length === 0) return [];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ids = Array.from(new Set(rows.map((r: any) => r.association_id)));
  const { data: assocs } = await (supabaseAdmin as AnyClient)
    .from("associations")
    .select("id, name, logo_url")
    .in("id", ids);
  const byId = new Map(((assocs ?? []) as any[]).map((a: any) => [a.id as string, a]));

  return rows.map((r: any) => {
    const assoc = byId.get(r.association_id);
    return {
      requestId: r.id as string,
      communityId: r.association_id as string,
      name: (assoc?.name as string | undefined) ?? "—",
      logoUrl: (assoc?.logo_url as string | null | undefined) ?? null,
      status: normalizeStatus(r.status),
      requestedAt: (r.created_at as string | null) ?? null,
      decidedAt: (r.decided_at as string | null) ?? null,
      reason: (r.message as string | null) ?? null,
      cancelReason: (r.cancel_reason as string | null) ?? null,
    };
  });
}

/**
 * Đồng bộ thông báo trong app khi yêu cầu tham gia chuyển từ Đang chờ sang
 * Đã tham gia / Từ chối. Idempotent nhờ dedupe_key theo (request, trạng thái).
 */
export async function syncCommunityJoinDecisionNotifications(
  user: AnyClient,
  viewerId: string,
): Promise<Array<{ communityId: string; name: string; status: "approved" | "rejected" }>> {
  const { data: requests } = await user
    .from("community_join_requests")
    .select("id, association_id, status, decided_at")
    .eq("user_id", viewerId)
    .in("status", ["approved", "rejected"])
    .order("decided_at", { ascending: false })
    .limit(20);

  const rows = (requests ?? []) as any[];
  if (rows.length === 0) return [];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;

  const dedupeKeys = rows.map((r: any) => `community_join:${r.id}:${r.status}`);
  const { data: existing } = await admin
    .from("business_notifications")
    .select("dedupe_key")
    .eq("recipient_user_id", viewerId)
    .in("dedupe_key", dedupeKeys);
  const known = new Set(((existing ?? []) as any[]).map((n: any) => n.dedupe_key as string));

  const pendingRows = rows.filter((r) => !known.has(`community_join:${r.id}:${r.status}`));
  if (pendingRows.length === 0) return [];

  const ids = Array.from(new Set(pendingRows.map((r: any) => r.association_id)));
  const { data: assocs } = await admin.from("associations").select("id, name").in("id", ids);
  const nameById = new Map(((assocs ?? []) as any[]).map((a: any) => [a.id as string, a.name as string]));

  const nowIso = new Date().toISOString();
  const inserts = pendingRows.map((r: any) => {
    const approved = r.status === "approved";
    const name = nameById.get(r.association_id) ?? "—";
    return {
      recipient_user_id: viewerId,
      source_domain: "community",
      source_record_id: r.id as string,
      event_kind: approved ? "community.join.approved" : "community.join.rejected",
      notification_kind: approved ? "community_join_approved" : "community_join_rejected",
      title_key: approved
        ? "bc.notif.kind.community_join_approved.title"
        : "bc.notif.kind.community_join_rejected.title",
      body_key: approved
        ? "bc.notif.kind.community_join_approved.body"
        : "bc.notif.kind.community_join_rejected.body",
      action_label_key: "bc.notif.action.viewJoinHistory",
      action_kind: "open_route",
      action_target: { route: "/connect-app/community", search: { tab: "history" } },
      safe_display_data: { communityName: name },
      priority: "normal",
      status: "delivered",
      delivered_at: nowIso,
      dedupe_key: `community_join:${r.id}:${r.status}`,
    };
  });

  const { error } = await admin
    .from("business_notifications")
    .upsert(inserts, { onConflict: "dedupe_key", ignoreDuplicates: true });
  if (error) return [];

  return pendingRows.map((r: any) => ({
    communityId: r.association_id as string,
    name: nameById.get(r.association_id) ?? "—",
    status: r.status as "approved" | "rejected",
  }));
}

/**
 * Danh sách yêu cầu tham gia thuộc các cộng đồng mà viewer là quản trị viên.
 * RLS (cjr_select_assoc_manager) đảm bảo chỉ đọc được yêu cầu của cộng đồng
 * mình quản trị. Hồ sơ người gửi lấy tối thiểu: tên hiển thị.
 */
export async function listCommunityJoinAdminRequests(
  user: AnyClient,
  viewerId: string,
): Promise<CommunityJoinAdminRequestDTO[]> {
  const { data: managed } = await user
    .from("memberships")
    .select("association_id, role")
    .eq("user_id", viewerId)
    .eq("role", "admin");
  const assocIds = Array.from(
    new Set(((managed ?? []) as any[]).map((m) => m.association_id as string)),
  );
  if (assocIds.length === 0) return [];

  const { data: requests } = await user
    .from("community_join_requests")
    .select("id, user_id, association_id, status, message, created_at, decided_at")
    .in("association_id", assocIds)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (requests ?? []) as any[];
  if (rows.length === 0) return [];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as AnyClient;

  const { data: assocs } = await admin
    .from("associations")
    .select("id, name")
    .in("id", Array.from(new Set(rows.map((r: any) => r.association_id))));
  const assocById = new Map(((assocs ?? []) as any[]).map((a: any) => [a.id as string, a.name as string]));

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", Array.from(new Set(rows.map((r: any) => r.user_id))));
  const nameByUser = new Map(
    ((profiles ?? []) as any[]).map((p) => [p.id as string, (p.full_name as string | null) ?? null]),
  );

  return rows.map((r: any) => ({
    requestId: r.id as string,
    communityId: r.association_id as string,
    communityName: assocById.get(r.association_id) ?? "—",
    requesterName: nameByUser.get(r.user_id) ?? null,
    status: normalizeStatus(r.status),
    note: ((r.message as string | null) ?? null) || null,
    requestedAt: (r.created_at as string | null) ?? null,
    decidedAt: (r.decided_at as string | null) ?? null,
  }));
}

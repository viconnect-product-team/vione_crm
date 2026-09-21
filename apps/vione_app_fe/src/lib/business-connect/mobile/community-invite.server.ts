// BC — Community email invites. SERVER ONLY.
// Truthful surface: an invite row is a recorded intent to invite (demo flow),
// never a claim that an email was delivered. Actor always comes from the
// request-scoped client (RLS: invited_by = auth.uid()).

import {
  DEFAULT_INVITE_TEMPLATES,
  normalizeInviteLocale,
  renderInviteTemplate,
  type CommunityInviteTemplateDTO,
  type InviteLocale,
} from "./community-invite-template";

export type CommunityInviteDTO = {
  inviteRef: string;
  email: string;
  note: string | null;
  status: "pending" | "accepted" | "cancelled" | "expired";
  createdAt: string;
  respondedAt: string | null;
  /** Mã lời mời dùng để tạo liên kết chấp nhận. */
  token: string;
  /** Ngôn ngữ đã dùng khi gửi. */
  locale: InviteLocale;
  /** Tiêu đề email đã áp dụng (ảnh chụp tại thời điểm gửi). */
  emailSubject: string | null;
  /** Nội dung email đã áp dụng (ảnh chụp tại thời điểm gửi). */
  emailBody: string | null;
  /** Vai trò sẽ gán khi người nhận chấp nhận lời mời. */
  invitedRole: "admin" | "member";
  /** Vai trò hiện tại trong cộng đồng sau khi đã chấp nhận (null nếu chưa). */
  acceptedRole: "admin" | "member" | null;
  /** Người xem là quản trị viên và có thể đổi vai trò thành viên này. */
  canManageRole: boolean;
};

type AnyClient = { from: (table: string) => any };

const INVITE_SELECT =
  "id, email, note, status, created_at, responded_at, token, locale, email_subject, email_body, invited_role, accepted_by";


function mapInvite(row: any): CommunityInviteDTO {
  return {
    inviteRef: String(row.id),
    email: String(row.email),
    note: row.note ? String(row.note) : null,
    status: (["pending", "accepted", "cancelled", "expired"] as const).includes(row.status)
      ? row.status
      : "pending",
    createdAt: String(row.created_at),
    respondedAt: row.responded_at ? String(row.responded_at) : null,
    token: row.token ? String(row.token) : "",
    locale: normalizeInviteLocale(row.locale),
    emailSubject: row.email_subject ? String(row.email_subject) : null,
    emailBody: row.email_body ? String(row.email_body) : null,
    invitedRole: String(row.invited_role) === "admin" ? "admin" : "member",
    acceptedRole: null,
    canManageRole: false,

  };
}

async function requireMembership(user: AnyClient, viewerId: string, communityId: string) {
  const { data } = await user
    .from("memberships")
    .select("role")
    .eq("user_id", viewerId)
    .eq("association_id", communityId)
    .maybeSingle();
  return data ?? null;
}

export async function listCommunityInvites(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
}): Promise<CommunityInviteDTO[]> {
  const { user, viewerId, communityId } = input;
  const membership = await requireMembership(user, viewerId, communityId);
  if (!membership) return [];
  const viewerIsAdmin = String(membership.role) === "admin";
  const { data, error } = await user
    .from("community_invitations")
    .select(INVITE_SELECT)
    .eq("association_id", communityId)
    .eq("invited_by", viewerId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !data) return [];
  const rows = data as any[];
  const invites = rows.map(mapInvite);

  // Vai trò hiện tại của những người đã chấp nhận lời mời.
  const acceptedIds = rows
    .filter((r) => String(r.status) === "accepted" && r.accepted_by)
    .map((r: any) => String(r.accepted_by));
  if (acceptedIds.length > 0) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: memberRows } = await (supabaseAdmin as unknown as AnyClient)
      .from("memberships")
      .select("user_id, role")
      .eq("association_id", communityId)
      .in("user_id", Array.from(new Set(acceptedIds)));
    const roleByUser = new Map<string, "admin" | "member">();
    for (const m of (memberRows ?? []) as any[]) {
      roleByUser.set(String(m.user_id), String(m.role) === "admin" ? "admin" : "member");
    }
    invites.forEach((invite, i) => {
      const acceptedBy = rows[i]?.accepted_by ? String(rows[i].accepted_by) : null;
      if (!acceptedBy) return;
      const role = roleByUser.get(acceptedBy) ?? null;
      invite.acceptedRole = role;
      invite.canManageRole = viewerIsAdmin && role !== null && acceptedBy !== viewerId;
    });
  }
  return invites;
}



// ---------------------------------------------------------------------------
// Mẫu email lời mời (theo cộng đồng + ngôn ngữ).
// ---------------------------------------------------------------------------

export async function listCommunityInviteTemplates(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
}): Promise<{ templates: CommunityInviteTemplateDTO[]; canEdit: boolean }> {
  const { user, viewerId, communityId } = input;
  const membership = await requireMembership(user, viewerId, communityId);
  if (!membership) return { templates: [], canEdit: false };

  const { data } = await user
    .from("community_invite_templates")
    .select("locale, subject, body, updated_at")
    .eq("association_id", communityId);

  const rows = (data ?? []) as any[];
  const templates = (["vi", "en"] as InviteLocale[]).map((locale) => {
    const row = rows.find((r) => String(r.locale) === locale);
    if (!row) {
      return {
        locale,
        subject: DEFAULT_INVITE_TEMPLATES[locale].subject,
        body: DEFAULT_INVITE_TEMPLATES[locale].body,
        isDefault: true,
        updatedAt: null,
      } satisfies CommunityInviteTemplateDTO;
    }
    return {
      locale,
      subject: String(row.subject),
      body: String(row.body),
      isDefault: false,
      updatedAt: row.updated_at ? String(row.updated_at) : null,
    } satisfies CommunityInviteTemplateDTO;
  });

  return { templates, canEdit: String(membership.role) === "admin" };
}

export async function saveCommunityInviteTemplate(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  locale: InviteLocale;
  subject: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; reason: "forbidden" }> {
  const { user, viewerId, communityId, locale } = input;
  const membership = await requireMembership(user, viewerId, communityId);
  if (!membership || String(membership.role) !== "admin") return { ok: false, reason: "forbidden" };

  const subject = input.subject.trim().slice(0, 200);
  const body = input.body.trim().slice(0, 4000);
  if (!subject || !body) return { ok: false, reason: "forbidden" };

  const { error } = await user
    .from("community_invite_templates")
    .upsert(
      {
        association_id: communityId,
        locale,
        subject,
        body,
        updated_by: viewerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "association_id,locale" },
    );
  if (error) throw new Error("community_invite_unavailable");
  return { ok: true };
}

export async function resetCommunityInviteTemplate(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  locale: InviteLocale;
}): Promise<{ ok: true } | { ok: false; reason: "forbidden" }> {
  const { user, viewerId, communityId, locale } = input;
  const membership = await requireMembership(user, viewerId, communityId);
  if (!membership || String(membership.role) !== "admin") return { ok: false, reason: "forbidden" };
  const { error } = await user
    .from("community_invite_templates")
    .delete()
    .eq("association_id", communityId)
    .eq("locale", locale);
  if (error) throw new Error("community_invite_unavailable");
  return { ok: true };
}

/** Kết xuất email theo mẫu đang lưu (hoặc mẫu mặc định) cho một lời mời cụ thể. */
async function composeInviteEmail(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  locale: InviteLocale;
  email: string;
  note: string | null;
  link: string;
}): Promise<{ subject: string; body: string }> {
  const { user, viewerId, communityId, locale } = input;

  const [{ data: tpl }, { data: assoc }, { data: profile }] = await Promise.all([
    user
      .from("community_invite_templates")
      .select("subject, body")
      .eq("association_id", communityId)
      .eq("locale", locale)
      .maybeSingle(),
    user.from("associations").select("name").eq("id", communityId).maybeSingle(),
    user.from("user_profiles").select("display_name").eq("user_id", viewerId).maybeSingle(),
  ]);

  const template = tpl
    ? { subject: String(tpl.subject), body: String(tpl.body) }
    : DEFAULT_INVITE_TEMPLATES[locale];

  return renderInviteTemplate(template, {
    community: assoc?.name ? String(assoc.name) : "",
    inviter: profile?.display_name ? String(profile.display_name) : "",
    email: input.email,
    note: input.note ?? "",
    link: input.link,
  });
}

export async function createCommunityInvite(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  email: string;
  note: string | null;
  inviteUrl: string | null;
  locale?: InviteLocale;
  invitedRole?: "admin" | "member";
}): Promise<
  { ok: true; invite: CommunityInviteDTO } | { ok: false; reason: "duplicate" | "forbidden_role" }
> {
  const { user, viewerId, communityId, inviteUrl } = input;
  const note = input.note && input.note.trim() ? input.note.trim().slice(0, 240) : null;
  const email = input.email.trim().toLowerCase();
  const locale = normalizeInviteLocale(input.locale);
  const membership = await requireMembership(user, viewerId, communityId);
  if (!membership) {
    throw new Error("community_invite_unavailable");
  }
  const viewerIsAdmin = String(membership.role) === "admin";
  if (input.invitedRole === "admin" && !viewerIsAdmin) {
    return { ok: false, reason: "forbidden_role" };
  }


  const composed = await composeInviteEmail({
    user,
    viewerId,
    communityId,
    locale,
    email,
    note,
    link: inviteUrl ?? "",
  });

  const { data, error } = await user
    .from("community_invitations")
    .insert({
      association_id: communityId,
      invited_by: viewerId,
      email,
      note,
      invite_url: inviteUrl,
      status: "pending",
      locale,
      email_subject: composed.subject,
      email_body: composed.body,
      invited_role: input.invitedRole === "admin" ? "admin" : "member",
    })
    .select(INVITE_SELECT)
    .maybeSingle();

  if (error) {
    if (String(error.code) === "23505") return { ok: false, reason: "duplicate" };
    throw new Error("community_invite_unavailable");
  }
  if (!data) throw new Error("community_invite_unavailable");
  return { ok: true, invite: mapInvite(data) };
}

export async function resendCommunityInvite(input: {
  user: AnyClient;
  viewerId: string;
  inviteRef: string;
  locale?: InviteLocale;
}): Promise<{ ok: true; invite: CommunityInviteDTO } | { ok: false; reason: "not_pending" }> {
  const { user, viewerId, inviteRef } = input;
  const now = new Date().toISOString();

  const { data: current } = await user
    .from("community_invitations")
    .select("association_id, email, note, invite_url, locale, status")
    .eq("id", inviteRef)
    .eq("invited_by", viewerId)
    .maybeSingle();
  if (!current || String(current.status) !== "pending") return { ok: false, reason: "not_pending" };

  const locale = normalizeInviteLocale(input.locale ?? current.locale);
  const composed = await composeInviteEmail({
    user,
    viewerId,
    communityId: String(current.association_id),
    locale,
    email: String(current.email),
    note: current.note ? String(current.note) : null,
    link: current.invite_url ? String(current.invite_url) : "",
  });

  const { data, error } = await user
    .from("community_invitations")
    .update({
      created_at: now,
      updated_at: now,
      locale,
      email_subject: composed.subject,
      email_body: composed.body,
    })
    .eq("id", inviteRef)
    .eq("invited_by", viewerId)
    .eq("status", "pending")
    .select(INVITE_SELECT)
    .maybeSingle();
  if (error) throw new Error("community_invite_unavailable");
  if (!data) return { ok: false, reason: "not_pending" };
  return { ok: true, invite: mapInvite(data) };
}

export async function cancelCommunityInvite(input: {
  user: AnyClient;
  viewerId: string;
  inviteRef: string;
}): Promise<{ ok: true }> {
  const { user, viewerId, inviteRef } = input;
  const { error } = await user
    .from("community_invitations")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("id", inviteRef)
    .eq("invited_by", viewerId)
    .eq("status", "pending");
  if (error) throw new Error("community_invite_unavailable");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Nhận lời mời bằng mã token (người nhận đã đăng nhập).
// ---------------------------------------------------------------------------

export type CommunityInvitePreviewDTO = {
  inviteRef: string;
  communityId: string;
  communityName: string;
  status: CommunityInviteDTO["status"];
  note: string | null;
  /** Email được mời, đã che bớt (không lộ toàn bộ địa chỉ). */
  maskedEmail: string;
  createdAt: string;
  /** Người dùng hiện tại đã là thành viên cộng đồng này. */
  alreadyMember: boolean;
  /** Vai trò sẽ được gán khi chấp nhận. */
  invitedRole: "admin" | "member";
};

export type CommunityInviteAcceptResult =
  | { ok: true; communityId: string; alreadyMember: boolean; role: "admin" | "member" }
  | { ok: false; reason: "email_mismatch" | "not_pending" | "not_found" };

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const head = local.slice(0, 2);
  return `${head}${"•".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export async function getCommunityInviteByToken(input: {
  viewerId: string;
  token: string;
}): Promise<CommunityInvitePreviewDTO | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as unknown as AnyClient)
    .from("community_invitations")
    .select("id, association_id, email, note, status, created_at, invited_role")
    .eq("token", input.token)
    .maybeSingle();
  if (!data) return null;

  const [{ data: assoc }, { data: membership }] = await Promise.all([
    (supabaseAdmin as unknown as AnyClient)
      .from("associations")
      .select("name")
      .eq("id", data.association_id)
      .maybeSingle(),
    (supabaseAdmin as unknown as AnyClient)
      .from("memberships")
      .select("id")
      .eq("user_id", input.viewerId)
      .eq("association_id", data.association_id)
      .maybeSingle(),
  ]);

  return {
    inviteRef: String(data.id),
    communityId: String(data.association_id),
    communityName: assoc?.name ? String(assoc.name) : "",
    status: mapInvite(data).status,
    note: data.note ? String(data.note) : null,
    maskedEmail: maskEmail(String(data.email)),
    createdAt: String(data.created_at),
    alreadyMember: Boolean(membership),
    invitedRole: String(data.invited_role) === "admin" ? "admin" : "member",
  };
}

export async function acceptCommunityInviteByToken(input: {
  viewerId: string;
  token: string;
  email: string;
}): Promise<CommunityInviteAcceptResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as AnyClient;
  const { data } = await admin
    .from("community_invitations")
    .select("id, association_id, email, status, invited_role")
    .eq("token", input.token)
    .maybeSingle();
  if (!data) return { ok: false, reason: "not_found" };

  if (String(data.email).trim().toLowerCase() !== input.email.trim().toLowerCase()) {
    return { ok: false, reason: "email_mismatch" };
  }
  if (String(data.status) !== "pending") return { ok: false, reason: "not_pending" };

  const communityId = String(data.association_id);
  const { data: existing } = await admin
    .from("memberships")
    .select("id")
    .eq("user_id", input.viewerId)
    .eq("association_id", communityId)
    .maybeSingle();

  const invitedRole = String(data.invited_role) === "admin" ? "admin" : "member";
  if (!existing) {
    const { error } = await admin
      .from("memberships")
      .insert({ user_id: input.viewerId, association_id: communityId, role: invitedRole });
    if (error) throw new Error("community_invite_unavailable");
  } else if (invitedRole === "admin") {
    await admin.from("memberships").update({ role: "admin" }).eq("id", existing.id);
  }

  await admin
    .from("community_invitations")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
      accepted_by: input.viewerId,
    })
    .eq("id", data.id);

  return { ok: true, communityId, alreadyMember: Boolean(existing), role: invitedRole };
}

// ---------------------------------------------------------------------------
// Đổi vai trò của thành viên đã chấp nhận lời mời (chỉ quản trị viên).
// ---------------------------------------------------------------------------

export async function updateAcceptedInviteRole(input: {
  user: AnyClient;
  viewerId: string;
  inviteRef: string;
  role: "admin" | "member";
}): Promise<
  { ok: true } | { ok: false; reason: "forbidden" | "not_accepted" | "last_admin" }
> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as AnyClient;

  const { data: invite } = await admin
    .from("community_invitations")
    .select("id, association_id, status, accepted_by")
    .eq("id", input.inviteRef)
    .maybeSingle();
  if (!invite || String(invite.status) !== "accepted" || !invite.accepted_by) {
    return { ok: false, reason: "not_accepted" };
  }

  const communityId = String(invite.association_id);
  const targetUserId = String(invite.accepted_by);
  const membership = await requireMembership(input.user, input.viewerId, communityId);
  if (!membership || String(membership.role) !== "admin") return { ok: false, reason: "forbidden" };
  if (targetUserId === input.viewerId) return { ok: false, reason: "forbidden" };

  const { data: target } = await admin
    .from("memberships")
    .select("id, role")
    .eq("association_id", communityId)
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (!target) return { ok: false, reason: "not_accepted" };
  if (String(target.role) === input.role) return { ok: true };

  if (input.role === "member") {
    const { data: admins } = await admin
      .from("memberships")
      .select("id")
      .eq("association_id", communityId)
      .eq("role", "admin");
    if (((admins ?? []) as any[]).length <= 1) return { ok: false, reason: "last_admin" };
  }

  const { error } = await admin
    .from("memberships")
    .update({ role: input.role })
    .eq("id", target.id);
  if (error) throw new Error("community_invite_unavailable");

  await admin.from("community_member_role_events").insert({
    association_id: communityId,
    invitation_id: input.inviteRef,
    target_user_id: targetUserId,
    actor_user_id: input.viewerId,
    old_role: String(target.role) === "admin" ? "admin" : "member",
    new_role: input.role,
  });
  return { ok: true };
}

export type CommunityRoleHistoryEntryDTO = {
  eventRef: string;
  oldRole: "admin" | "member";
  newRole: "admin" | "member";
  changedAt: string;
  /** Tên người thực hiện (rút gọn từ hồ sơ, có thể null). */
  actorName: string | null;
};

/** Lịch sử đổi vai trò gắn với một lời mời đã được chấp nhận. */
export async function listInviteRoleHistory(input: {
  user: AnyClient;
  viewerId: string;
  inviteRef: string;
}): Promise<CommunityRoleHistoryEntryDTO[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as AnyClient;

  const { data: invite } = await admin
    .from("community_invitations")
    .select("id, association_id")
    .eq("id", input.inviteRef)
    .maybeSingle();
  if (!invite) return [];
  if (!(await requireMembership(input.user, input.viewerId, String(invite.association_id)))) {
    return [];
  }

  const { data } = await admin
    .from("community_member_role_events")
    .select("id, old_role, new_role, created_at, actor_user_id")
    .eq("invitation_id", input.inviteRef)
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = (data ?? []) as any[];
  if (rows.length === 0) return [];

  const actorIds = Array.from(new Set(rows.map((r: any) => String(r.actor_user_id))));
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", actorIds);
  const nameById = new Map<string, string>();
  for (const p of (profiles ?? []) as any[]) {
    const label = p.full_name ? String(p.full_name) : p.email ? String(p.email) : "";
    if (label) nameById.set(String(p.id), label);
  }

  return rows.map((r: any) => ({
    eventRef: String(r.id),
    oldRole: String(r.old_role) === "admin" ? "admin" : "member",
    newRole: String(r.new_role) === "admin" ? "admin" : "member",
    changedAt: String(r.created_at),
    actorName: nameById.get(String(r.actor_user_id)) ?? null,
  }));
}

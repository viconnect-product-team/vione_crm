import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import {
  type Ctx,
  assertAdmin,
  callerScope,
  assertAssocAdmin,
  ensureMembership,
  sendActivationEmail,
  randomPassword,
  logAccountAudit,
} from "./shared.server";

export type AssignableUser = {
  userId: string;
  email: string | null;
  fullName: string | null;
  assignedMemberId: string | null;
  assignedMemberName: string | null;
};

// List auth users (via profiles) so the admin can pick an existing account.
export const listAssignableUsersFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<AssignableUser[]> => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .order("email", { ascending: true });
    if (error) throw new Error(error.message);

    // GUARD: only reveal member assignments within the caller's associations so
    // an association admin cannot learn which accounts belong to other tenants.
    const { isPlatform, assocIds } = await callerScope(context as unknown as Ctx);
    let aq = supabaseAdmin
      .from("members")
      .select("id, name, user_id, association_id")
      .not("user_id", "is", null);
    if (!isPlatform) aq = aq.in("association_id", assocIds.length ? assocIds : ["__none__"]);
    const { data: assigned } = await aq;

    const byUser = new Map<string, { id: string; name: string }>();
    for (const m of (assigned ?? []) as any[]) {
      if (m.user_id) byUser.set(m.user_id, { id: m.id, name: m.name });
    }

    return ((profiles ?? []) as any[]).map((p: any) => ({
      userId: p.id,
      email: p.email ?? null,
      fullName: p.full_name ?? null,
      assignedMemberId: byUser.get(p.id)?.id ?? null,
      assignedMemberName: byUser.get(p.id)?.name ?? null,
    }));
  });

// Get the currently linked account for a member.
export const getMemberAccountFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member, error } = await supabaseAdmin
      .from("members")
      .select("id, name, user_id, association_id")
      .eq("id", data.memberId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!member) return null;
    // GUARD: caller must administer this member's association.
    await assertAssocAdmin(context as unknown as Ctx, member.association_id as string);
    let account: { userId: string; email: string | null; fullName: string | null } | null = null;
    if (member.user_id) {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", member.user_id)
        .maybeSingle();
      account = prof
        ? { userId: prof.id, email: prof.email ?? null, fullName: prof.full_name ?? null }
        : { userId: member.user_id, email: null, fullName: null };
    }
    return {
      memberId: member.id,
      memberName: member.name,
      associationId: member.association_id,
      account,
    };
  });

export const assignMemberUserFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        memberId: z.string().min(1).max(64),
        userId: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: member, error: mErr } = await supabaseAdmin
      .from("members")
      .select("id, name, user_id, association_id")
      .eq("id", data.memberId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!member) throw new Error("Không tìm thấy hội viên");
    // GUARD: caller must administer this member's association.
    await assertAssocAdmin(context as unknown as Ctx, member.association_id as string);

    // Ensure this user isn't already linked to another member
    const { data: taken } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("user_id", data.userId)
      .neq("id", data.memberId)
      .maybeSingle();
    if (taken) throw new Error("Tài khoản này đã được gán cho hội viên khác");

    await ensureMembership(supabaseAdmin, data.userId, member.association_id);

    const { error } = await supabaseAdmin
      .from("members")
      .update({ user_id: data.userId })
      .eq("id", data.memberId);
    if (error) throw new Error(error.message);

    await logAccountAudit(supabaseAdmin, context as unknown as Ctx, {
      memberId: member.id,
      memberName: member.name,
      action: member.user_id && member.user_id !== data.userId ? "reassign" : "assign",
      oldUserId: member.user_id ?? null,
      newUserId: data.userId,
    });
    return { ok: true, userId: data.userId };
  });

// Create a new auth account and link it to the member.
export const createMemberUserFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        memberId: z.string().min(1).max(64),
        email: z.string().trim().email().max(200),
        fullName: z.string().trim().min(1).max(200),
        // When empty, the member is invited to set their own password.
        password: z.string().min(8).max(72).optional().or(z.literal("")),
        sendInvite: z.boolean().optional().default(true),
        redirectTo: z.string().url().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: member, error: mErr } = await supabaseAdmin
      .from("members")
      .select("id, name, user_id, association_id")
      .eq("id", data.memberId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!member) throw new Error("Không tìm thấy hội viên");
    // GUARD: caller must administer this member's association.
    await assertAssocAdmin(context as unknown as Ctx, member.association_id as string);

    const selfSet = !data.password;
    const initialPassword = data.password || randomPassword();

    let userId: string | null = null;
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (createErr) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const existing = list?.users?.find(
        (u: any) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
      );
      if (!existing) throw new Error(createErr.message);
      userId = existing.id;
    } else {
      userId = created.user?.id ?? null;
    }
    if (!userId) throw new Error("Không tạo được tài khoản");

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email: data.email, full_name: data.fullName }, { onConflict: "id" });

    const { data: taken } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("user_id", userId)
      .neq("id", data.memberId)
      .maybeSingle();
    if (taken) throw new Error("Tài khoản này đã được gán cho hội viên khác");

    await ensureMembership(supabaseAdmin, userId, member.association_id);

    const { error } = await supabaseAdmin
      .from("members")
      .update({ user_id: userId })
      .eq("id", data.memberId);
    if (error) throw new Error(error.message);

    let invited = false;
    if (selfSet || data.sendInvite) {
      try {
        await sendActivationEmail(data.email, data.redirectTo);
        invited = true;
      } catch {
        invited = false;
      }
    }

    await logAccountAudit(supabaseAdmin, context as unknown as Ctx, {
      memberId: member.id,
      memberName: member.name,
      action: "create",
      oldUserId: member.user_id ?? null,
      newUserId: userId,
      targetEmail: data.email,
      details: invited
        ? "Đã gửi email kích hoạt"
        : selfSet
          ? "Chưa gửi được email kích hoạt"
          : "Đặt mật khẩu thủ công",
    });
    return { ok: true, userId, invited };
  });

// Send (or resend) an activation / set-password email to a member's account.
export const sendMemberInviteFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        memberId: z.string().min(1).max(64),
        redirectTo: z.string().url().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member, error } = await supabaseAdmin
      .from("members")
      .select("id, name, user_id, association_id")
      .eq("id", data.memberId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!member) throw new Error("Không tìm thấy hội viên");
    // GUARD: caller must administer this member's association.
    await assertAssocAdmin(context as unknown as Ctx, member.association_id as string);
    if (!member?.user_id) throw new Error("Hội viên chưa được gán tài khoản");
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", member.user_id)
      .maybeSingle();
    const email = prof?.email as string | undefined;
    if (!email) throw new Error("Không tìm thấy email tài khoản");
    await sendActivationEmail(email, data.redirectTo);

    await logAccountAudit(supabaseAdmin, context as unknown as Ctx, {
      memberId: member.id,
      memberName: member.name,
      action: "invite",
      newUserId: member.user_id,
      targetEmail: email,
    });
    return { ok: true };
  });

// Unlink the account from a member.
export const unassignMemberUserFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member } = await supabaseAdmin
      .from("members")
      .select("id, name, user_id, association_id")
      .eq("id", data.memberId)
      .maybeSingle();
    if (!member) throw new Error("Không tìm thấy hội viên");
    // GUARD: caller must administer this member's association.
    await assertAssocAdmin(context as unknown as Ctx, member.association_id as string);
    const { error } = await supabaseAdmin
      .from("members")
      .update({ user_id: null })
      .eq("id", data.memberId);
    if (error) throw new Error(error.message);

    await logAccountAudit(supabaseAdmin, context as unknown as Ctx, {
      memberId: data.memberId,
      memberName: member?.name ?? null,
      action: "unassign",
      oldUserId: member?.user_id ?? null,
    });
    return { ok: true };
  });

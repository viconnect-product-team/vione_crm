import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

export type PlatformAssociation = {
  id: string;
  name: string;
  slug: string | null;
  memberCount: number;
  adminCount: number;
  createdAt: string;
};

export type AssociationAdmin = {
  membershipId: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  associationId: string;
  createdAt: string;
};

type Ctx = { supabase: any; userId: string };

async function assertPlatformAdmin(context: Ctx) {
  const { data, error } = await getDb(context).rpc("is_platform_admin");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export type RoleAuditEntry = {
  id: string;
  actorEmail: string | null;
  targetEmail: string | null;
  action: string;
  oldRole: string | null;
  newRole: string | null;
  associationId: string | null;
  details: Record<string, any> | null;
  createdAt: string;
};

// Records a role/permission change to the audit log using the service-role client.
async function logRoleChange(
  admin: any,
  context: Ctx,
  entry: {
    targetUserId?: string | null;
    targetEmail?: string | null;
    action: string;
    oldRole?: string | null;
    newRole?: string | null;
    associationId?: string | null;
    details?: Record<string, any> | null;
  },
) {
  try {
    let actorEmail: string | null = null;
    const { data: prof } = await admin
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();
    actorEmail = prof?.email ?? null;

    await admin.from("role_audit_log").insert({
      actor_id: context.userId,
      actor_email: actorEmail,
      target_user_id: entry.targetUserId ?? null,
      target_email: entry.targetEmail ?? null,
      action: entry.action,
      old_role: entry.oldRole ?? null,
      new_role: entry.newRole ?? null,
      association_id: entry.associationId ?? null,
      details: entry.details ?? null,
    });
  } catch (e) {
    // Audit logging must never block the primary operation
    console.error("role audit log failed", e);
  }
}

export const isPlatformAdminFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<boolean> => {
    const { data } = await getDb(context).rpc("is_platform_admin");
    return Boolean(data);
  });

export const listAssociationsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<PlatformAssociation[]> => {
    await assertPlatformAdmin(context);
    const { data: assocs, error } = await getDb(context)
      .from("associations")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: memberships, error: mErr } = await getDb(context)
      .from("memberships")
      .select("association_id, role");
    if (mErr) throw new Error(mErr.message);

    return (assocs ?? []).map((a: any) => {
      const rows = (memberships ?? []).filter((m: any) => m.association_id === a.id);
      return {
        id: a.id,
        name: a.name,
        slug: a.slug ?? null,
        memberCount: rows.length,
        adminCount: rows.filter((m: any) => m.role === "admin").length,
        createdAt: a.created_at,
      };
    });
  });

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const assocInput = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .max(120)
    .optional()
    .transform((v) => (v ? slugify(v) : "")),
});

export const createAssociationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => assocInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertPlatformAdmin(context);
    const { error } = await getDb(context).from("associations").insert({
      name: data.name,
      slug: data.slug ? data.slug : null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateAssociationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => assocInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertPlatformAdmin(context);
    const { error } = await getDb(context)
      .from("associations")
      .update({ name: data.name, slug: data.slug ? data.slug : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAssociationFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertPlatformAdmin(context);
    const { error } = await getDb(context).from("associations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAssociationAdminsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<AssociationAdmin[]> => {
    await assertPlatformAdmin(context);
    const { data: rows, error } = await getDb(context)
      .from("memberships")
      .select("id, user_id, association_id, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
    let profiles: Record<string, { email: string | null; full_name: string | null }> = {};
    if (ids.length) {
      const { data: profRows } = await getDb(context)
        .from("profiles")
        .select("id, email, full_name")
        .in("id", ids);
      profiles = Object.fromEntries(
        (profRows ?? []).map((p: any) => [p.id, { email: p.email, full_name: p.full_name }]),
      );
    }

    return (rows ?? []).map((r: any) => ({
      membershipId: r.id,
      userId: r.user_id,
      email: profiles[r.user_id]?.email ?? null,
      fullName: profiles[r.user_id]?.full_name ?? null,
      associationId: r.association_id,
      createdAt: r.created_at,
    }));
  });

const adminInput = z.object({
  associationId: z.string().uuid(),
  email: z.string().trim().email().max(200),
  fullName: z.string().trim().min(1).max(200),
  password: z.string().min(8).max(72),
});

export const createAssociationAdminFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => adminInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find or create the auth user by email
    let userId: string | null = null;
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });

    if (createErr) {
      // User may already exist — look them up by listing
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

    // Ensure a profile exists
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email: data.email, full_name: data.fullName }, { onConflict: "id" });

    // Grant association admin membership (set as default association)
    await supabaseAdmin.from("memberships").update({ is_default: false }).eq("user_id", userId);
    const { error: mErr } = await supabaseAdmin.from("memberships").upsert(
      {
        user_id: userId,
        association_id: data.associationId,
        role: "admin",
        is_default: true,
      },
      { onConflict: "user_id,association_id" },
    );
    if (mErr) throw new Error(mErr.message);

    await logRoleChange(supabaseAdmin, context, {
      targetUserId: userId,
      targetEmail: data.email,
      action: "grant_association_admin",
      oldRole: null,
      newRole: "admin",
      associationId: data.associationId,
    });

    return { ok: true, userId };
  });

const adminUpdateInput = z.object({
  membershipId: z.string().uuid(),
  userId: z.string().uuid(),
  associationId: z.string().uuid(),
  fullName: z.string().trim().min(1).max(200),
  password: z.string().max(72).optional(),
});

export const updateAssociationAdminFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => adminUpdateInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Update profile name
    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.fullName })
      .eq("id", data.userId);
    if (pErr) throw new Error(pErr.message);

    // Update auth metadata + optional password
    if (data.password && data.password.length > 0) {
      if (data.password.length < 8) throw new Error("Mật khẩu phải có ít nhất 8 ký tự");
      await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        password: data.password,
        user_metadata: { full_name: data.fullName },
      });
    } else {
      await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        user_metadata: { full_name: data.fullName },
      });
    }

    // Move membership to the selected association if changed
    const { data: current } = await supabaseAdmin
      .from("memberships")
      .select("association_id")
      .eq("id", data.membershipId)
      .maybeSingle();

    if (current && current.association_id !== data.associationId) {
      await supabaseAdmin
        .from("memberships")
        .update({ is_default: false })
        .eq("user_id", data.userId);
      const { error: mErr } = await supabaseAdmin
        .from("memberships")
        .update({ association_id: data.associationId, role: "admin", is_default: true })
        .eq("id", data.membershipId);
      if (mErr) throw new Error(mErr.message);

      await logRoleChange(supabaseAdmin, context, {
        targetUserId: data.userId,
        action: "change_admin_association",
        oldRole: "admin",
        newRole: "admin",
        associationId: data.associationId,
        details: { fromAssociationId: current.association_id, toAssociationId: data.associationId },
      });
    }

    return { ok: true };
  });

export const removeAssociationAdminFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => z.object({ membershipId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Capture target details before deleting for the audit log
    const { data: target } = await supabaseAdmin
      .from("memberships")
      .select("user_id, role, association_id, profiles(email)")
      .eq("id", data.membershipId)
      .maybeSingle();

    const { error } = await getDb(context)
      .from("memberships")
      .delete()
      .eq("id", data.membershipId);
    if (error) throw new Error(error.message);

    await logRoleChange(supabaseAdmin, context, {
      targetUserId: target?.user_id ?? null,
      targetEmail: (target as any)?.profiles?.email ?? null,
      action: "revoke_association_admin",
      oldRole: target?.role ?? "admin",
      newRole: null,
      associationId: target?.association_id ?? null,
    });

    return { ok: true };
  });

export const listRoleAuditLogFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<RoleAuditEntry[]> => {
    await assertPlatformAdmin(context);
    const { data, error } = await getDb(context)
      .from("role_audit_log")
      .select(
        "id, actor_email, target_email, action, old_role, new_role, association_id, details, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      actorEmail: r.actor_email,
      targetEmail: r.target_email,
      action: r.action,
      oldRole: r.old_role,
      newRole: r.new_role,
      associationId: r.association_id,
      details: r.details,
      createdAt: r.created_at,
    }));
  });

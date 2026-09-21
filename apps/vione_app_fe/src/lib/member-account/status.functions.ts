import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import {
  type Ctx,
  assertAdmin,
  callerScope,
  assertAssocAdmin,
  buildSignInMap,
} from "./shared.server";

export type MemberAccountStatus = "none" | "invited" | "active";

// Account status for every member (admin only): none | invited | active.
export const listMemberAccountStatusesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<Record<string, MemberAccountStatus>> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // GUARD: scope to the caller's own associations (platform admin sees all).
    const { isPlatform, assocIds } = await callerScope(context as Ctx);
    let q = supabaseAdmin.from("members").select("id, user_id");
    if (!isPlatform) q = q.in("association_id", assocIds.length ? assocIds : ["__none__"]);
    const { data: members, error } = await q;
    if (error) throw new Error(error.message);
    const signedIn = await buildSignInMap(supabaseAdmin);
    const out: Record<string, MemberAccountStatus> = {};
    for (const m of (members ?? []) as any[]) {
      if (!m.user_id) out[m.id] = "none";
      else out[m.id] = signedIn.get(m.user_id) ? "active" : "invited";
    }
    return out;
  });

// Account status for a single member (admin only).
export const getMemberAccountStatusFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }): Promise<MemberAccountStatus> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member, error } = await supabaseAdmin
      .from("members")
      .select("id, user_id, association_id")
      .eq("id", data.memberId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!member) return "none";
    // GUARD: caller must administer this member's association.
    await assertAssocAdmin(context as Ctx, member.association_id as string);
    if (!member?.user_id) return "none";
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
    return u?.user?.last_sign_in_at ? "active" : "invited";
  });

export type AccountAuditEntry = {
  id: string;
  memberId: string;
  memberName: string | null;
  action: "create" | "invite" | "assign" | "reassign" | "unassign";
  actorId: string | null;
  actorEmail: string | null;
  oldUserId: string | null;
  newUserId: string | null;
  targetEmail: string | null;
  details: string | null;
  createdAt: string;
};

// List the account-assignment history for a member (admin only).
export const listMemberAccountAuditFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }): Promise<AccountAuditEntry[]> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // GUARD: caller must administer this member's association.
    const { data: mem } = await supabaseAdmin
      .from("members")
      .select("association_id")
      .eq("id", data.memberId)
      .maybeSingle();
    if (!mem) return [];
    await assertAssocAdmin(context as Ctx, mem.association_id as string);
    const { data: rows, error } = await supabaseAdmin
      .from("member_account_audit")
      .select("*")
      .eq("member_id", data.memberId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return ((rows ?? []) as any[]).map((r: any) => ({
      id: r.id,
      memberId: r.member_id,
      memberName: r.member_name ?? null,
      action: r.action,
      actorId: r.actor_id ?? null,
      actorEmail: r.actor_email ?? null,
      oldUserId: r.old_user_id ?? null,
      newUserId: r.new_user_id ?? null,
      targetEmail: r.target_email ?? null,
      details: r.details ?? null,
      createdAt: r.created_at,
    }));
  });

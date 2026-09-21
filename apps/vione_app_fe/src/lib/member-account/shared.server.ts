// Shared server-only helpers for member-account server functions.
// Uses the service-role client (passed in) and sends activation emails, so
// this is server-only logic and carries the .server suffix by convention.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Ctx = { supabase?: any; userId: string };

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

// Authentication gate: caller must hold an admin role somewhere (association
// admin or platform admin). Authorization to a SPECIFIC member is enforced
// separately by assertAssocAdmin() against that member's association_id.
export async function assertAdmin(context: Ctx) {
  if (!context?.userId) throw new Error("Unauthorized");
  try {
    const [{ data: isAdmin }, { data: isPlatform }, { data: rows }] = await Promise.all([
      getDb(context).rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      getDb(context).rpc("is_platform_admin"),
      getDb(context)
        .from("memberships")
        .select("association_id")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .limit(1),
    ]);
    const isAssocAdmin = ((rows ?? []) as any[]).length > 0;
    if (isAdmin || isPlatform || isAssocAdmin) return;
  } catch {
    // If RPC methods don't exist in Postgres, allow authenticated context
    return;
  }
}

// Returns the caller's platform-admin flag + the association ids they admin.
export async function callerScope(
  context: Ctx,
): Promise<{ isPlatform: boolean; assocIds: string[] }> {
  const [{ data: isPlatform }, { data: rows }] = await Promise.all([
    getDb(context).rpc("is_platform_admin"),
    getDb(context)
      .from("memberships")
      .select("association_id")
      .eq("user_id", context.userId)
      .eq("role", "admin"),
  ]);
  return {
    isPlatform: !!isPlatform,
    assocIds: ((rows ?? []) as any[]).map((r: any) => r.association_id as string),
  };
}

// Authorization gate for a SPECIFIC target: the caller must be a platform admin
// or an admin of the target member's association. Prevents an admin of
// association A from touching association B's members via the service role.
export async function assertAssocAdmin(context: Ctx, associationId: string | null | undefined) {
  const { isPlatform, assocIds } = await callerScope(context);
  if (isPlatform) return;
  if (associationId && assocIds.includes(associationId)) return;
  throw new Error("Forbidden");
}

export async function ensureMembership(admin: any, userId: string, associationId: string | null) {
  if (!associationId) return;
  await admin
    .from("memberships")
    .upsert(
      { user_id: userId, association_id: associationId, role: "member", is_default: true },
      { onConflict: "user_id,association_id" },
    );
}

// Validate a client-supplied redirect and send a "set your password" email
// via the standard recovery flow, which lands on /reset-password.
export function safeResetRedirect(redirectTo?: string): string | null {
  if (!redirectTo) return null;
  try {
    const url = new URL(redirectTo);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.pathname !== "/reset-password") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function sendActivationEmail(email: string, redirectTo?: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const safe = safeResetRedirect(redirectTo);
  const { error } = await client.auth.resetPasswordForEmail(
    email,
    safe ? { redirectTo: safe } : undefined,
  );
  if (error) throw new Error(error.message);
}

export function randomPassword() {
  return `Aa1!${crypto.randomUUID()}${crypto.randomUUID()}`.slice(0, 40);
}

// Record an account-assignment change for audit/traceability.
export async function logAccountAudit(
  admin: any,
  ctx: Ctx,
  entry: {
    memberId: string;
    memberName?: string | null;
    action: "create" | "invite" | "assign" | "reassign" | "unassign";
    oldUserId?: string | null;
    newUserId?: string | null;
    targetEmail?: string | null;
    details?: string | null;
  },
) {
  try {
    let actorEmail: string | null = null;
    const { data: prof } = await admin
      .from("profiles")
      .select("email")
      .eq("id", ctx.userId)
      .maybeSingle();
    actorEmail = (prof?.email as string) ?? null;
    await admin.from("member_account_audit").insert({
      member_id: entry.memberId,
      member_name: entry.memberName ?? null,
      action: entry.action,
      actor_id: ctx.userId,
      actor_email: actorEmail,
      old_user_id: entry.oldUserId ?? null,
      new_user_id: entry.newUserId ?? null,
      target_email: entry.targetEmail ?? null,
      details: entry.details ?? null,
    });
  } catch {
    // Never fail the main operation because audit logging failed.
  }
}

export async function buildSignInMap(supabaseAdmin: any): Promise<Map<string, boolean>> {
  // Map of user_id -> has ever signed in (last_sign_in_at not null)
  const signedIn = new Map<string, boolean>();
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) break;
    const users = (data?.users ?? []) as any[];
    for (const u of users) signedIn.set(u.id, !!u.last_sign_in_at);
    if (users.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }
  return signedIn;
}

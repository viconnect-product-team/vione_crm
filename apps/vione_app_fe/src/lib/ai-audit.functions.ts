import { createServerFn } from "@tanstack/react-start";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

// Platform-admin view over the ai_request_audit table.
// Records are metadata-only (never the prompt/answer). This function resolves
// human-readable association names + user emails and supports server-side
// filtering by association, user and time window.

export type AiAuditEntry = {
  id: string;
  requestId: string;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  associationId: string | null;
  associationName: string | null;
  capability: string | null;
  permissionLevel: string | null;
  provider: string | null;
  model: string | null;
  usedFallback: boolean;
  fallbackReason: string | null;
  providerLatencyMs: number | null;
  totalLatencyMs: number | null;
  sourceTypes: string[];
  sourceCount: number;
};

export type AiAuditFilter = {
  associationId?: string;
  userId?: string;
  from?: string; // ISO date/datetime
  to?: string; // ISO date/datetime
  usedFallback?: boolean;
  provider?: string;
  limit?: number;
};

type Ctx = { supabase?: any; userId: string; token?: string };

async function assertPlatformAdmin(context: Ctx) {
  const { data, error } = await getDb(context).rpc("is_platform_admin");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function sanitizeFilter(data: AiAuditFilter | undefined): AiAuditFilter {
  const f = data ?? {};
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : undefined;
  return {
    associationId: str(f.associationId),
    userId: str(f.userId),
    from: str(f.from),
    to: str(f.to),
    provider: str(f.provider),
    usedFallback: typeof f.usedFallback === "boolean" ? f.usedFallback : undefined,
    limit: typeof f.limit === "number" && f.limit > 0 ? Math.min(f.limit, 1000) : 500,
  };
}

export const listAiRequestAuditFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: AiAuditFilter) => sanitizeFilter(data))
  .handler(async ({ data, context }): Promise<AiAuditEntry[]> => {
    await assertPlatformAdmin(context);
    // Read with the service role: ai_request_audit is metadata-only and this
    // endpoint is already platform-admin gated, so RLS scoping isn't needed.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("ai_request_audit")
      .select(
        "id, request_id, created_at, user_id, association_id, capability, permission_level, provider, model, used_fallback, fallback_reason, provider_latency_ms, total_latency_ms, source_types, source_count",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 500);

    if (data.associationId) query = query.eq("association_id", data.associationId);
    if (data.provider) query = query.eq("provider", data.provider);
    if (typeof data.usedFallback === "boolean")
      query = query.eq("used_fallback", data.usedFallback);
    if (data.from) query = query.gte("created_at", data.from);
    if (data.to) query = query.lte("created_at", data.to);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    let list = (rows ?? []) as any[];

    // Resolve names in batch.
    const assocIds = [...new Set(list.map((r: any) => r.association_id).filter(Boolean))];
    const userIds = [...new Set(list.map((r: any) => r.user_id).filter(Boolean))];

    const [assocRes, userRes] = await Promise.all([
      assocIds.length
        ? supabaseAdmin.from("associations").select("id, name").in("id", assocIds)
        : Promise.resolve({ data: [] as any[] }),
      userIds.length
        ? supabaseAdmin.from("profiles").select("id, email, full_name").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const assocMap = new Map<string, string>((assocRes.data ?? []).map((a: any) => [a.id, a.name]));
    const userMap = new Map<string, { email: string | null; name: string | null }>(
      (userRes.data ?? []).map((u: any) => [u.id, { email: u.email, name: u.full_name }]),
    );

    // Optional user filter (by id, email or name substring) applied in-memory
    // so the same input works whether the admin types a UUID or an email.
    const userFilter = data.userId?.toLowerCase();
    if (userFilter) {
      list = list.filter((r) => {
        const u = r.user_id ? userMap.get(r.user_id) : undefined;
        return (
          (r.user_id && r.user_id.toLowerCase().includes(userFilter)) ||
          (u?.email && u.email.toLowerCase().includes(userFilter)) ||
          (u?.name && u.name.toLowerCase().includes(userFilter))
        );
      });
    }

    return list.map((r: any) => {
      const u = r.user_id ? userMap.get(r.user_id) : undefined;
      return {
        id: r.id,
        requestId: r.request_id,
        createdAt: r.created_at,
        userId: r.user_id,
        userEmail: u?.email ?? null,
        userName: u?.name ?? null,
        associationId: r.association_id,
        associationName: r.association_id ? (assocMap.get(r.association_id) ?? null) : null,
        capability: r.capability,
        permissionLevel: r.permission_level,
        provider: r.provider,
        model: r.model,
        usedFallback: r.used_fallback,
        fallbackReason: r.fallback_reason,
        providerLatencyMs: r.provider_latency_ms,
        totalLatencyMs: r.total_latency_ms,
        sourceTypes: r.source_types ?? [],
        sourceCount: r.source_count ?? 0,
      };
    });
  });

// Lightweight association list for the filter dropdown (platform-admin only).
export type AiAuditAssocOption = { id: string; name: string };

export const listAiAuditAssociationsFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<AiAuditAssocOption[]> => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("associations")
      .select("id, name")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((a: any) => ({ id: a.id, name: a.name }));
  });

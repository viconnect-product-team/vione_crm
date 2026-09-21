import { buildContextBundle, type ContextBundle } from "@/lib/ai-context-builder";
import type { AiCapability } from "@/lib/ai-capability-router";
import type { DataSnapshot, PermissionLevel } from "@/lib/ai-context-providers";
import type { AiSessionMemory } from "@/lib/ai-session-memory";

/**
 * AI Server Context Builder — SERVER ONLY — Phase 10, Step 5.
 *
 * Builds the RLS-safe context bundle server-side. The caller passes the
 * request-scoped Supabase client (RLS applies as the signed-in user), so any
 * data fetched here is already limited to what the user may see. Client-provided
 * context is NEVER trusted.
 *
 * Redaction rules (must hold when real fetching is wired in):
 *  - no tax_code
 *  - no private notes
 *  - no private phone/email unless the caller is permitted
 *  - no raw payment-sensitive rows for non-admins (aggregates only)
 *  - no full document content unless it is actually available and permissioned
 *
 * NOTE: This step ships the guarded architecture. Real per-capability RLS reads
 * (mapping DB rows into the safe DataSnapshot shape) are wired in the next step;
 * until then we return a permission-scoped, honest "no data" snapshot so the
 * engine never fabricates.
 */

type MinimalSupabase = { from: (table: string) => unknown };

export type ServerContextInput = {
  supabase: MinimalSupabase;
  message: string;
  capability: AiCapability;
  associationId: string;
  permissionLevel: PermissionLevel;
  memory?: AiSessionMemory | null;
  maxContextItems?: number;
};

export async function buildServerContext(input: ServerContextInput): Promise<ContextBundle> {
  // Reserved for real RLS-safe reads via the request-scoped client.
  void input.supabase;
  void input.maxContextItems;

  const data: DataSnapshot = {};

  return buildContextBundle({
    message: input.message,
    capability: input.capability,
    permissionLevel: input.permissionLevel,
    associationId: input.associationId,
    memory: input.memory ?? null,
    data,
  });
}

import type { TKey } from "@/lib/i18n";

/**
 * Maps raw errors thrown by the business-card mutation server functions
 * (create / edit / publish / set-primary / delete) into user-facing i18n keys
 * so users see a clear permission message instead of a raw Postgres/RPC string.
 *
 * Mirrors the stable coded errors defined in `business-card.functions.ts`
 * (`BC_ERR`).
 */
export function cardPermissionErrorKey(e: unknown): TKey {
  const msg = (e instanceof Error ? e.message : String(e)).toUpperCase();
  if (msg.includes("UNAUTHORIZED") || msg.includes("NO AUTHORIZATION")) {
    return "bc.perm.err.auth";
  }
  if (msg.includes("BC_NO_PROFILE")) return "bc.perm.err.noProfile";
  if (msg.includes("BC_NOT_FOUND")) return "bc.perm.err.notFound";
  if (msg.includes("BC_FORBIDDEN") || msg.includes("ROW-LEVEL SECURITY")) {
    return "bc.perm.err.forbidden";
  }
  if (msg.includes("BC_LOCKED")) return "bc.perm.err.locked";
  return "bc.perm.err.generic";
}

import type { TKey } from "@/lib/i18n";

/**
 * Maps raw errors thrown by the member-profile link/unlink RPCs into
 * user-facing i18n keys so users see a clear message for permission and
 * not-found cases instead of a raw Postgres error string.
 */
export function linkMemberErrorKey(e: unknown): TKey {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  if (msg.includes("not authenticated") || msg.includes("unauthorized")) {
    return "bc.link.err.auth";
  }
  if (msg.includes("already linked")) return "bc.link.err.taken";
  if (msg.includes("email does not match")) return "bc.link.err.emailMismatch";
  if (msg.includes("member not found") || msg.includes("not found")) {
    return "bc.link.err.notFound";
  }
  return "bc.link.err.generic";
}

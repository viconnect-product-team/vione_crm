// BC-2.1C — Canonical owner-aware Business Card authorization helper.
//
// One place that decides whether the signed-in platform user may mutate a
// given Business Card. Ownership priority is FROZEN (BC-2.1A):
//   owner_user_id (global_user) → unique legacy member (legacy_member) → deny.
//
// Server-only in practice (only reached inside server-function handlers), but
// this module statically imports NO *.server file, so it is safe to import at
// the top of *.functions.ts. The *.server resolver is loaded lazily inside the
// helper at call time.

import { resolveMemberIdOrNull } from "@/lib/current-member";

export type BusinessCardAuthz = {
  cardId: string;
  ownerUserId?: string;
  memberId?: string;
  associationId?: string;
  ownershipMode: "global_user" | "legacy_member";
};

// Stable, machine-readable authorization errors (see BC_ERR in
// business-card.functions.ts for the shared client mapping).
export const BC_AUTHZ_ERR = {
  FORBIDDEN: "BC_FORBIDDEN",
  UNRESOLVED: "BC_UNRESOLVED",
} as const;

/**
 * Require that the authenticated user is the owner of `cardId`.
 *
 * 1. Resolve the card's ownership context (owner_user_id → legacy member).
 * 2. global_user: require owner_user_id === auth.uid().
 * 3. legacy_member: require the caller's currently-resolved member matches the
 *    card's member.
 * 4. unresolved (no owner, unlinked/ambiguous member, or missing card): DENY.
 *
 * Never falls back to an association admin as owner — moderation is a separate
 * authorization path handled by the admin functions.
 */
export async function requireBusinessCardOwner(
  // Accepts either a JWT token (string) or a legacy SupabaseClient — the
  // supabase value is no longer used at runtime; only token is forwarded
  // to resolveMemberIdOrNull for legacy_member ownership.
  supabaseOrToken: string | any,
  userId: string,
  cardId: string,
): Promise<BusinessCardAuthz> {
  const token = typeof supabaseOrToken === "string" ? supabaseOrToken : "";
  const { resolveBusinessCardOwnerContext } = await import("@/lib/identity/identity-bridge.server");

  const ctx = await resolveBusinessCardOwnerContext(null as any, cardId);

  if (ctx.ownershipMode === "global_user") {
    if (!ctx.ownerUserId || ctx.ownerUserId !== userId) {
      throw new Error(BC_AUTHZ_ERR.FORBIDDEN);
    }
    return {
      cardId,
      ownerUserId: ctx.ownerUserId,
      memberId: ctx.memberId,
      associationId: ctx.associationId,
      ownershipMode: "global_user",
    };
  }

  if (ctx.ownershipMode === "legacy_member") {
    const memberId = await resolveMemberIdOrNull(token);
    if (!memberId || memberId !== ctx.memberId) {
      throw new Error(BC_AUTHZ_ERR.FORBIDDEN);
    }
    return {
      cardId,
      memberId,
      associationId: ctx.associationId,
      ownershipMode: "legacy_member",
    };
  }

  // unresolved — never guess, never grant.
  throw new Error(BC_AUTHZ_ERR.UNRESOLVED);
}

/**
 * Non-throwing variant: returns the authz context when the caller owns the
 * card, or null otherwise. Never returns a value for an unresolved card.
 */
export async function canManageBusinessCard(
  supabaseOrToken: string | any,
  userId: string,
  cardId: string,
): Promise<BusinessCardAuthz | null> {
  try {
    return await requireBusinessCardOwner(supabaseOrToken, userId, cardId);
  } catch {
    return null;
  }
}

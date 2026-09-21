// BC-1.2 — Identity Bridge server helpers.
// Server-only (blocked from client bundle by *.server filename).
// Imported ONLY by src/lib/identity/identity-bridge.functions.ts.
//
// ADDITIVE bridge helpers that prepare later Business Connect phases. They DO
// NOT modify the Association identity path: current_member_id() /
// current_association_id() RPCs remain authoritative and untouched. No schema,
// no RLS, no ownership changes here.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  AccountStatus,
  ActiveAssociationContext,
  BusinessCardOwnerContext,
} from "./identity.types";
import { resolveUserProfile } from "./platform-identity.server";

type DB = SupabaseClient<Database>;

/**
 * Resolve the active association context from the trusted platform path.
 * Never throws merely because the user has no member row — returns null.
 * Identity is derived server-side via current_member_id() /
 * current_association_id() (security-definer, JWT-scoped). Client-supplied
 * memberId / associationId are NEVER trusted here.
 */
export async function resolveActiveAssociationContext(
  supabase: DB,
  userId: string,
): Promise<ActiveAssociationContext | null> {
  const [{ data: memberId }, { data: associationId }] = await Promise.all([
    supabase.rpc("current_member_id"),
    supabase.rpc("current_association_id"),
  ]);

  if (!memberId || !associationId) return null;

  const mid = memberId as unknown as string;
  const aid = associationId as unknown as string;

  // Best-effort enrichment; missing rows must not throw or fabricate.
  const [{ data: memberRow }, { data: membershipRow }] = await Promise.all([
    supabase.from("members").select("status").eq("id", mid).maybeSingle(),
    supabase
      .from("memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("association_id", aid)
      .maybeSingle(),
  ]);

  return {
    userId,
    memberId: mid,
    associationId: aid,
    memberStatus: (memberRow?.status as string | undefined) ?? undefined,
    associationRole: (membershipRow?.role as string | undefined) ?? undefined,
  };
}

/**
 * Additive bridge: active member id (text) or null. Not a replacement for
 * resolveMemberId() — read paths that must degrade gracefully use this.
 */
export async function resolveActiveMemberId(supabase: DB): Promise<string | null> {
  const { data, error } = await supabase.rpc("current_member_id");
  if (error) throw new Error(error.message);
  return (data as unknown as string) ?? null;
}

/**
 * Platform account status, server-resolved from user_profiles.account_status.
 * Distinct from association member status — never substituted by it. A user
 * without a profile row defaults to "active" (parity with requirePlatformUser).
 */
export async function resolveAccountStatus(supabase: DB, userId: string): Promise<AccountStatus> {
  const profile = await resolveUserProfile(supabase, userId);
  return profile?.accountStatus ?? "active";
}

/**
 * Card-owner bridge (read-only). Prepares BC-2 without changing schema/RLS.
 * Ownership is derived ONLY from a unique valid members.user_id mapping:
 *   1. explicit owner_user_id column -> ownershipMode "global_user"
 *   2. unique linked member.user_id  -> ownershipMode "legacy_member"
 *   3. null/ambiguous                -> ownershipMode "unresolved"
 * Never guesses. Never uses an association admin as owner. The explicit
 * owner_user_id is nullable and unset for all legacy cards, so this preserves
 * existing behavior until BC-2.1B populates it.
 */
export async function resolveBusinessCardOwnerContext(
  supabase: DB,
  cardId: string,
): Promise<BusinessCardOwnerContext> {
  const { data: card } = await supabase
    .from("member_business_cards")
    .select("id, member_id, association_id, owner_user_id")
    .eq("id", cardId)
    .maybeSingle();

  if (!card) {
    return { cardId, ownershipMode: "unresolved" };
  }

  const memberId = (card.member_id as string | null) ?? undefined;
  const associationId = (card.association_id as string | null) ?? undefined;
  const base: BusinessCardOwnerContext = {
    cardId,
    memberId,
    associationId,
    ownershipMode: "unresolved",
  };

  // Priority 1: explicit platform ownership (populated in BC-2.1B; null today).
  const explicitOwner = (card.owner_user_id as string | null) ?? null;
  if (explicitOwner) {
    return { ...base, ownerUserId: explicitOwner, ownershipMode: "global_user" };
  }

  if (!memberId) return base;

  // Look up the member's user_id. Only a single, non-null mapping is trusted.
  const { data: members } = await supabase.from("members").select("user_id").eq("id", memberId);

  const linked = (members ?? [])
    .map((m) => m.user_id as string | null)
    .filter((u): u is string => Boolean(u));
  const unique = Array.from(new Set(linked));

  if (unique.length === 1) {
    return { ...base, ownerUserId: unique[0], ownershipMode: "legacy_member" };
  }

  // 0 (unlinked) or >1 (ambiguous) — never guess.
  return base;
}

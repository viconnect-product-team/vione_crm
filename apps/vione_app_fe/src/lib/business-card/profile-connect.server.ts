// BC-3.1D — Business Profile Connect: server-only composition helpers.
// Server-only (blocked from client bundles by filename). Handlers reach these
// via `await import()` so no server-only module is statically imported by a
// *.functions.ts module.
//
// Responsibilities (composition only — NO SQL, NO direct RPC, NO state machine):
//   • resolve the authoritative target owner from a Business Card slug
//   • compose the viewer-safe relationship state (resolveRelationshipState)
//   • enforce participant validation for connection-id actions
// All lifecycle mutations delegate to GlobalConnectionService (→ BC-3.1A RPCs).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { GlobalNetworkError } from "@/lib/global-network/errors";
import { GlobalConnectionService } from "@/lib/global-network/service";
import { resolveRelationshipState } from "@/lib/global-network/relationship-state";
import { RelationshipService } from "@/lib/business-card/relationship.service";
import { resolveBusinessCardOwnerContext } from "@/lib/identity/identity-bridge.server";
import type { GlobalConnectionMutationResult, RelationshipState } from "@/lib/global-network/types";
import type { BusinessProfileRelationshipState } from "./profile-connect.types";

type DB = SupabaseClient<Database>;

export type ResolvedProfileTarget = { ownerUserId: string; cardId: string };

/**
 * Resolve the authoritative Platform owner of a PUBLISHED Business Card by slug.
 * Never trusts a client-supplied user id. Uses the service-role client for a
 * privileged read (owner resolution only — nothing is returned to the client).
 *   • unpublished / missing → NETWORK_TARGET_NOT_FOUND
 *   • unresolved ownership  → NETWORK_TARGET_UNAVAILABLE
 * Prefers owner_user_id, falls back through the frozen Identity Bridge.
 */
export async function resolveProfileTarget(slug: string): Promise<ResolvedProfileTarget> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as DB;
  const { data: card } = await admin
    .from("member_business_cards")
    .select("id, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!card || (card as { status?: string }).status !== "published") {
    throw new GlobalNetworkError("NETWORK_TARGET_NOT_FOUND");
  }
  const cardId = (card as { id: string }).id;
  const ctx = await resolveBusinessCardOwnerContext(admin, cardId);
  if (!ctx.ownerUserId) throw new GlobalNetworkError("NETWORK_TARGET_UNAVAILABLE");
  return { ownerUserId: ctx.ownerUserId, cardId };
}

function toProfileState(rel: RelationshipState): BusinessProfileRelationshipState {
  return {
    viewer: "authenticated",
    savedCard: rel.savedCard,
    connection: rel.globalConnection
      ? {
          id: rel.globalConnection.id,
          status: rel.globalConnection.status,
          direction: rel.globalConnection.direction,
          requestedByCurrentUser: rel.globalConnection.requestedByCurrentUser,
        }
      : undefined,
    effectiveState: rel.effectiveState,
  };
}

/** Compose the viewer-safe relationship state for a profile. */
export async function getProfileRelationshipState(
  supabase: DB,
  userId: string,
  cardSlug: string,
): Promise<BusinessProfileRelationshipState> {
  let target: ResolvedProfileTarget;
  try {
    target = await resolveProfileTarget(cardSlug);
  } catch {
    // Unresolved ownership / unpublished → neutral unavailable (no reason leaked).
    return { viewer: "authenticated", savedCard: false, effectiveState: "unavailable" };
  }
  if (target.ownerUserId === userId) {
    return { viewer: "owner", savedCard: false, effectiveState: "self" };
  }
  const savedCard = await RelationshipService.exists(supabase, userId, target.cardId).catch(
    () => false,
  );
  const rel = await resolveRelationshipState(supabase, userId, target.ownerUserId, { savedCard });
  return toProfileState(rel);
}

/** Send a connection request whose target is resolved server-side from the slug. */
export async function sendProfileConnectionRequest(
  supabase: DB,
  userId: string,
  cardSlug: string,
  mutationKey?: string,
): Promise<GlobalConnectionMutationResult> {
  const target = await resolveProfileTarget(cardSlug);
  if (target.ownerUserId === userId) throw new GlobalNetworkError("NETWORK_SELF_CONNECTION");
  return GlobalConnectionService.sendRequest(supabase, userId, {
    targetUserId: target.ownerUserId,
    source: { type: "business_card", id: target.cardId },
    mutationKey,
  });
}

/**
 * Validate that a connection id genuinely relates to the current viewer AND the
 * resolved owner of the profile it was invoked from. Prevents replaying a valid
 * connection id against an unrelated Business Profile.
 */
export async function assertProfileParticipant(
  supabase: DB,
  userId: string,
  cardSlug: string,
  connectionId: string,
): Promise<ResolvedProfileTarget> {
  const target = await resolveProfileTarget(cardSlug);
  const dto = await GlobalConnectionService.getById(supabase, userId, connectionId);
  if (dto.counterpartUserId !== target.ownerUserId) {
    throw new GlobalNetworkError("NETWORK_NOT_PARTICIPANT");
  }
  return target;
}

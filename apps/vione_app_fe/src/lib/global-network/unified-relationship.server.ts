// BC-3.1E — Unified Relationship Read: server-only composition service.
//
// Server-only (blocked from client bundles by the *.server filename). Handlers
// reach this via `await import()`. It ORCHESTRATES existing domain services only
// — it performs NO SQL, NO direct RPC, and NEVER duplicates the state machine:
//   • resolve authoritative owner from a Business Card slug (Identity Bridge)
//   • gather saved edge + interaction timeline + score (owner-only)
//   • resolve authoritative connection state (resolveRelationshipState)
//   • resolve privacy-safe public counterpart summary
//   • fold everything through the pure composer
//
// The result is the single UnifiedRelationshipView — the canonical read shape.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { resolveRelationshipState } from "./relationship-state";
import { composeUnifiedRelationship } from "./unified-relationship.compose";
import { RelationshipService } from "@/lib/business-card/relationship.service";
import { BusinessInteractionService } from "@/lib/business-card/interaction.service";
import { resolveProfileTarget } from "@/lib/business-card/profile-connect.server";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import type { CounterpartSummary } from "./types";
import type { UnifiedRelationshipView } from "./unified-relationship.types";

type DB = SupabaseClient<Database>;

/** Resolve the privacy-safe PUBLIC counterpart summary for one owner user id. */
async function resolveCounterpart(
  supabase: DB,
  ownerUserId: string,
): Promise<CounterpartSummary | null> {
  const { data: rows, error } = await supabase
    .from("member_business_cards")
    .select(
      "owner_user_id, display_name, headline, professional_title, company_name, avatar_url, slug, card_kind, status, public_mode",
    )
    .eq("owner_user_id", ownerUserId)
    .eq("status", "published")
    .eq("public_mode", "public");
  if (error || !rows || rows.length === 0) return null;
  const primary =
    (rows as Array<Record<string, unknown>>).find((r) => r.card_kind === "primary") ?? rows[0];
  const row = primary as Record<string, unknown>;
  return {
    userId: ownerUserId,
    displayName: (row.display_name as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    headline: (row.headline as string | null) ?? (row.professional_title as string | null) ?? null,
    companyName: (row.company_name as string | null) ?? null,
    primaryCardSlug: (row.slug as string | null) ?? null,
  };
}

/**
 * Compose the full Unified Relationship View for an authenticated viewer and a
 * Business Card slug. Never trusts client-supplied owner ids: the owner is
 * resolved server-side. Owner-only enrichment (saved metadata, interactions,
 * score) is gathered only when the viewer actually owns a saved edge.
 */
export async function getUnifiedRelationshipBySlug(
  supabase: DB,
  userId: string,
  cardSlug: string,
): Promise<UnifiedRelationshipView> {
  let target: { ownerUserId: string; cardId: string };
  try {
    target = await resolveProfileTarget(cardSlug);
  } catch {
    return composeUnifiedRelationship({ viewer: "authenticated", relationship: null });
  }

  const counterpart = await resolveCounterpart(supabase, target.ownerUserId).catch(() => null);

  if (target.ownerUserId === userId) {
    return composeUnifiedRelationship({ viewer: "self", relationship: null, counterpart });
  }

  // Owner-only saved edge (if any) for this counterpart card.
  const savedCards = await RelationshipService.list(supabase, userId).catch(
    () => [] as SavedCard[],
  );
  const savedEdge = savedCards.find((c) => c.targetCardId === target.cardId) ?? null;

  const relationship = await resolveRelationshipState(supabase, userId, target.ownerUserId, {
    savedCard: Boolean(savedEdge),
  });

  // Enrichment only when a saved edge exists (interactions/score are edge-scoped).
  const [interactions, score] = savedEdge
    ? await Promise.all([
        BusinessInteractionService.timeline(supabase, userId, savedEdge.id).catch(() => null),
        RelationshipService.relationshipScore(supabase, userId, target.cardId).catch(() => null),
      ])
    : [null, null];

  return composeUnifiedRelationship({
    viewer: "authenticated",
    relationship,
    savedCard: savedEdge,
    interactions,
    score,
    counterpart,
  });
}

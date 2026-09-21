// BC-3.1E — Pure composition for the Unified Relationship Read.
//
// This module is IO-free and deterministic: it takes already-resolved domain
// inputs and folds them into the single UnifiedRelationshipView. Keeping it pure
// makes the composition rules unit-testable without a database and guarantees
// the state-machine is NEVER duplicated — effective state flows from the
// authoritative connection state, with saved-card as the only local fallback.

import type { RelationshipState } from "./types";
import type { SavedCard, RelationshipScore } from "@/lib/business-card/relationship.types";
import type { InteractionTimeline } from "@/lib/business-card/interaction.types";
import type { CounterpartSummary } from "./types";
import type {
  UnifiedConnectionDTO,
  UnifiedCounterpartDTO,
  UnifiedEffectiveState,
  UnifiedInteractionSummary,
  UnifiedPrivateMetadata,
  UnifiedRelationshipView,
  UnifiedScore,
  UnifiedViewer,
} from "./unified-relationship.types";

export type UnifiedComposeInput = {
  viewer: UnifiedViewer;
  /** Authoritative relationship state from resolveRelationshipState (null for anon). */
  relationship: RelationshipState | null;
  /** Owner-only saved edge (null when the viewer has not saved this counterpart). */
  savedCard?: SavedCard | null;
  /** Owner-only interaction timeline (null when unavailable). */
  interactions?: InteractionTimeline | null;
  /** Owner-only deterministic score (null when unavailable). */
  score?: RelationshipScore | null;
  /** Privacy-safe public counterpart summary (null when unresolvable). */
  counterpart?: CounterpartSummary | null;
};

function toConnectionDTO(rel: RelationshipState): UnifiedConnectionDTO | undefined {
  if (!rel.globalConnection) return undefined;
  return {
    id: rel.globalConnection.id,
    status: rel.globalConnection.status,
    direction: rel.globalConnection.direction,
    requestedByCurrentUser: rel.globalConnection.requestedByCurrentUser,
  };
}

function toCounterpartDTO(c?: CounterpartSummary | null): UnifiedCounterpartDTO {
  if (!c) {
    return {
      displayName: null,
      headline: null,
      companyName: null,
      avatarUrl: null,
      primaryCardSlug: null,
      unavailable: true,
    };
  }
  return {
    displayName: c.displayName ?? null,
    headline: c.headline ?? null,
    companyName: c.companyName ?? null,
    avatarUrl: c.avatarUrl ?? null,
    primaryCardSlug: c.primaryCardSlug ?? null,
    unavailable: false,
  };
}

function toPrivateMetadata(card: SavedCard): UnifiedPrivateMetadata {
  return {
    favorite: card.favorite,
    tags: card.tags,
    labels: card.labels,
    notes: card.notes,
    importance: card.importance,
    priority: card.priority,
    savedAt: card.savedAt,
    firstMetAt: card.firstMetAt,
    lastContactAt: card.lastContactAt,
    lastViewedAt: card.lastViewedAt,
  };
}

function toInteractionSummary(t: InteractionTimeline): UnifiedInteractionSummary {
  return {
    total: t.total,
    countsByType: t.countsByType,
    lastOccurredAt: t.interactions[0]?.occurredAt ?? null,
  };
}

/** Map the 0–100 deterministic score to a coarse viewer-facing tier. */
function toScore(score: RelationshipScore): UnifiedScore {
  const tier: UnifiedScore["tier"] =
    score.value >= 66 ? "strong" : score.value >= 33 ? "warm" : "cold";
  return { value: score.value, tier };
}

/**
 * Fold resolved domain inputs into the single unified view. Deterministic and
 * IO-free. `effectiveState` is taken from the authoritative relationship state;
 * anonymous/self viewers short-circuit to their fixed states.
 */
export function composeUnifiedRelationship(input: UnifiedComposeInput): UnifiedRelationshipView {
  const counterpart = toCounterpartDTO(input.counterpart);

  if (input.viewer === "anonymous") {
    return { viewer: "anonymous", effectiveState: "anonymous", savedCard: false, counterpart };
  }
  if (input.viewer === "self") {
    return { viewer: "self", effectiveState: "self", savedCard: false, counterpart };
  }

  const rel = input.relationship;
  if (!rel) {
    return {
      viewer: "authenticated",
      effectiveState: "unavailable",
      savedCard: false,
      counterpart,
    };
  }

  const effectiveState = rel.effectiveState as UnifiedEffectiveState;
  const view: UnifiedRelationshipView = {
    viewer: "authenticated",
    effectiveState,
    savedCard: rel.savedCard,
    connection: toConnectionDTO(rel),
    counterpart,
  };

  // Owner-only enrichment: only present when the viewer owns a saved edge.
  if (input.savedCard) {
    view.privateMetadata = toPrivateMetadata(input.savedCard);
  }
  if (input.interactions) {
    view.interactions = toInteractionSummary(input.interactions);
  }
  if (input.score) {
    view.score = toScore(input.score);
  }

  return view;
}

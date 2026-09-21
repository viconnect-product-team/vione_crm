// BC-3.1E — Pure composition tests for the Unified Relationship Read.
// No IO: exercises composeUnifiedRelationship folding rules + privacy guarantees.

import { describe, it, expect } from "vitest";
import { composeUnifiedRelationship } from "@/lib/global-network/unified-relationship.compose";
import type { RelationshipState } from "@/lib/global-network/types";
import type { SavedCard, RelationshipScore } from "@/lib/business-card/relationship.types";
import type { InteractionTimeline } from "@/lib/business-card/interaction.types";
import type { CounterpartSummary } from "@/lib/global-network/types";

const counterpart: CounterpartSummary = {
  userId: "u-1",
  displayName: "Ada Lovelace",
  headline: "Founder",
  companyName: "Analytical Engines",
  avatarUrl: null,
  primaryCardSlug: "ada",
};

const connectedRel: RelationshipState = {
  savedCard: true,
  globalConnection: {
    id: "c-1",
    status: "accepted",
    requestedByCurrentUser: true,
    direction: "outgoing",
  },
  associationContexts: [],
  effectiveState: "connected",
};

const savedCard = {
  id: "edge-1",
  targetCardId: "card-1",
  savedAt: "2024-01-01T00:00:00Z",
  favorite: true,
  tags: ["vip"],
  notes: "met at expo",
  labels: ["investor"],
  importance: 4,
  priority: "high",
  firstMetAt: null,
  lastContactAt: "2024-02-01T00:00:00Z",
  lastViewedAt: null,
} as unknown as SavedCard;

const interactions: InteractionTimeline = {
  relationshipId: "edge-1",
  total: 2,
  countsByType: { meeting: 1, call: 1 },
  interactions: [
    { occurredAt: "2024-03-01T00:00:00Z" } as never,
    { occurredAt: "2024-02-01T00:00:00Z" } as never,
  ],
};

const score: RelationshipScore = { value: 72, tier: "strong", breakdown: {} };

describe("composeUnifiedRelationship", () => {
  it("anonymous viewer short-circuits and carries no private data", () => {
    const v = composeUnifiedRelationship({ viewer: "anonymous", relationship: null, counterpart });
    expect(v.effectiveState).toBe("anonymous");
    expect(v.privateMetadata).toBeUndefined();
    expect(v.interactions).toBeUndefined();
    expect(v.score).toBeUndefined();
  });

  it("self viewer resolves to self with public counterpart only", () => {
    const v = composeUnifiedRelationship({ viewer: "self", relationship: null, counterpart });
    expect(v.effectiveState).toBe("self");
    expect(v.counterpart.displayName).toBe("Ada Lovelace");
    expect(v.privateMetadata).toBeUndefined();
  });

  it("unresolved relationship maps to unavailable", () => {
    const v = composeUnifiedRelationship({ viewer: "authenticated", relationship: null });
    expect(v.effectiveState).toBe("unavailable");
    expect(v.counterpart.unavailable).toBe(true);
  });

  it("folds authoritative state + owner-only enrichment", () => {
    const v = composeUnifiedRelationship({
      viewer: "authenticated",
      relationship: connectedRel,
      savedCard,
      interactions,
      score,
      counterpart,
    });
    expect(v.effectiveState).toBe("connected");
    expect(v.connection?.status).toBe("accepted");
    expect(v.privateMetadata?.favorite).toBe(true);
    expect(v.privateMetadata?.tags).toEqual(["vip"]);
    expect(v.interactions?.total).toBe(2);
    expect(v.interactions?.lastOccurredAt).toBe("2024-03-01T00:00:00Z");
    expect(v.score).toEqual({ value: 72, tier: "strong" });
  });

  it("omits enrichment when no saved edge is present", () => {
    const v = composeUnifiedRelationship({
      viewer: "authenticated",
      relationship: { ...connectedRel, savedCard: false },
      savedCard: null,
      counterpart,
    });
    expect(v.savedCard).toBe(false);
    expect(v.privateMetadata).toBeUndefined();
  });

  it("derives coarse tiers from the deterministic score", () => {
    const warm = composeUnifiedRelationship({
      viewer: "authenticated",
      relationship: connectedRel,
      savedCard,
      score: { value: 40, tier: "active", breakdown: {} },
      counterpart,
    });
    expect(warm.score?.tier).toBe("warm");
    const cold = composeUnifiedRelationship({
      viewer: "authenticated",
      relationship: connectedRel,
      savedCard,
      score: { value: 10, tier: "dormant", breakdown: {} },
      counterpart,
    });
    expect(cold.score?.tier).toBe("cold");
  });
});

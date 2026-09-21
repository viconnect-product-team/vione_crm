import { describe, it, expect } from "vitest";
import {
  buildInteractionTimeline,
  mapRowToInteraction,
} from "@/lib/business-card/interaction.mappers";
import { computeRelationshipScore } from "@/lib/business-card/relationship-intelligence";
import { INTERACTION_TYPES, type BusinessInteraction } from "@/lib/business-card/interaction.types";
import type { RelationshipScoreSignals } from "@/lib/business-card/relationship.types";

// ---------------------------------------------------------------------------
// BC-2.6 — Business Interaction Platform (PURE).
// Verifies interaction row mapping, deterministic timeline building, and the
// interaction contribution to the deterministic relationship score.
// No live DB, no AI, no side effects.
// ---------------------------------------------------------------------------

function interaction(p: Partial<BusinessInteraction> & { id: string }): BusinessInteraction {
  return {
    id: p.id,
    relationshipId: p.relationshipId ?? "rel-1",
    type: p.type ?? "meeting",
    occurredAt: p.occurredAt ?? "2025-05-01T00:00:00Z",
    title: p.title ?? null,
    note: p.note ?? null,
    location: p.location ?? null,
    metadata: p.metadata ?? {},
    createdAt: p.createdAt ?? "2025-05-01T00:00:00Z",
    updatedAt: p.updatedAt ?? "2025-05-01T00:00:00Z",
  };
}

const baseSignals: RelationshipScoreSignals = {
  saved: true,
  favorite: false,
  hasNotes: false,
  viewCount: 0,
  shareCount: 0,
  meetingCount: 0,
  qrCount: 0,
  nfcCount: 0,
  walletCount: 0,
  tagCount: 0,
  importance: 0,
};

describe("BC-2.6 interaction mapper", () => {
  it("maps a raw row to a BusinessInteraction DTO", () => {
    const dto = mapRowToInteraction({
      id: "i1",
      relationship_id: "rel-9",
      interaction_type: "call",
      occurred_at: "2025-04-02T10:00:00Z",
      title: "Intro call",
      note: "Discussed partnership",
      location: "Zoom",
      metadata: { duration: 30 },
      created_at: "2025-04-02T10:05:00Z",
      updated_at: "2025-04-02T10:06:00Z",
    });
    expect(dto).toEqual({
      id: "i1",
      relationshipId: "rel-9",
      companyId: null,
      type: "call",
      occurredAt: "2025-04-02T10:00:00Z",
      title: "Intro call",
      note: "Discussed partnership",
      location: "Zoom",
      metadata: { duration: 30 },
      createdAt: "2025-04-02T10:05:00Z",
      updatedAt: "2025-04-02T10:06:00Z",
    });
  });

  it("falls back to 'other' for unknown types and empty metadata", () => {
    const dto = mapRowToInteraction({
      id: "i2",
      relationship_id: "rel-1",
      interaction_type: "chat", // not a valid type
      occurred_at: "2025-04-02T10:00:00Z",
      created_at: "2025-04-02T10:00:00Z",
    });
    expect(dto.type).toBe("other");
    expect(dto.metadata).toEqual({});
    expect(dto.title).toBeNull();
  });

  it("exposes all 16 canonical interaction types", () => {
    expect(INTERACTION_TYPES).toHaveLength(16);
    expect(INTERACTION_TYPES).toContain("contract");
    expect(INTERACTION_TYPES).toContain("follow_up");
  });
});

describe("BC-2.6 interaction timeline", () => {
  it("sorts newest first and counts by type", () => {
    const tl = buildInteractionTimeline("rel-1", [
      interaction({ id: "a", type: "meeting", occurredAt: "2025-01-01T00:00:00Z" }),
      interaction({ id: "b", type: "call", occurredAt: "2025-03-01T00:00:00Z" }),
      interaction({ id: "c", type: "meeting", occurredAt: "2025-02-01T00:00:00Z" }),
    ]);
    expect(tl.relationshipId).toBe("rel-1");
    expect(tl.total).toBe(3);
    expect(tl.interactions.map((i) => i.id)).toEqual(["b", "c", "a"]);
    expect(tl.countsByType).toEqual({ meeting: 2, call: 1 });
  });

  it("is deterministic and safe for an empty list", () => {
    const tl = buildInteractionTimeline("rel-x", []);
    expect(tl).toEqual({
      relationshipId: "rel-x",
      total: 0,
      countsByType: {},
      interactions: [],
    });
  });
});

describe("BC-2.6 interaction contribution to score", () => {
  it("raises the score deterministically with interactions", () => {
    const none = computeRelationshipScore({ ...baseSignals, interactionCount: 0 });
    const some = computeRelationshipScore({ ...baseSignals, interactionCount: 3 });
    expect(some.value).toBeGreaterThan(none.value);
    expect(some.breakdown.interaction).toBe(18); // 3 * 6
  });

  it("caps the interaction contribution", () => {
    const capped = computeRelationshipScore({ ...baseSignals, interactionCount: 999 });
    expect(capped.breakdown.interaction).toBe(36); // cap 6 * weight 6
  });

  it("is backward compatible when interactionCount is omitted", () => {
    const s = computeRelationshipScore(baseSignals);
    expect(s.breakdown.interaction).toBeUndefined();
    expect(s.value).toBe(8); // saved edge only
  });
});

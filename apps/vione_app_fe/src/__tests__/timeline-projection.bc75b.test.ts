// BC-7.5B — Relationship Timeline projection tests (framework-free).
//
// Verifies the mapping matrix covers the new Introduction Delivery,
// Introduction Outcome, and Business Meeting lifecycle event kinds, the
// pair-key derivation stays deterministic/unordered, and the DTO
// projection is stable for downstream consumers.

import { describe, expect, it } from "vitest";
import {
  canonicalPairKey,
  categoryFor,
  sourceFor,
  toRelationshipTimelineDTO,
  type RelationshipTimelineCategory,
} from "@/lib/graph/relationship-timeline";
import type { GraphTimelineEventDTO } from "@/lib/graph/timeline.types";

const NEW_INTRO_DELIVERY_KINDS = [
  "INTRO_DELIVERY_CREATED",
  "INTRO_DELIVERY_DELIVERED",
  "INTRO_DELIVERY_ACKNOWLEDGED",
  "INTRO_DELIVERY_DECLINED",
  "INTRO_DELIVERY_EXPIRED",
];
const NEW_INTRO_OUTCOME_KINDS = [
  "INTRO_OUTCOME_CREATED",
  "INTRO_OUTCOME_CONNECTED",
  "INTRO_OUTCOME_PROGRESSING",
  "INTRO_OUTCOME_CLOSED_SUCCESS",
  "INTRO_OUTCOME_CLOSED_NO_FIT",
  "INTRO_OUTCOME_CLOSED_LOST",
];
const NEW_MEETING_KINDS = [
  "MEETING_CREATED",
  "MEETING_PROPOSED",
  "MEETING_CONFIRMED",
  "MEETING_COMPLETED",
  "MEETING_CANCELLED",
  "MEETING_RESCHEDULED",
  "MEETING_DECLINED",
];

describe("BC-7.5B — projection mapping matrix", () => {
  it("maps every intro delivery kind to introduction category/source", () => {
    for (const k of NEW_INTRO_DELIVERY_KINDS) {
      expect(categoryFor(k)).toBe<RelationshipTimelineCategory>("introduction");
      expect(sourceFor(k)).toBe("introduction");
    }
  });
  it("maps every intro outcome kind to introduction category/source", () => {
    for (const k of NEW_INTRO_OUTCOME_KINDS) {
      expect(categoryFor(k)).toBe<RelationshipTimelineCategory>("introduction");
      expect(sourceFor(k)).toBe("introduction");
    }
  });
  it("maps every meeting lifecycle kind to meeting category/source", () => {
    for (const k of NEW_MEETING_KINDS) {
      expect(categoryFor(k)).toBe<RelationshipTimelineCategory>("meeting");
      expect(sourceFor(k)).toBe("meeting");
    }
  });
  it("unknown kinds fall back to 'other' / 'graph'", () => {
    expect(categoryFor("SOMETHING_ELSE")).toBe("other");
    expect(sourceFor("SOMETHING_ELSE")).toBe("graph");
  });
});

describe("BC-7.5B — pair key stays deterministic and unordered", () => {
  const a = "11111111-1111-1111-1111-111111111111";
  const b = "22222222-2222-2222-2222-222222222222";
  it("is symmetric", () => {
    expect(canonicalPairKey(a, b)).toBe(canonicalPairKey(b, a));
  });
  it("uses lexical order", () => {
    expect(canonicalPairKey(a, b)).toBe(`rel:${a}:${b}`);
  });
  it("nil / missing ids yield null", () => {
    expect(canonicalPairKey(null, b)).toBeNull();
    expect(canonicalPairKey(a, "00000000-0000-0000-0000-000000000000")).toBeNull();
  });
});

describe("BC-7.5B — DTO projection preserves visibility and summary key", () => {
  const row: GraphTimelineEventDTO = {
    id: "e1",
    eventKind: "INTRO_DELIVERY_DELIVERED",
    subjectNodeId: "n-inter",
    relatedNodeId: "n-target",
    edgeId: null,
    actorNodeId: "n-inter",
    visibility: "private",
    summaryKey: "graph.timeline.intro_delivery_delivered",
    metadata: { status: "delivered", targetPersonNodeId: "n-target" },
    occurredAt: "2026-01-01T00:00:00Z",
    dedupeKey: "outbox:xyz",
    collapseKey: null,
  };
  it("preserves visibility, summary key, occurredAt", () => {
    const dto = toRelationshipTimelineDTO(row);
    expect(dto.visibilityClass).toBe("private");
    expect(dto.summaryKey).toBe("graph.timeline.intro_delivery_delivered");
    expect(dto.occurredAt).toBe("2026-01-01T00:00:00Z");
    expect(dto.eventCategory).toBe("introduction");
    expect(dto.sourceDomain).toBe("introduction");
    expect(dto.relationshipId).toBe(canonicalPairKey("n-inter", "n-target"));
  });
});

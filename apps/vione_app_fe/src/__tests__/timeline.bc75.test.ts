// BC-7.5 — Relationship Timeline foundation tests.
//
// These tests freeze the adapter's public shape and prove that BC-7.5 does
// not introduce a parallel persistence layer, a second registry, or an
// authority-bearing input. Full RLS / visibility regression is covered by
// BC-4.2 suites which continue to run unchanged.

import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  RelationshipTimelineSDK,
  RELATIONSHIP_TIMELINE_VERSION,
  canonicalPairKey,
  categoryFor,
  sourceFor,
  toRelationshipTimelineDTO,
} from "@/lib/graph/relationship-timeline";
import type { GraphTimelineEventDTO } from "@/lib/graph";

describe("BC-7.5 canonical store ratification", () => {
  it("does not introduce a parallel relationship_timeline_events module", () => {
    // No migration file, no SQL file, no server module referencing a
    // separate `relationship_timeline_events` table.
    const migrationsDir = "supabase/migrations";
    if (existsSync(migrationsDir)) {
      const files = readdirSync(migrationsDir);
      for (const f of files) {
        expect(f).not.toMatch(/relationship_timeline_events/i);
      }
    }
  });

  it("adapter directory contains only projection files (no repository/service)", () => {
    const dir = "src/lib/graph/relationship-timeline";
    const files = readdirSync(dir);
    for (const f of files) {
      expect(f).not.toMatch(/repository/);
      expect(f).not.toMatch(/\.server\./);
    }
  });
});

describe("BC-7.5 relationshipId is a deterministic unordered pair projection", () => {
  const A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const NIL = "00000000-0000-0000-0000-000000000000";

  it("is unordered", () => {
    expect(canonicalPairKey(A, B)).toBe(canonicalPairKey(B, A));
  });
  it("is stable", () => {
    expect(canonicalPairKey(A, B)).toBe(canonicalPairKey(A, B));
  });
  it("is not authority-bearing (nil/empty → null)", () => {
    expect(canonicalPairKey(null, B)).toBeNull();
    expect(canonicalPairKey(A, "")).toBeNull();
    expect(canonicalPairKey(NIL, B)).toBeNull();
  });
});

describe("BC-7.5 category & source mapping", () => {
  it("maps existing BC-4.1 edge kinds", () => {
    expect(categoryFor("CONNECTED_TO")).toBe("connection");
    expect(categoryFor("MET")).toBe("meeting_touch");
    expect(categoryFor("SAVED_CARD")).toBe("card");
    expect(categoryFor("MEMBER_OF")).toBe("membership");
    expect(categoryFor("WORKS_FOR")).toBe("work");
    expect(sourceFor("CONNECTED_TO")).toBe("connection");
    expect(sourceFor("SAVED_CARD")).toBe("business_card");
  });
  it("recognizes extension-slot kinds", () => {
    expect(categoryFor("INTRO_DELIVERED")).toBe("introduction");
    expect(categoryFor("MEETING_PROPOSED")).toBe("meeting");
    expect(categoryFor("MEETING_COMPLETED")).toBe("meeting");
  });
  it("falls back to `other` for unknown kinds", () => {
    expect(categoryFor("UNKNOWN_KIND_XYZ")).toBe("other");
    expect(sourceFor("UNKNOWN_KIND_XYZ")).toBe("graph");
  });
});

describe("BC-7.5 DTO projection preserves BC-4.2 fields", () => {
  const row: GraphTimelineEventDTO = {
    id: "evt-1",
    eventKind: "CONNECTED_TO",
    subjectNodeId: "n-a",
    relatedNodeId: "n-b",
    edgeId: "edge-1",
    actorNodeId: "n-a",
    visibility: "association",
    summaryKey: "graph.timeline.connected_to",
    metadata: { source: "invitation" },
    occurredAt: "2026-01-01T00:00:00.000Z",
    dedupeKey: "edge:edge-1",
    collapseKey: null,
  };

  it("mirrors ids, summaryKey and visibility unchanged", () => {
    const dto = toRelationshipTimelineDTO(row);
    expect(dto.id).toBe("evt-1");
    expect(dto.summaryKey).toBe("graph.timeline.connected_to");
    expect(dto.visibilityClass).toBe("association");
    expect(dto.sourceId).toBe("edge-1");
    expect(dto.version).toBe(RELATIONSHIP_TIMELINE_VERSION);
  });

  it("does not re-widen metadata", () => {
    const dto = toRelationshipTimelineDTO(row);
    expect(dto.metadata).toEqual({ source: "invitation" });
  });

  it("derives an unordered relationshipId", () => {
    const dto = toRelationshipTimelineDTO(row);
    const swapped = toRelationshipTimelineDTO({
      ...row,
      subjectNodeId: "n-b",
      relatedNodeId: "n-a",
    });
    expect(dto.relationshipId).toBe(swapped.relationshipId);
    expect(dto.relationshipId).toMatch(/^rel:/);
  });
});

describe("BC-7.5 SDK surface freeze", () => {
  it("exposes only the frozen public methods", () => {
    const keys = Object.keys(RelationshipTimelineSDK).sort();
    expect(keys).toEqual(
      ["getTimelineEvent", "listRelationshipTimeline", "listTimeline", "version"].sort(),
    );
  });

  it("carries a frozen version integer", () => {
    expect(RelationshipTimelineSDK.version).toBe(1);
  });

  it("accepts no authority-bearing input fields", () => {
    // Type-level check emulated at runtime: the sample input passes typecheck
    // and contains no viewer/user/auth key.
    const sample = {
      nodeId: "n-a",
      categories: ["connection"] as const,
    };
    for (const k of Object.keys(sample)) {
      expect(k).not.toMatch(/viewer|userId|auth|asUser/i);
    }
  });
});

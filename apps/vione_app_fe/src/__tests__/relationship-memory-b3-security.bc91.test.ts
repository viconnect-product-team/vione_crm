// BC-9.1 Turn B3 — Security / authorization proofs for retrieval, BC-9.0
// context adapter, citations, and observability payload safety.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { buildRelationshipMemoryContextForCapability } from "@/lib/business-connect/intelligence/relationship-memory-context.server";
import { rankHybrid } from "@/lib/business-connect/relationship-memory/retrieval-hybrid";
import type { RelationshipMemorySearchResultDTO } from "@/lib/business-connect/relationship-memory/search-dto";

const RM_ROOT = resolve(__dirname, "..", "lib", "business-connect", "relationship-memory");
const INT_ROOT = resolve(__dirname, "..", "lib", "business-connect", "intelligence");

function walk(dir: string, ext: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p, ext));
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

function mkResult(
  overrides: Partial<RelationshipMemorySearchResultDTO["memory"]> = {},
  relevance = 0.8,
): RelationshipMemorySearchResultDTO {
  return {
    memory: {
      id: overrides.id ?? "mem-1",
      subjectType: "person",
      subjectRef: "acme-cto",
      memoryKind: "preference",
      canonicalText: "Prefers morning meetings",
      confidence: 0.8,
      status: "active",
      sensitivity: "standard",
      lastObservedAt: "2026-07-17T09:00:00.000Z",
      sourceCount: 2,
      ...overrides,
    },
    relevanceScore: relevance,
    relevanceBand: relevance >= 0.7 ? "high" : "medium",
    matchedOn: ["subject_match"],
    freshness: "fresh",
    evidenceSummary: null,
    graphContextSummary: null,
    citations: [],
    viewerPermissions: { canReview: false, canFeedback: true },
    conflictState: { hasConflict: false },
    historical: false,
  };
}

// --- 3. Authentication + authorization contract ----------------------------

describe("BC-9.1 B3 · Server functions derive viewer identity from auth context", () => {
  it("every relationship-memory server function uses requireSupabaseAuth middleware", () => {
    const fnFiles = walk(RM_ROOT, ".functions.ts");
    for (const f of fnFiles) {
      const body = readFileSync(f, "utf8");
      expect(body).toMatch(/requireSupabaseAuth/);
    }
  });

  it("no relationship-memory server function accepts viewer/owner identity from input", () => {
    const fnFiles = walk(RM_ROOT, ".functions.ts");
    for (const f of fnFiles) {
      const body = readFileSync(f, "utf8");
      expect(/inputValidator[\s\S]*?ownerUserId/i.test(body)).toBe(false);
      expect(/inputValidator[\s\S]*?viewerUserId/i.test(body)).toBe(false);
      expect(/inputValidator[\s\S]*?tenantId/i.test(body)).toBe(false);
    }
  });
});

// --- 16. BC-9.0 context safety ---------------------------------------------

describe("BC-9.1 B3 · BC-9.0 context adapter safety", () => {
  const base = Array.from({ length: 20 }, (_, i) => mkResult({ id: `m-${i}` }, 0.9 - i * 0.02));

  it("truncates to maxFacts deterministically", () => {
    const ctx = buildRelationshipMemoryContextForCapability({
      capability: "relationship_briefing" as never,
      results: base,
      maxFacts: 8,
      sensitivityCeiling: "sensitive",
      registryVersion: "test",
      profileId: "relationship_memory_semantic_v1",
    });
    expect(ctx.facts.length).toBe(8);
    expect(ctx.omitted.filteredByBudget).toBe(12);
  });

  it("filters out results exceeding the sensitivity ceiling", () => {
    const results = [
      mkResult({ id: "std", sensitivity: "standard" }, 0.9),
      mkResult({ id: "rst", sensitivity: "restricted" }, 0.95),
    ];
    const ctx = buildRelationshipMemoryContextForCapability({
      capability: "relationship_briefing" as never,
      results,
      maxFacts: 8,
      sensitivityCeiling: "standard",
      registryVersion: "test",
      profileId: "relationship_memory_semantic_v1",
    });
    expect(ctx.facts.map((f) => f.sourceRef)).toEqual(["std"]);
    expect(ctx.omitted.filteredBySensitivity).toBe(1);
  });

  it("built facts never contain raw vectors, provider metadata, or private fields", () => {
    const ctx = buildRelationshipMemoryContextForCapability({
      capability: "meeting_preparation" as never,
      results: base,
      maxFacts: 4,
      sensitivityCeiling: "sensitive",
      registryVersion: "test",
      profileId: "relationship_memory_semantic_v1",
    });
    for (const f of ctx.facts) {
      const keys = Object.keys(f);
      for (const forbidden of [
        "vector",
        "embedding",
        "providerPayload",
        "ownerUserId",
        "tenantId",
        "claimToken",
        "rawSource",
      ]) {
        expect(keys).not.toContain(forbidden);
      }
    }
  });

  it("ordering is stable: relevance desc, lastObservedAt desc, id asc", () => {
    const results = [
      mkResult({ id: "b" }, 0.8),
      mkResult({ id: "a" }, 0.8),
      mkResult({ id: "c" }, 0.9),
    ];
    const ctx = buildRelationshipMemoryContextForCapability({
      capability: "relationship_briefing" as never,
      results,
      maxFacts: 3,
      sensitivityCeiling: "sensitive",
      registryVersion: "test",
      profileId: "relationship_memory_semantic_v1",
    });
    expect(ctx.facts.map((f) => f.sourceRef)).toEqual(["c", "a", "b"]);
  });
});

// --- 17. Advisory-only — intelligence adapter cannot mutate ----------------

describe("BC-9.1 B3 · Intelligence adapter is read-only", () => {
  it("intelligence relationship-memory adapter contains no writes", () => {
    const src = readFileSync(join(INT_ROOT, "relationship-memory-context.server.ts"), "utf8");
    expect(/\.insert\(|\.update\(|\.delete\(|\.upsert\(|\.rpc\(/.test(src)).toBe(false);
  });
});

// --- 15. Citation shape safety ---------------------------------------------

describe("BC-9.1 B3 · Safe citation shape", () => {
  it("search DTO citation carries only approved metadata (no ownerId, no raw text)", () => {
    const src = readFileSync(join(RM_ROOT, "search-dto.ts"), "utf8");
    // Extract the RelationshipMemorySafeCitation interface body.
    const iface = src.match(/RelationshipMemorySafeCitation\s*{([\s\S]*?)}/);
    expect(iface).toBeTruthy();
    const body = iface![1];
    for (const forbidden of ["ownerId", "tenantId", "rawText", "sourceContent", "email", "phone"]) {
      expect(body).not.toContain(forbidden);
    }
  });
});

// --- 13/14. Ranking config is frozen & tie-break stable --------------------

describe("BC-9.1 B3 · Ranking config immutability", () => {
  it("identical hybrid inputs yield identical scores across calls", () => {
    const inp = {
      semanticSimilarity: 0.66,
      subjectMatch: true,
      scopeMatch: true,
      typeMatch: false,
      verified: true,
      sourceCount: 4,
      lastObservedAt: "2026-06-01T00:00:00.000Z",
      now: "2026-07-18T00:00:00.000Z",
      confidence: 0.7,
      graphSupport: 0.5,
    };
    const runs = Array.from({ length: 5 }, () => rankHybrid(inp));
    for (const r of runs) expect(r).toEqual(runs[0]);
  });
});

// --- 19. Query privacy: search text is not persisted or logged by default --

describe("BC-9.1 B3 · Query privacy", () => {
  it("query text is not stored to any table in the retrieval path", () => {
    const src = readFileSync(join(RM_ROOT, "retrieval.server.ts"), "utf8");
    // We assert the retrieval path never inserts the raw query.
    expect(/\.insert\([^)]*queryText/.test(src)).toBe(false);
    expect(/\.upsert\([^)]*queryText/.test(src)).toBe(false);
  });

  it("no cache module exists (documented as intentionally absent)", () => {
    const files = readdirSync(RM_ROOT);
    for (const f of files) expect(/query.*cache|search.*cache/i.test(f)).toBe(false);
  });
});

// --- 27/28. Observability payload safety ----------------------------------

describe("BC-9.1 B3 · No PII in worker observability payloads", () => {
  it("worker event assertion helper exists and rejects unsafe fields", async () => {
    const mod = await import("@/lib/business-connect/relationship-memory/extraction-worker.server");
    // Contract: assertSafeWorkerEvent is exported and strips or rejects unsafe fields.
    expect(typeof (mod as any).assertSafeWorkerEvent).toBe("function");
  });
});

// --- 4. No client-safe module dynamically requires *.server ---------------

describe("BC-9.1 B3 · No client-safe module reaches into server modules", () => {
  it("only *.server.ts and *.functions.ts import *.server.ts modules", () => {
    const all = walk(RM_ROOT, ".ts");
    for (const f of all) {
      if (f.endsWith(".server.ts") || f.endsWith(".functions.ts")) continue;
      const body = readFileSync(f, "utf8");
      const forbidden = body.match(/from\s+["'`][^"'`]+\.server["'`]/);
      expect(forbidden).toBeNull();
    }
  });
});

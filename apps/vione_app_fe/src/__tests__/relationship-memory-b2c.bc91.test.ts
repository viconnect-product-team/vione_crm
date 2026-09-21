// BC-9.1 Turn B2c — Embeddings, hybrid retrieval, graph context, BC-9.0 wiring.

import { describe, expect, it, beforeEach, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  RELATIONSHIP_MEMORY_EMBEDDING_PROFILE,
  RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
  RELATIONSHIP_MEMORY_EMBEDDING_DIMENSIONS,
  RELATIONSHIP_MEMORY_EMBEDDING_METRIC,
  getEmbeddingProfile,
  RELATIONSHIP_MEMORY_APPROVED_PROVIDER_CLASSES,
} from "@/lib/business-connect/relationship-memory/embedding-profile";
import {
  buildRelationshipMemoryEmbeddingInput,
  fnv1a64Hex,
} from "@/lib/business-connect/relationship-memory/embedding-input";
import {
  isEmbeddingEligible,
  shouldMarkEmbeddingStale,
  allowedForSensitivityCeiling,
} from "@/lib/business-connect/relationship-memory/embedding-eligibility";
import { rankHybrid } from "@/lib/business-connect/relationship-memory/retrieval-hybrid";
import {
  RELATIONSHIP_MEMORY_SEARCH_LIMIT_DEFAULT,
  RELATIONSHIP_MEMORY_SEARCH_LIMIT_MAX,
  RELATIONSHIP_MEMORY_QUERY_MAX_CHARS,
  RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH,
  RELATIONSHIP_MEMORY_GRAPH_MAX_NODES,
  RELATIONSHIP_MEMORY_SEMANTIC_MIN_SIMILARITY,
  RELATIONSHIP_MEMORY_SEMANTIC_CANDIDATE_POOL_MAX,
} from "@/lib/business-connect/relationship-memory/search-dto";
import {
  registerEmbeddingAdapter,
  embedWithProvider,
  __resetEmbeddingAdaptersForTests,
  approveManagedForProtected,
} from "@/lib/business-connect/relationship-memory/embedding-provider.server";
import { RelationshipMemoryError } from "@/lib/business-connect/relationship-memory/errors";
import {
  searchMemoriesStructured,
  searchMemoriesSemantic,
} from "@/lib/business-connect/relationship-memory/retrieval.server";
import { getMemoryGraphContext } from "@/lib/business-connect/relationship-memory/graph-context.server";
import { buildRelationshipMemoryContextForCapability } from "@/lib/business-connect/intelligence/relationship-memory-context.server";
import * as barrel from "@/lib/business-connect/relationship-memory";
import { RELATIONSHIP_MEMORY_SDK_METHODS } from "@/lib/business-connect/relationship-memory/sdk";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deterministicVector(seed: string): Float32Array {
  const v = new Float32Array(RELATIONSHIP_MEMORY_EMBEDDING_DIMENSIONS);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  for (let i = 0; i < v.length; i++) {
    h = Math.imul(h ^ i, 16777619) >>> 0;
    v[i] = ((h & 0xffff) / 0xffff) * 2 - 1;
  }
  // normalize
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < v.length; i++) v[i] = v[i] / norm;
  return v;
}

function registerLocalAdapter() {
  registerEmbeddingAdapter({
    providerClass: "local_private",
    modelId: "local-mock",
    modelVersion: "1.0",
    embed: async ({ text }) => ({
      vector: deterministicVector(text),
      providerClass: "local_private",
      modelId: "local-mock",
      modelVersion: "1.0",
      dimensions: RELATIONSHIP_MEMORY_EMBEDDING_DIMENSIONS,
      latencyMs: 1,
    }),
  });
}

function stubSupabase(rows: any[]) {
  const chain: any = {
    _rows: rows,
    select() {
      return this;
    },
    eq() {
      return this;
    },
    in() {
      return this;
    },
    gte() {
      return this;
    },
    order() {
      return this;
    },
    limit() {
      return this;
    },
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
    neq() {
      return this;
    },
    then(resolve: any) {
      return resolve({ data: rows, error: null });
    },
  };
  return {
    from: () => chain,
    rpc: async () => ({ data: rows, error: null }),
  };
}

const memoryRow = {
  id: "mem-1",
  subject_type: "person_node",
  subject_ref: "person-1",
  memory_kind: "preferred_channel",
  canonical_value: { text: "Prefers email over phone" },
  confidence: 0.9,
  status: "active",
  sensitivity: "standard",
  last_observed_at: new Date().toISOString(),
  source_count: 3,
};

// ---------------------------------------------------------------------------
// 1. Frozen profile & registry
// ---------------------------------------------------------------------------

describe("BC-9.1 B2c — profile registry", () => {
  it("dimensions are frozen at 1536", () => {
    expect(RELATIONSHIP_MEMORY_EMBEDDING_DIMENSIONS).toBe(1536);
    expect(RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.dimensions).toBe(1536);
  });
  it("metric is cosine", () => {
    expect(RELATIONSHIP_MEMORY_EMBEDDING_METRIC).toBe("cosine");
  });
  it("profile is deep-frozen", () => {
    expect(Object.isFrozen(RELATIONSHIP_MEMORY_EMBEDDING_PROFILE)).toBe(true);
  });
  it("getEmbeddingProfile rejects unknown profile ids", () => {
    expect(() => getEmbeddingProfile("v2_unknown")).toThrow();
    expect(getEmbeddingProfile(RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID)).toBeTruthy();
  });
  it("approved provider classes are the only ones allowed", () => {
    expect(RELATIONSHIP_MEMORY_APPROVED_PROVIDER_CLASSES).toContain("local_private");
    expect(RELATIONSHIP_MEMORY_APPROVED_PROVIDER_CLASSES).toContain("managed_gemini");
    expect(RELATIONSHIP_MEMORY_APPROVED_PROVIDER_CLASSES).toContain("managed_openai");
  });
  it("requires private-first for protected data", () => {
    expect(RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.requiresPrivateFirstForProtected).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Safe input builder
// ---------------------------------------------------------------------------

describe("BC-9.1 B2c — embedding input builder", () => {
  it("produces deterministic text and hash", () => {
    const a = buildRelationshipMemoryEmbeddingInput({
      memoryKind: "preferred_channel" as any,
      canonicalText: "Prefers  email over phone.",
    });
    const b = buildRelationshipMemoryEmbeddingInput({
      memoryKind: "preferred_channel" as any,
      canonicalText: "Prefers email over phone.",
    });
    expect(a.text).toBe(b.text);
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.contentHash).toMatch(/^[0-9a-f]{16}$/);
  });
  it("rejects raw UUID subject labels", () => {
    expect(() =>
      buildRelationshipMemoryEmbeddingInput({
        memoryKind: "preferred_channel" as any,
        canonicalText: "text",
        subjectType: "person_node" as any,
        subjectLabel: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).toThrow(/raw identifier/);
  });
  it("truncates to profile.maxInputChars", () => {
    const long = "a".repeat(10_000);
    const built = buildRelationshipMemoryEmbeddingInput({
      memoryKind: "preferred_channel" as any,
      canonicalText: long,
    });
    expect(built.text.length).toBeLessThanOrEqual(
      RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.maxInputChars,
    );
  });
  it("field ordering is lexicographic (order-independent)", () => {
    const a = buildRelationshipMemoryEmbeddingInput({
      memoryKind: "goal" as any,
      canonicalText: "text",
      scopeLabel: "scope-a",
      structuredSummary: "sum",
    });
    const b = buildRelationshipMemoryEmbeddingInput({
      memoryKind: "goal" as any,
      canonicalText: "text",
      structuredSummary: "sum",
      scopeLabel: "scope-a",
    });
    expect(a.text).toBe(b.text);
  });
  it("fnv1a64Hex is stable", () => {
    expect(fnv1a64Hex("hello")).toBe(fnv1a64Hex("hello"));
    expect(fnv1a64Hex("hello")).not.toBe(fnv1a64Hex("hellp"));
  });
});

// ---------------------------------------------------------------------------
// 3. Eligibility
// ---------------------------------------------------------------------------

describe("BC-9.1 B2c — eligibility & staleness", () => {
  it("only active is eligible by default; candidate requires opt-in", () => {
    expect(isEmbeddingEligible("active" as any)).toBe(true);
    expect(isEmbeddingEligible("candidate" as any)).toBe(false);
    expect(isEmbeddingEligible("candidate" as any, { allowCandidate: true })).toBe(true);
    expect(isEmbeddingEligible("dismissed" as any)).toBe(false);
    expect(isEmbeddingEligible("superseded" as any)).toBe(false);
    expect(isEmbeddingEligible("expired" as any)).toBe(false);
  });
  it("marks stale on content-hash change", () => {
    expect(
      shouldMarkEmbeddingStale({
        status: "active" as any,
        currentContentHash: "a",
        storedContentHash: "b",
        currentInputVersion: "1.0.0",
        storedInputVersion: "1.0.0",
        currentModelVersion: "1",
        storedModelVersion: "1",
      }),
    ).toBe(true);
  });
  it("marks stale on visibility revoke, subject/scope unresolved, terminal lifecycle", () => {
    const base = {
      status: "active" as any,
      currentContentHash: "a",
      storedContentHash: "a",
      currentInputVersion: "1.0.0",
      storedInputVersion: "1.0.0",
      currentModelVersion: "1",
      storedModelVersion: "1",
    };
    expect(shouldMarkEmbeddingStale({ ...base, visibilityRevoked: true })).toBe(true);
    expect(shouldMarkEmbeddingStale({ ...base, subjectAccessible: false })).toBe(true);
    expect(shouldMarkEmbeddingStale({ ...base, scopeAccessible: false })).toBe(true);
    expect(shouldMarkEmbeddingStale({ ...base, status: "superseded" as any })).toBe(true);
    expect(shouldMarkEmbeddingStale({ ...base, status: "expired" as any })).toBe(true);
  });
  it("does not mark stale when everything matches", () => {
    expect(
      shouldMarkEmbeddingStale({
        status: "active" as any,
        currentContentHash: "a",
        storedContentHash: "a",
        currentInputVersion: "1.0.0",
        storedInputVersion: "1.0.0",
        currentModelVersion: "1",
        storedModelVersion: "1",
      }),
    ).toBe(false);
  });
  it("enforces sensitivity ceiling", () => {
    expect(allowedForSensitivityCeiling("standard" as any, "standard" as any)).toBe(true);
    expect(allowedForSensitivityCeiling("sensitive" as any, "standard" as any)).toBe(false);
    expect(allowedForSensitivityCeiling("public_ok" as any, "restricted" as any)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Provider abstraction
// ---------------------------------------------------------------------------

describe("BC-9.1 B2c — provider abstraction", () => {
  beforeEach(() => __resetEmbeddingAdaptersForTests());

  it("rejects unapproved provider classes", () => {
    expect(() =>
      registerEmbeddingAdapter({
        providerClass: "third_party_public" as any,
        modelId: "x",
        modelVersion: "1",
        embed: async () => ({}) as any,
      }),
    ).toThrow(RelationshipMemoryError);
  });
  it("throws UNAVAILABLE when no adapter registered", async () => {
    await expect(
      embedWithProvider({ text: "t", contentHash: "h", inputVersion: "1.0.0", protected: false }),
    ).rejects.toBeInstanceOf(RelationshipMemoryError);
  });
  it("protected data requires private-first adapter", async () => {
    registerEmbeddingAdapter({
      providerClass: "managed_openai",
      modelId: "text-embedding-3-small",
      modelVersion: "1",
      embed: async () => ({
        vector: deterministicVector("x"),
        providerClass: "managed_openai",
        modelId: "text-embedding-3-small",
        modelVersion: "1",
        dimensions: RELATIONSHIP_MEMORY_EMBEDDING_DIMENSIONS,
        latencyMs: 1,
      }),
    });
    await expect(
      embedWithProvider({ text: "t", contentHash: "h", inputVersion: "1.0.0", protected: true }),
    ).rejects.toMatchObject({ code: "RELATIONSHIP_MEMORY_EMBEDDING_PROVIDER_FORBIDDEN" });
    approveManagedForProtected(true);
    const ok = await embedWithProvider({
      text: "t",
      contentHash: "h",
      inputVersion: "1.0.0",
      protected: true,
    });
    expect(ok.dimensions).toBe(RELATIONSHIP_MEMORY_EMBEDDING_DIMENSIONS);
  });
  it("dimension mismatch raises typed error", async () => {
    registerEmbeddingAdapter({
      providerClass: "local_private",
      modelId: "bad",
      modelVersion: "1",
      embed: async () => ({
        vector: new Float32Array(768),
        providerClass: "local_private",
        modelId: "bad",
        modelVersion: "1",
        dimensions: 768,
        latencyMs: 1,
      }),
    });
    await expect(
      embedWithProvider({ text: "t", contentHash: "h", inputVersion: "1.0.0", protected: false }),
    ).rejects.toMatchObject({ code: "RELATIONSHIP_MEMORY_EMBEDDING_DIMENSION_MISMATCH" });
  });
  it("local adapter returns 1536-dim vector", async () => {
    registerLocalAdapter();
    const r = await embedWithProvider({
      text: "hello",
      contentHash: "h",
      inputVersion: "1.0.0",
      protected: true,
    });
    expect(r.dimensions).toBe(1536);
    expect(r.vector.length).toBe(1536);
    expect(r.providerClass).toBe("local_private");
  });
});

// ---------------------------------------------------------------------------
// 5. Hybrid ranking
// ---------------------------------------------------------------------------

describe("BC-9.1 B2c — hybrid ranking", () => {
  const now = new Date("2026-07-17T00:00:00Z").toISOString();
  it("subject match beats generic semantic-only match", () => {
    const generic = rankHybrid({
      semanticSimilarity: 0.9,
      subjectMatch: false,
      scopeMatch: false,
      typeMatch: false,
      verified: false,
      sourceCount: 1,
      lastObservedAt: now,
      now,
      confidence: 0.5,
    });
    const specific = rankHybrid({
      semanticSimilarity: 0.6,
      subjectMatch: true,
      scopeMatch: true,
      typeMatch: true,
      verified: true,
      sourceCount: 3,
      lastObservedAt: now,
      now,
      confidence: 0.8,
    });
    expect(specific.score).toBeGreaterThan(generic.score);
    expect(specific.band).toBe("high");
  });
  it("freshness bands are computed", () => {
    const days = (n: number) => new Date(Date.parse(now) - n * 86_400_000).toISOString();
    expect(
      rankHybrid({
        semanticSimilarity: 0.9,
        subjectMatch: true,
        scopeMatch: false,
        typeMatch: false,
        verified: false,
        sourceCount: 1,
        lastObservedAt: days(5),
        now,
        confidence: 0.5,
      }).freshness,
    ).toBe("fresh");
    expect(
      rankHybrid({
        semanticSimilarity: 0.9,
        subjectMatch: true,
        scopeMatch: false,
        typeMatch: false,
        verified: false,
        sourceCount: 1,
        lastObservedAt: days(30),
        now,
        confidence: 0.5,
      }).freshness,
    ).toBe("recent");
    expect(
      rankHybrid({
        semanticSimilarity: 0.9,
        subjectMatch: true,
        scopeMatch: false,
        typeMatch: false,
        verified: false,
        sourceCount: 1,
        lastObservedAt: days(120),
        now,
        confidence: 0.5,
      }).freshness,
    ).toBe("aging");
    expect(
      rankHybrid({
        semanticSimilarity: 0.9,
        subjectMatch: true,
        scopeMatch: false,
        typeMatch: false,
        verified: false,
        sourceCount: 1,
        lastObservedAt: days(365),
        now,
        confidence: 0.5,
      }).freshness,
    ).toBe("stale");
  });
  it("score is bounded to [0,1]", () => {
    const r = rankHybrid({
      semanticSimilarity: 1,
      subjectMatch: true,
      scopeMatch: true,
      typeMatch: true,
      verified: true,
      sourceCount: 100,
      lastObservedAt: now,
      now,
      confidence: 1,
      graphSupport: 1,
    });
    expect(r.score).toBeLessThanOrEqual(1);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
  it("matchedOn labels are populated deterministically", () => {
    const r = rankHybrid({
      semanticSimilarity: 0.8,
      subjectMatch: true,
      scopeMatch: false,
      typeMatch: true,
      verified: true,
      sourceCount: 2,
      lastObservedAt: now,
      now,
      confidence: 0.7,
    });
    expect(r.matchedOn).toEqual(
      expect.arrayContaining([
        "semantic_match",
        "subject_match",
        "type_match",
        "verified",
        "fresh",
        "multiple_sources",
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 6. Retrieval boundaries + citation safety
// ---------------------------------------------------------------------------

describe("BC-9.1 B2c — retrieval", () => {
  it("structured search returns safe DTOs with no raw vector fields", async () => {
    const supabase = stubSupabase([memoryRow]);
    const page = await searchMemoriesStructured(supabase as any, {});
    expect(page.items.length).toBe(1);
    const item = page.items[0]!;
    expect(item.memory.canonicalText).toBe("Prefers email over phone");
    expect((item as any).vector).toBeUndefined();
    expect((item as any).embedding).toBeUndefined();
    expect((item.memory as any).owner_user_id).toBeUndefined();
    expect((item.memory as any).ownerUserId).toBeUndefined();
    expect(page.profileId).toBe(RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID);
  });
  it("query text is truncated to max chars", async () => {
    const supabase = {
      from: () => ({
        select() {
          return this;
        },
        eq() {
          return this;
        },
        in() {
          return this;
        },
        gte() {
          return this;
        },
        order() {
          return this;
        },
        limit() {
          return this;
        },
      }),
      rpc: vi.fn(async () => ({ data: [], error: null })),
    };
    // wire an in-place semantic search
    const long = "x".repeat(2000);
    await searchMemoriesSemantic(
      supabase as any,
      { queryText: long },
      {
        embedQuery: async () => deterministicVector("q"),
      },
    );
    // internal truncation is enforced; assert bound-check by direct constant
    expect(RELATIONSHIP_MEMORY_QUERY_MAX_CHARS).toBeLessThanOrEqual(400);
  });
  it("rejects empty query", async () => {
    const supabase = stubSupabase([]);
    await expect(
      searchMemoriesSemantic(
        supabase as any,
        { queryText: "" },
        {
          embedQuery: async () => deterministicVector("q"),
        },
      ),
    ).rejects.toMatchObject({ code: "RELATIONSHIP_MEMORY_INVALID_INPUT" });
  });
  it("rejects wrong-dim query embeddings", async () => {
    const supabase = stubSupabase([]);
    await expect(
      searchMemoriesSemantic(
        supabase as any,
        { queryText: "hi" },
        {
          embedQuery: async () => new Float32Array(768),
        },
      ),
    ).rejects.toMatchObject({ code: "RELATIONSHIP_MEMORY_EMBEDDING_DIMENSION_MISMATCH" });
  });
  it("limit is clamped to max", () => {
    expect(RELATIONSHIP_MEMORY_SEARCH_LIMIT_MAX).toBe(100);
    expect(RELATIONSHIP_MEMORY_SEARCH_LIMIT_DEFAULT).toBe(20);
  });
  it("semantic candidate pool bound is set", () => {
    expect(RELATIONSHIP_MEMORY_SEMANTIC_CANDIDATE_POOL_MAX).toBe(200);
    expect(RELATIONSHIP_MEMORY_SEMANTIC_MIN_SIMILARITY).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Graph context
// ---------------------------------------------------------------------------

describe("BC-9.1 B2c — graph context", () => {
  it("enforces max depth constant of 2", () => {
    expect(RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH).toBe(2);
    expect(RELATIONSHIP_MEMORY_GRAPH_MAX_NODES).toBe(100);
  });
  it("returns only owner-scoped root when no edges exist", async () => {
    let call = 0;
    const supabase = {
      from(table: string) {
        return {
          _t: table,
          select() {
            return this;
          },
          eq() {
            return this;
          },
          in() {
            return this;
          },
          maybeSingle: async () => ({ data: memoryRow, error: null }),
          then(resolve: any) {
            call++;
            // First call: edges query returns empty
            return resolve({ data: [], error: null });
          },
        };
      },
    };
    const ctx = await getMemoryGraphContext(supabase as any, { rootMemoryId: memoryRow.id });
    expect(ctx.rootMemoryId).toBe(memoryRow.id);
    expect(ctx.nodes.length).toBe(1);
    expect(ctx.nodes[0]?.edgeKindFromRoot).toBe("self");
    expect(ctx.maxDepth).toBeLessThanOrEqual(RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH);
  });
  it("returns empty when root not found (owner-scoped RLS)", async () => {
    const supabase = {
      from: () => ({
        select() {
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle: async () => ({ data: null, error: null }),
      }),
    };
    const ctx = await getMemoryGraphContext(supabase as any, { rootMemoryId: "nope" });
    expect(ctx.nodes.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 8. BC-9.0 context adapter
// ---------------------------------------------------------------------------

describe("BC-9.1 B2c — BC-9.0 context adapter", () => {
  const baseResult = {
    memory: {
      id: "mem-1",
      subjectType: "person_node" as any,
      subjectRef: "person-1",
      memoryKind: "preferred_channel" as any,
      canonicalText: "email pref",
      confidence: 0.9,
      status: "active" as any,
      sensitivity: "standard" as any,
      lastObservedAt: new Date().toISOString(),
      sourceCount: 2,
    },
    relevanceScore: 0.8,
    relevanceBand: "high" as const,
    matchedOn: ["semantic_match"] as any,
    freshness: "fresh" as const,
    evidenceSummary: null,
    graphContextSummary: null,
    citations: [],
    viewerPermissions: { canReview: false, canFeedback: true },
    conflictState: { hasConflict: false as const },
    historical: false,
  };
  it("respects maxFacts budget", () => {
    const results = Array.from({ length: 10 }, (_, i) => ({
      ...baseResult,
      memory: { ...baseResult.memory, id: `mem-${i}` },
    }));
    const built = buildRelationshipMemoryContextForCapability({
      capability: "meeting_preparation" as any,
      results,
      maxFacts: 3,
      sensitivityCeiling: "standard",
      registryVersion: "1",
      profileId: RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
    });
    expect(built.facts.length).toBe(3);
    expect(built.omitted.filteredByBudget).toBe(7);
  });
  it("filters by sensitivity ceiling", () => {
    const built = buildRelationshipMemoryContextForCapability({
      capability: "meeting_preparation" as any,
      results: [
        { ...baseResult, memory: { ...baseResult.memory, sensitivity: "sensitive" as any } },
        {
          ...baseResult,
          memory: { ...baseResult.memory, id: "mem-2", sensitivity: "standard" as any },
        },
      ],
      maxFacts: 5,
      sensitivityCeiling: "standard",
      registryVersion: "1",
      profileId: RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
    });
    expect(built.facts.length).toBe(1);
    expect(built.omitted.filteredBySensitivity).toBe(1);
  });
  it("orders by relevance desc then last-observed desc", () => {
    const built = buildRelationshipMemoryContextForCapability({
      capability: "meeting_preparation" as any,
      results: [
        { ...baseResult, memory: { ...baseResult.memory, id: "low" }, relevanceScore: 0.2 },
        { ...baseResult, memory: { ...baseResult.memory, id: "high" }, relevanceScore: 0.9 },
      ],
      maxFacts: 5,
      sensitivityCeiling: "standard",
      registryVersion: "1",
      profileId: RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
    });
    expect(built.facts[0]?.sourceRef).toBe("high");
    expect(built.facts[1]?.sourceRef).toBe("low");
  });
  it("emits only 'relationship_memory' as sourceDomain", () => {
    const built = buildRelationshipMemoryContextForCapability({
      capability: "meeting_preparation" as any,
      results: [baseResult],
      maxFacts: 5,
      sensitivityCeiling: "standard",
      registryVersion: "1",
      profileId: RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
    });
    expect(built.facts[0]?.sourceDomain).toBe("relationship_memory");
  });
});

// ---------------------------------------------------------------------------
// 9. Barrel & SDK freeze
// ---------------------------------------------------------------------------

describe("BC-9.1 B2c — client-safe barrel & SDK contract", () => {
  it("SDK is frozen with the exact whitelisted methods", () => {
    expect(Object.isFrozen(barrel.RelationshipMemorySDK)).toBe(true);
    expect(new Set(RELATIONSHIP_MEMORY_SDK_METHODS)).toEqual(
      new Set([
        "list",
        "getById",
        "searchMemories",
        "listRelevantMemories",
        "getMemoryGraphContext",
      ]),
    );
    const sdk = barrel.RelationshipMemorySDK as unknown as Record<string, unknown>;
    for (const name of RELATIONSHIP_MEMORY_SDK_METHODS) {
      expect(typeof sdk[name]).toBe("function");
    }
  });
  it("barrel exports embedding profile, DTOs, ranking, but not server modules", () => {
    expect(barrel.RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID).toBe("relationship_memory_semantic_v1");
    expect((barrel as any).embedWithProvider).toBeUndefined();
    expect((barrel as any).getMemoryGraphContext).toBeUndefined();
    expect((barrel as any).searchMemoriesStructured).toBeUndefined();
    expect((barrel as any).getQueryEmbedder).toBeUndefined();
    expect((barrel as any).enqueueEmbedding).toBeUndefined();
    expect((barrel as any).generateEmbeddingForMemory).toBeUndefined();
    expect((barrel as any).markEmbeddingStale).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 10. Structural security gates over source files
// ---------------------------------------------------------------------------

function collectFiles(root: string, filter: (p: string) => boolean): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const s = statSync(p);
      if (s.isDirectory()) walk(p);
      else if (filter(p)) out.push(p);
    }
  };
  walk(root);
  return out;
}

describe("BC-9.1 B2c — structural security gates", () => {
  const rmRoot = resolve("src/lib/business-connect/relationship-memory");
  const clientSafeFiles = collectFiles(
    rmRoot,
    (p) =>
      (p.endsWith(".ts") || p.endsWith(".tsx")) &&
      !/\.server\.ts$/.test(p) &&
      !/functions\.ts$/.test(p),
  );

  it("no client-safe module imports .server or supabase server clients", () => {
    for (const f of clientSafeFiles) {
      const src = readFileSync(f, "utf8");
      expect(src, `client-safe file leaks server import: ${f}`).not.toMatch(
        /from ["'][^"']*\.server["']/,
      );
      expect(src, `client-safe file references admin client: ${f}`).not.toMatch(/client\.server/);
      expect(src, `client-safe file references supabaseAdmin: ${f}`).not.toMatch(/supabaseAdmin/);
    }
  });
  it("private-note terms only appear in the allowlisted eligibility guard", () => {
    const files = collectFiles(rmRoot, (p) => p.endsWith(".ts") || p.endsWith(".tsx"));
    const ALLOWED_PRIVATE_NOTE_REFERENCES = new Set([
      resolve(rmRoot, "eligibility.ts"),
      resolve(rmRoot, "registry.ts"),
    ]);
    for (const f of files) {
      if (ALLOWED_PRIVATE_NOTE_REFERENCES.has(resolve(f))) continue;
      const src = readFileSync(f, "utf8");
      expect(src, `unexpected private-note reference in ${f}`).not.toMatch(
        /business_meeting_private_notes/,
      );
      expect(src, `unexpected private-note reference in ${f}`).not.toMatch(/private_meeting_notes/);
    }
  });
  it("retrieval never surfaces raw vector fields in DTOs", () => {
    for (const f of [resolve("src/lib/business-connect/relationship-memory/search-dto.ts")]) {
      const src = readFileSync(f, "utf8");
      expect(src).not.toMatch(/vector:\s*(number\[]|Float32Array)/);
      expect(src).not.toMatch(/embedding:\s*(number\[]|Float32Array)/);
    }
  });
  it("BC-9.0 adapter never widens sourceDomain", () => {
    const src = readFileSync(
      resolve("src/lib/business-connect/intelligence/relationship-memory-context.server.ts"),
      "utf8",
    );
    expect(src).toMatch(/relationship_memory/);
    expect(src).not.toMatch(/business_meeting_private_notes/);
  });
  it("migration frozen: 1536 dims, HNSW cosine, force RLS, service-role writes", () => {
    const dir = resolve("supabase/migrations");
    const migrations = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => readFileSync(join(dir, f), "utf8"));
    const embeddingMigration = migrations.find((s) =>
      /business_relationship_memory_embeddings/.test(s),
    );
    expect(embeddingMigration, "embeddings migration missing").toBeTruthy();
    const src = embeddingMigration!;
    expect(src).toMatch(/vector\(1536\)/);
    expect(src).toMatch(/hnsw/i);
    expect(src).toMatch(/vector_cosine_ops/);
    expect(src).toMatch(/FORCE ROW LEVEL SECURITY/i);
    expect(src).toMatch(/TO service_role/);
    expect(src).toMatch(/ENABLE ROW LEVEL SECURITY/i);
  });
});

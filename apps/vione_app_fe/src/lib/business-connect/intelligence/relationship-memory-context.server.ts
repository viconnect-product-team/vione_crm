// BC-9.1 Turn B2c — Relationship-Memory → Intelligence context adapter.
//
// Server-only. Converts safe RelationshipMemory search results into the
// existing BusinessConnectSafeFact envelope shape so BC-9.0 capabilities
// can consume memory-derived facts through the same context pipeline.
//
// Private notes are structurally excluded upstream (search-dto only carries
// safe projections), and this adapter never widens scope.

import type { RelationshipMemorySearchResultDTO } from "@/lib/business-connect/relationship-memory/search-dto";
import { allowedForSensitivityCeiling } from "@/lib/business-connect/relationship-memory/embedding-eligibility";
import type { BusinessConnectAICapability } from "./registry";

export interface BuiltRelationshipMemoryContext {
  facts: ReadonlyArray<{
    factId: string;
    sourceDomain: "relationship_memory";
    sourceRef: string;
    summary: string;
    confidence: number;
    recordedAt: string;
    subjectType: string;
    subjectRef: string;
    memoryKind: string;
    relevanceScore: number;
    relevanceBand: "high" | "medium" | "low";
    freshness: "fresh" | "recent" | "aging" | "stale";
    historical: boolean;
  }>;
  omitted: {
    filteredBySensitivity: number;
    filteredByBudget: number;
  };
  registryVersion: string;
  profileId: string;
}

export function buildRelationshipMemoryContextForCapability(input: {
  capability: BusinessConnectAICapability;
  results: ReadonlyArray<RelationshipMemorySearchResultDTO>;
  maxFacts: number;
  sensitivityCeiling: "public_ok" | "standard" | "sensitive" | "restricted";
  registryVersion: string;
  profileId: string;
}): BuiltRelationshipMemoryContext {
  void input.capability;
  const facts: BuiltRelationshipMemoryContext["facts"] = [];
  let filteredBySensitivity = 0;
  let filteredByBudget = 0;

  // Deterministic ordering: relevance desc, then last observed desc, then id.
  const sorted = [...input.results].sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    if (a.memory.lastObservedAt !== b.memory.lastObservedAt)
      return a.memory.lastObservedAt < b.memory.lastObservedAt ? 1 : -1;
    return a.memory.id < b.memory.id ? -1 : 1;
  });

  for (const r of sorted) {
    if (!allowedForSensitivityCeiling(r.memory.sensitivity, input.sensitivityCeiling)) {
      filteredBySensitivity++;
      continue;
    }
    if (facts.length >= input.maxFacts) {
      filteredByBudget++;
      continue;
    }
    (facts as any[]).push({
      factId: `relationship_memory:${r.memory.id}`,
      sourceDomain: "relationship_memory" as const,
      sourceRef: r.memory.id,
      summary: r.memory.canonicalText,
      confidence: r.memory.confidence,
      recordedAt: r.memory.lastObservedAt,
      subjectType: r.memory.subjectType,
      subjectRef: r.memory.subjectRef,
      memoryKind: r.memory.memoryKind,
      relevanceScore: r.relevanceScore,
      relevanceBand: r.relevanceBand,
      freshness: r.freshness,
      historical: r.historical,
    });
  }

  return {
    facts,
    omitted: { filteredBySensitivity, filteredByBudget },
    registryVersion: input.registryVersion,
    profileId: input.profileId,
  };
}

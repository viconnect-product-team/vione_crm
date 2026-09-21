// BC-9.1 Turn B2c — Client-safe search DTOs.
//
// Never carry raw vectors, distance internals, owner/tenant IDs, hidden
// source IDs, provider secrets, or raw source content.

import type {
  RelationshipMemoryKind,
  RelationshipMemorySensitivity,
  RelationshipMemoryStatus,
  RelationshipMemorySubjectType,
  RelationshipMemoryAllowedSourceDomain,
} from "./registry";

export const RELATIONSHIP_MEMORY_SEARCH_LIMIT_DEFAULT = 20 as const;
export const RELATIONSHIP_MEMORY_SEARCH_LIMIT_MAX = 100 as const;
export const RELATIONSHIP_MEMORY_SEMANTIC_CANDIDATE_POOL_MAX = 200 as const;
export const RELATIONSHIP_MEMORY_SEMANTIC_MIN_SIMILARITY = 0.55 as const;
export const RELATIONSHIP_MEMORY_QUERY_MAX_CHARS = 400 as const;
export const RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH = 2 as const;
export const RELATIONSHIP_MEMORY_GRAPH_MAX_NODES = 100 as const;

export const RELATIONSHIP_MEMORY_MATCHED_ON_LABELS = [
  "semantic_match",
  "subject_match",
  "scope_match",
  "type_match",
  "verified",
  "fresh",
  "graph_supported",
  "multiple_sources",
] as const;
export type RelationshipMemoryMatchedOn = (typeof RELATIONSHIP_MEMORY_MATCHED_ON_LABELS)[number];

/** Safe citation reference — independent of internal source IDs. */
export interface RelationshipMemorySafeCitation {
  memoryRef: { id: string };
  sourceDomain: RelationshipMemoryAllowedSourceDomain;
  sourceLabel: string;
  occurredAt: string | null;
  freshnessBand: "fresh" | "recent" | "aging" | "stale";
  confidence: number;
  lifecycle: RelationshipMemoryStatus;
}

export interface RelationshipMemorySearchFilters {
  subject?: { type: RelationshipMemorySubjectType; ref: string };
  scope?: { type: string; ref: string };
  kinds?: ReadonlyArray<RelationshipMemoryKind>;
  minConfidence?: number;
  maxSensitivity?: RelationshipMemorySensitivity;
  /** Include only current lifecycle by default (active). */
  includeHistorical?: boolean;
  /** Explicitly opt into candidate memories. */
  includeCandidates?: boolean;
  /** Explicitly opt into conflict review mode. */
  conflictReview?: boolean;
  limit?: number;
}

export interface RelationshipMemorySemanticFilters extends RelationshipMemorySearchFilters {
  queryText: string;
}

export interface RelationshipMemorySearchResultDTO {
  memory: {
    id: string;
    subjectType: RelationshipMemorySubjectType;
    subjectRef: string;
    memoryKind: RelationshipMemoryKind;
    canonicalText: string;
    confidence: number;
    status: RelationshipMemoryStatus;
    sensitivity: RelationshipMemorySensitivity;
    lastObservedAt: string;
    sourceCount: number;
  };
  relevanceScore: number;
  relevanceBand: "high" | "medium" | "low";
  matchedOn: ReadonlyArray<RelationshipMemoryMatchedOn>;
  freshness: "fresh" | "recent" | "aging" | "stale";
  evidenceSummary: string | null;
  graphContextSummary: string | null;
  citations: ReadonlyArray<RelationshipMemorySafeCitation>;
  viewerPermissions: { canReview: boolean; canFeedback: boolean };
  conflictState: { hasConflict: false } | { hasConflict: true; peerMemoryId: string; note: string };
  historical: boolean;
}

export interface RelationshipMemorySearchPageDTO {
  items: ReadonlyArray<RelationshipMemorySearchResultDTO>;
  totalConsidered: number;
  registryVersion: string;
  profileId: string;
  truncated: boolean;
}

export interface RelationshipMemoryGraphContextDTO {
  rootMemoryId: string;
  nodes: ReadonlyArray<{
    memoryId: string;
    kind: RelationshipMemoryKind;
    subjectType: RelationshipMemorySubjectType;
    subjectRef: string;
    depth: number;
    edgeKindFromRoot: "self" | "supports" | "refines" | "contradicts" | "related";
  }>;
  truncated: boolean;
  nodeCount: number;
  maxDepth: number;
}

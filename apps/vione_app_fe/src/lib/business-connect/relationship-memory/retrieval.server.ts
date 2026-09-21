// BC-9.1 Turn B2c — Retrieval (server-only).
//
// Combines a structured predicate pass and an optional semantic pass, then
// applies deterministic hybrid ranking. All reads use the request-scoped
// client (RLS applies as the signed-in user). Vectors are never returned to
// callers. Query text is truncated and hashed before use.

import type {
  RelationshipMemorySearchFilters,
  RelationshipMemorySemanticFilters,
  RelationshipMemorySearchPageDTO,
  RelationshipMemorySearchResultDTO,
  RelationshipMemoryMatchedOn,
} from "./search-dto";
import {
  RELATIONSHIP_MEMORY_QUERY_MAX_CHARS,
  RELATIONSHIP_MEMORY_SEMANTIC_CANDIDATE_POOL_MAX,
  RELATIONSHIP_MEMORY_SEARCH_LIMIT_DEFAULT,
  RELATIONSHIP_MEMORY_SEARCH_LIMIT_MAX,
  RELATIONSHIP_MEMORY_SEMANTIC_MIN_SIMILARITY,
} from "./search-dto";
import { rankHybrid } from "./retrieval-hybrid";
import {
  RETRIEVAL_CURRENT_STATUSES,
  RETRIEVAL_NON_CURRENT_STATUSES,
  allowedForSensitivityCeiling,
} from "./embedding-eligibility";
import {
  RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
  RELATIONSHIP_MEMORY_EMBEDDING_PROFILE,
} from "./embedding-profile";
import { RelationshipMemoryError } from "./errors";
import { RELATIONSHIP_MEMORY_EXTRACTOR_REGISTRY_VERSION } from "./extractor-registry";
import type { RelationshipMemoryStatus } from "./registry";

type SupabaseLike = { from: (t: string) => any; rpc?: (f: string, a?: any) => any };

function truncateQuery(q: string): string {
  const norm = q.replace(/\s+/g, " ").trim();
  if (norm.length > RELATIONSHIP_MEMORY_QUERY_MAX_CHARS) {
    return norm.slice(0, RELATIONSHIP_MEMORY_QUERY_MAX_CHARS);
  }
  return norm;
}

function applyLimit(limit?: number): number {
  const n = limit ?? RELATIONSHIP_MEMORY_SEARCH_LIMIT_DEFAULT;
  if (!Number.isFinite(n) || n < 1) return RELATIONSHIP_MEMORY_SEARCH_LIMIT_DEFAULT;
  return Math.min(n, RELATIONSHIP_MEMORY_SEARCH_LIMIT_MAX);
}

/** Structured search over memories (no semantic). */
export async function searchMemoriesStructured(
  supabase: SupabaseLike,
  filters: RelationshipMemorySearchFilters,
): Promise<RelationshipMemorySearchPageDTO> {
  const limit = applyLimit(filters.limit);
  let q = supabase
    .from("business_relationship_memories")
    .select(
      [
        "id",
        "subject_type",
        "subject_ref",
        "memory_kind",
        "canonical_value",
        "confidence",
        "status",
        "sensitivity",
        "last_observed_at",
        "source_count",
      ].join(","),
    );

  if (filters.subject) {
    q = q.eq("subject_type", filters.subject.type).eq("subject_ref", filters.subject.ref);
  }
  if (filters.kinds && filters.kinds.length > 0) {
    q = q.in("memory_kind", filters.kinds as unknown as string[]);
  }
  if (typeof filters.minConfidence === "number") {
    q = q.gte("confidence", filters.minConfidence);
  }
  if (filters.includeHistorical) {
    // include current + non-current
  } else if (filters.includeCandidates) {
    q = q.in("status", ["active", "candidate"]);
  } else {
    q = q.in("status", RETRIEVAL_CURRENT_STATUSES as unknown as string[]);
  }
  q = q.order("last_observed_at", { ascending: false }).limit(limit);

  const { data, error } = await q;
  if (error) {
    throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_RETRIEVAL_FAILED", error.message);
  }
  const rows = (data ?? []) as any[];
  const now = new Date().toISOString();
  const items: RelationshipMemorySearchResultDTO[] = rows
    .filter((r) =>
      filters.maxSensitivity
        ? allowedForSensitivityCeiling(r.sensitivity, filters.maxSensitivity)
        : true,
    )
    .map((r: any) => shapeSearchResult(r, null, filters, now));

  return {
    items,
    totalConsidered: rows.length,
    registryVersion: RELATIONSHIP_MEMORY_EXTRACTOR_REGISTRY_VERSION,
    profileId: RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
    truncated: rows.length >= limit,
  };
}

export interface SemanticSearchDeps {
  /** Injectable query-embedder — server-only, private-first by default. */
  embedQuery(text: string): Promise<Float32Array>;
}

/** Hybrid semantic + structured search. */
export async function searchMemoriesSemantic(
  supabase: SupabaseLike,
  filters: RelationshipMemorySemanticFilters,
  deps: SemanticSearchDeps,
): Promise<RelationshipMemorySearchPageDTO> {
  const limit = applyLimit(filters.limit);
  const queryText = truncateQuery(filters.queryText ?? "");
  if (queryText.length === 0) {
    throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_INVALID_INPUT", "queryText is required");
  }
  const vector = await deps.embedQuery(queryText);
  if (vector.length !== RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.dimensions) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EMBEDDING_DIMENSION_MISMATCH",
      `query embedding dim=${vector.length}`,
    );
  }
  const literal = `[${Array.from(vector).join(",")}]`;

  const { data, error } = (await supabase.rpc?.("bc_rm_search_semantic_v1", {
    p_query: literal,
    p_limit: RELATIONSHIP_MEMORY_SEMANTIC_CANDIDATE_POOL_MAX,
    p_profile: RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
    p_min_similarity: RELATIONSHIP_MEMORY_SEMANTIC_MIN_SIMILARITY,
  })) ?? { data: [], error: null };
  if (error) {
    throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_RETRIEVAL_FAILED", error.message);
  }
  const now = new Date().toISOString();
  const rows = (data ?? []) as any[];
  const shaped = rows
    .filter((r) => {
      if (
        filters.maxSensitivity &&
        !allowedForSensitivityCeiling(r.sensitivity, filters.maxSensitivity)
      )
        return false;
      if (filters.kinds && filters.kinds.length > 0 && !filters.kinds.includes(r.memory_kind))
        return false;
      if (filters.subject) {
        if (r.subject_type !== filters.subject.type) return false;
        if (r.subject_ref !== filters.subject.ref) return false;
      }
      if (!filters.includeHistorical && RETRIEVAL_NON_CURRENT_STATUSES.includes(r.status))
        return false;
      return true;
    })
    .map((r: any) => shapeSearchResult(r, r.similarity ?? null, filters, now))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  return {
    items: shaped,
    totalConsidered: rows.length,
    registryVersion: RELATIONSHIP_MEMORY_EXTRACTOR_REGISTRY_VERSION,
    profileId: RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
    truncated: rows.length >= RELATIONSHIP_MEMORY_SEMANTIC_CANDIDATE_POOL_MAX,
  };
}

function shapeSearchResult(
  r: any,
  similarity: number | null,
  filters: RelationshipMemorySearchFilters,
  now: string,
): RelationshipMemorySearchResultDTO {
  const canonicalText: string =
    (r.canonical_value && typeof r.canonical_value === "object"
      ? String((r.canonical_value as any).text ?? (r.canonical_value as any).label ?? "")
      : "") || "";
  const subjectMatch =
    !!filters.subject &&
    r.subject_type === filters.subject.type &&
    r.subject_ref === filters.subject.ref;
  const scopeMatch = false;
  const typeMatch = !!filters.kinds && filters.kinds.includes(r.memory_kind as never);
  const verified = r.status === "active" && Number(r.source_count ?? 0) >= 2;

  const rank = rankHybrid({
    semanticSimilarity: similarity,
    subjectMatch,
    scopeMatch,
    typeMatch,
    verified,
    sourceCount: Number(r.source_count ?? 0),
    lastObservedAt: r.last_observed_at,
    now,
    confidence: Number(r.confidence ?? 0),
  });

  return {
    memory: {
      id: r.id,
      subjectType: r.subject_type,
      subjectRef: r.subject_ref,
      memoryKind: r.memory_kind,
      canonicalText,
      confidence: Number(r.confidence ?? 0),
      status: r.status as RelationshipMemoryStatus,
      sensitivity: r.sensitivity,
      lastObservedAt: r.last_observed_at,
      sourceCount: Number(r.source_count ?? 0),
    },
    relevanceScore: rank.score,
    relevanceBand: rank.band,
    matchedOn: rank.matchedOn as RelationshipMemoryMatchedOn[],
    freshness: rank.freshness,
    evidenceSummary: null,
    graphContextSummary: null,
    citations: [],
    viewerPermissions: { canReview: false, canFeedback: true },
    conflictState: { hasConflict: false },
    historical: RETRIEVAL_NON_CURRENT_STATUSES.includes(r.status as RelationshipMemoryStatus),
  };
}

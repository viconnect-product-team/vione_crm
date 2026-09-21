// BC-9.1 Turn C2 — Debounced, cancellable Relationship Memory search hook.
//
// Wraps the FROZEN read-only SDK. Never mutates. Query key is derived
// deterministically from normalized filters so identical filter sets share a
// cache entry; free-text is hashed (FNV-1a) so we do not leak PII into
// React-Query devtools or cross-tab storage.

import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData, type UseQueryOptions } from "@tanstack/react-query";
import {
  RelationshipMemorySDK,
  type RelationshipMemorySearchFilters,
  type RelationshipMemorySemanticFilters,
  type RelationshipMemorySearchPageDTO,
} from "@/lib/business-connect/relationship-memory";
import { RELATIONSHIP_MEMORY_QUERY_MAX_CHARS } from "@/lib/business-connect/relationship-memory/search-dto";
import { fnv1a64Hex } from "@/lib/business-connect/intelligence/persistence-hash";

const DEBOUNCE_MS = 250;
const STALE = 15_000;
const GC = 5 * 60_000;

export type MemorySearchInput = RelationshipMemorySearchFilters | RelationshipMemorySemanticFilters;

function isSemantic(f: MemorySearchInput): f is RelationshipMemorySemanticFilters {
  return (
    typeof (f as RelationshipMemorySemanticFilters).queryText === "string" &&
    (f as RelationshipMemorySemanticFilters).queryText.trim().length > 0
  );
}

/** Deterministic, low-cardinality query key. Free-text is hashed. */
export function memorySearchKey(filters: MemorySearchInput) {
  const q = isSemantic(filters)
    ? filters.queryText.trim().slice(0, RELATIONSHIP_MEMORY_QUERY_MAX_CHARS)
    : "";
  return [
    "bc",
    "relationship-memory",
    "search",
    q ? `q:${fnv1a64Hex(q)}` : "q:none",
    filters.subject?.type ?? null,
    filters.subject?.ref ?? null,
    [...(filters.kinds ?? [])].sort().join(",") || null,
    filters.minConfidence ?? null,
    filters.maxSensitivity ?? null,
    filters.includeHistorical ?? false,
    filters.includeCandidates ?? false,
    (filters as RelationshipMemorySearchFilters).conflictReview ?? false,
    filters.limit ?? null,
  ] as const;
}

/** Debounce a value so query text updates do not fire per keystroke. */
export function useDebounced<T>(value: T, delay = DEBOUNCE_MS): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function useRelationshipMemorySearch(
  filters: MemorySearchInput,
  options?: Omit<UseQueryOptions<RelationshipMemorySearchPageDTO>, "queryKey" | "queryFn">,
) {
  const stable = useMemo(
    () => filters,
    [
      // Structural deps — keeps referential stability without JSON.stringify.
      isSemantic(filters) ? filters.queryText : "",
      filters.subject?.type,
      filters.subject?.ref,
      (filters.kinds ?? []).join(","),
      filters.minConfidence,
      filters.maxSensitivity,
      filters.includeHistorical,
      filters.includeCandidates,
      (filters as RelationshipMemorySearchFilters).conflictReview,
      filters.limit,
    ],
  );
  return useQuery<RelationshipMemorySearchPageDTO>({
    queryKey: memorySearchKey(stable),
    queryFn: () => RelationshipMemorySDK.searchMemories(stable),
    staleTime: STALE,
    gcTime: GC,
    placeholderData: keepPreviousData,
    ...options,
  });
}

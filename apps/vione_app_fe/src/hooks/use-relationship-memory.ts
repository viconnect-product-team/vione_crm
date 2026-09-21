// BC-9.1 Turn C1 — Read-only React Query wrapper around the frozen
// RelationshipMemorySDK. Client-safe: never imports server-only modules.

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  RelationshipMemorySDK,
  type RelationshipMemoryDTO,
  type RelationshipMemoryListDTO,
  type RelationshipMemoryListFilters,
} from "@/lib/business-connect/relationship-memory";

const STALE = 30_000;
const GC = 5 * 60_000;

export function relationshipMemoryListKey(filters: RelationshipMemoryListFilters | undefined) {
  const subject = filters?.subject ?? null;
  return [
    "bc",
    "relationship-memory",
    "list",
    subject?.type ?? null,
    subject?.ref ?? null,
    filters?.kinds ?? null,
    filters?.statuses ?? null,
    filters?.minConfidence ?? null,
    filters?.maxSensitivity ?? null,
    filters?.limit ?? null,
    filters?.cursor ?? null,
  ] as const;
}

export function useRelationshipMemories(
  filters?: RelationshipMemoryListFilters,
  options?: Omit<UseQueryOptions<RelationshipMemoryListDTO>, "queryKey" | "queryFn">,
) {
  return useQuery<RelationshipMemoryListDTO>({
    queryKey: relationshipMemoryListKey(filters),
    queryFn: () => RelationshipMemorySDK.list(filters),
    staleTime: STALE,
    gcTime: GC,
    ...options,
  });
}

export function relationshipMemoryDetailKey(id: string | null | undefined) {
  return ["bc", "relationship-memory", "detail", id ?? null] as const;
}

export function useRelationshipMemory(
  id: string | null | undefined,
  options?: Omit<UseQueryOptions<RelationshipMemoryDTO | null>, "queryKey" | "queryFn" | "enabled">,
) {
  return useQuery<RelationshipMemoryDTO | null>({
    queryKey: relationshipMemoryDetailKey(id),
    queryFn: () => RelationshipMemorySDK.getById(id as string),
    enabled: !!id,
    staleTime: STALE,
    gcTime: GC,
    ...options,
  });
}

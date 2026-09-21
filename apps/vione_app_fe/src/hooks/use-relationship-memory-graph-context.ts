// BC-9.1 Turn C2 — Graph-context read hook for supersession / conflict chains.

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  RelationshipMemorySDK,
  type RelationshipMemoryGraphContextDTO,
} from "@/lib/business-connect/relationship-memory";

export function useRelationshipMemoryGraphContext(
  memoryId: string | null | undefined,
  opts?: { maxDepth?: number; maxNodes?: number },
  options?: Omit<
    UseQueryOptions<RelationshipMemoryGraphContextDTO>,
    "queryKey" | "queryFn" | "enabled"
  >,
) {
  return useQuery<RelationshipMemoryGraphContextDTO>({
    queryKey: [
      "bc",
      "relationship-memory",
      "graph-context",
      memoryId ?? null,
      opts?.maxDepth ?? null,
      opts?.maxNodes ?? null,
    ] as const,
    queryFn: () => RelationshipMemorySDK.getMemoryGraphContext(memoryId as string, opts),
    enabled: !!memoryId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  });
}

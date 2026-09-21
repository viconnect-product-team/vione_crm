// BC-4.5 — Recommendation feed hook.
//
// Wraps RelationshipGraphSDK.recommendConnections() with a typed cursor
// pagination model. No direct graph/repo/supabase imports. Filter reset
// clears the cursor (React Query key change → fresh chain). Version
// mismatches surface as a typed error so the UI can show a safe reset CTA.

import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { GraphError, RelationshipGraphSDK, type RecommendationPageDTO } from "@/lib/graph";

export type RecommendationFilterKey =
  | "all"
  | "mutual"
  | "company"
  | "association"
  | "community"
  | "event";

export interface UseRecommendationsInput {
  sourceNodeId: string | null | undefined;
  filter: RecommendationFilterKey;
  pageSize?: number;
  enabled?: boolean;
}

const PAGE_SIZE = 12;

export function useRecommendations({
  sourceNodeId,
  filter,
  pageSize = PAGE_SIZE,
  enabled = true,
}: UseRecommendationsInput) {
  return useInfiniteQuery<
    RecommendationPageDTO,
    Error,
    InfiniteData<RecommendationPageDTO>,
    readonly unknown[],
    string | null
  >({
    queryKey: ["bc45", "recommendations", sourceNodeId ?? "-", filter, pageSize],
    enabled: Boolean(sourceNodeId) && enabled,
    initialPageParam: null,
    staleTime: 60_000,
    retry: (attempt, err) => {
      if (err instanceof GraphError) {
        if (
          err.code === "RECOMMENDATION_CURSOR_INVALID" ||
          err.code === "RECOMMENDATION_VERSION_UNSUPPORTED" ||
          err.code === "UNAUTHENTICATED"
        ) {
          return false;
        }
      }
      return attempt < 2;
    },
    getNextPageParam: (last) => last.nextCursor ?? null,
    queryFn: async ({ pageParam }) => {
      if (!sourceNodeId) throw new GraphError("NODE_NOT_FOUND");
      return RelationshipGraphSDK.recommendConnections({
        sourceNodeId,
        limit: pageSize,
        cursor: pageParam ?? null,
        includeReasonDetails: true,
      });
    },
  });
}

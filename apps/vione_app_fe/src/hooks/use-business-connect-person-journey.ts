// BC-Mobile-2D — Person Journey React Query hook (read-only).
//
// Contract: docs/business-connect/mobile/BC_MOBILE_2D_TIMELINE_DATA_CONTRACT.md
//
// Bounded infinite pagination (default page size 5, hard max 20). The query
// key includes the viewer id, so an account switch invalidates the journey
// cache by construction. The server re-checks authorization on every call —
// this hook never gates on client state alone.

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { bcMobilePersonJourneyFn } from "@/lib/business-connect/mobile/person-journey.functions";
import {
  JOURNEY_DEFAULT_LIMIT,
  type BcMobileJourneyItem,
} from "@/lib/business-connect/mobile/person-journey.types";

export type BcMobilePersonJourneyStatus = "loading" | "error" | "unavailable" | "ok";

export function useBusinessConnectPersonJourney(input: { personId: string; enabled?: boolean }) {
  const viewerId = useViewerUserId();

  const query = useInfiniteQuery({
    queryKey: ["bc-mobile", "person-journey", viewerId ?? "anonymous", input.personId],
    enabled: Boolean(viewerId) && (input.enabled ?? true),
    initialPageParam: null as string | null,
    staleTime: 60_000,
    retry: 1,
    queryFn: ({ pageParam }) =>
      bcMobilePersonJourneyFn({
        data: { personId: input.personId, cursor: pageParam, limit: JOURNEY_DEFAULT_LIMIT },
      }),
    getNextPageParam: (last) => (last.status === "ok" ? last.page.nextCursor : null),
  });

  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((p) => (p.status === "ok" ? p.page.items : [])),
    [query.data],
  );

  const first = query.data?.pages?.[0];
  const status: BcMobilePersonJourneyStatus = query.isLoading
    ? "loading"
    : query.isError
      ? "error"
      : first && first.status === "unavailable"
        ? "unavailable"
        : "ok";

  return {
    status,
    items,
    hasNextPage: Boolean(query.hasNextPage),
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => void query.fetchNextPage(),
    retry: () => void query.refetch(),
  };
}

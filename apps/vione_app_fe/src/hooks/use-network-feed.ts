// BC-Mobile-7E — Network feed hook (viewer-scoped cache key).

import { useInfiniteQuery } from "@tanstack/react-query";
import { bcMobileNetworkFeedFn } from "@/lib/business-connect/mobile/network-feed.functions";
import type { BcNetworkFeedItem } from "@/lib/business-connect/mobile/network-feed.types";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { fetchNestApi } from "@/lib/api-client";

export const networkFeedKeys = {
  root: ["bc-mobile", "network-feed"] as const,
  list: (viewerId: string) => [...networkFeedKeys.root, viewerId] as const,
};

export function useNetworkFeed() {
  const viewerId = useViewerUserId();
  const query = useInfiniteQuery({
    queryKey: networkFeedKeys.list(viewerId ?? "viewer-pending"),
    enabled: viewerId !== null,
    staleTime: 30_000,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      try {
        const res = await fetchNestApi<{ items: BcNetworkFeedItem[]; nextCursor: string | null }>(
          `/connect-app/network/feed${pageParam ? `?cursor=${pageParam}` : ""}`
        );
        if (res && Array.isArray(res.items)) {
          return res;
        }
      } catch (err) {
        console.warn("Direct fetchNestApi feed failed, falling back to serverFn:", err);
      }
      return bcMobileNetworkFeedFn({ data: { cursor: pageParam } });
    },
    getNextPageParam: (last) => last.nextCursor,
  });

  const items: BcNetworkFeedItem[] = (query.data?.pages ?? []).flatMap((p) => p.items);

  return {
    items,
    initialLoading: query.isPending && viewerId !== null,
    error: query.isError && !query.data,
    hasMore: Boolean(query.hasNextPage),
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    retry: () => void query.refetch(),
  };
}

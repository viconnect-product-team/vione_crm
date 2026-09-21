// BC-7.5 — React Query hooks for the Relationship Timeline product surface.
//
// Read-only. Cursor pagination. No full-app invalidation. Query keys are
// centralized so the surface can be invalidated deterministically if a
// future write path is introduced (out of scope for BC-7.5).

import { useInfiniteQuery, useQuery, type InfiniteData } from "@tanstack/react-query";
import {
  RelationshipTimelineSDK,
  type ListRelationshipPairTimelineInput,
  type ListRelationshipTimelineInput,
  type RelationshipTimelineEventDTO,
  type RelationshipTimelinePage,
} from "@/lib/graph/relationship-timeline";

export const relationshipTimelineKeys = {
  root: ["bc75", "relationshipTimeline"] as const,
  list: (params: Omit<ListRelationshipTimelineInput, "cursor">) =>
    ["bc75", "relationshipTimeline", "list", params] as const,
  relationship: (params: Omit<ListRelationshipPairTimelineInput, "cursor">) =>
    ["bc75", "relationshipTimeline", "pair", params] as const,
  detail: (nodeId: string, eventId: string) =>
    ["bc75", "relationshipTimeline", "detail", nodeId, eventId] as const,
};

export function useRelationshipTimeline(
  input: Omit<ListRelationshipTimelineInput, "cursor"> & { enabled?: boolean },
) {
  const { enabled, ...params } = input;
  return useInfiniteQuery<
    RelationshipTimelinePage,
    Error,
    InfiniteData<RelationshipTimelinePage>,
    ReturnType<typeof relationshipTimelineKeys.list>,
    string | null
  >({
    queryKey: relationshipTimelineKeys.list(params),
    enabled: Boolean(params.nodeId) && (enabled ?? true),
    initialPageParam: null,
    staleTime: 60_000,
    getNextPageParam: (last) => last.nextCursor ?? null,
    queryFn: ({ pageParam }) =>
      RelationshipTimelineSDK.listTimeline({
        ...params,
        cursor: pageParam ?? null,
      }),
  });
}

export function useRelationshipPairTimeline(
  input: Omit<ListRelationshipPairTimelineInput, "cursor"> & {
    enabled?: boolean;
  },
) {
  const { enabled, ...params } = input;
  return useInfiniteQuery<
    RelationshipTimelinePage,
    Error,
    InfiniteData<RelationshipTimelinePage>,
    ReturnType<typeof relationshipTimelineKeys.relationship>,
    string | null
  >({
    queryKey: relationshipTimelineKeys.relationship(params),
    enabled: Boolean(params.nodeA) && Boolean(params.nodeB) && (enabled ?? true),
    initialPageParam: null,
    staleTime: 60_000,
    getNextPageParam: (last) => last.nextCursor ?? null,
    queryFn: ({ pageParam }) =>
      RelationshipTimelineSDK.listRelationshipTimeline({
        ...params,
        cursor: pageParam ?? null,
      }),
  });
}

export function useRelationshipTimelineEvent(
  nodeId: string | undefined,
  eventId: string | undefined,
) {
  return useQuery<RelationshipTimelineEventDTO | null>({
    queryKey: relationshipTimelineKeys.detail(nodeId ?? "-", eventId ?? "-"),
    enabled: Boolean(nodeId) && Boolean(eventId),
    staleTime: 60_000,
    queryFn: () =>
      RelationshipTimelineSDK.getTimelineEvent({
        nodeId: nodeId!,
        eventId: eventId!,
      }),
  });
}

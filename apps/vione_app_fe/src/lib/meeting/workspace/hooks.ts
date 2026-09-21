// BC-7.8 Turn B/C — Meeting Workspace client hooks.
// UI reads through these hooks; never imports service.server or workspace.functions directly.

import { useInfiniteQuery, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getMeetingWorkspaceDetailFn,
  getMeetingWorkspaceTimelineFn,
  getWorkspaceSummaryFn,
  listWorkspaceMeetingsFn,
} from "./workspace.functions";
import { meetingWorkspaceKeys } from "./query-keys";
import type { MeetingWorkspaceFilters } from "./types";
import { MEETING_WORKSPACE_PAGE_SIZE_DEFAULT } from "./types";

export function useMeetingWorkspaceSummary(options?: { enabled?: boolean }) {
  const fn = useServerFn(getWorkspaceSummaryFn);
  return useQuery({
    queryKey: meetingWorkspaceKeys.summary(),
    queryFn: () => fn(),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useMeetingWorkspaceList(
  filters: MeetingWorkspaceFilters,
  options?: { enabled?: boolean },
) {
  const fn = useServerFn(listWorkspaceMeetingsFn);
  const normalized: MeetingWorkspaceFilters = {
    ...filters,
    limit: filters.limit ?? MEETING_WORKSPACE_PAGE_SIZE_DEFAULT,
  };
  return useQuery({
    queryKey: meetingWorkspaceKeys.list(normalized),
    queryFn: () => fn({ data: normalized }),
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}

export function useMeetingWorkspaceDetail(meetingId: string | null | undefined) {
  const fn = useServerFn(getMeetingWorkspaceDetailFn);
  return useQuery({
    queryKey: meetingId
      ? meetingWorkspaceKeys.detail(meetingId)
      : ["meeting-workspace", "detail", "disabled"],
    queryFn: () => fn({ data: { meetingId: meetingId as string } }),
    enabled: !!meetingId,
    staleTime: 15_000,
  });
}

/** For Query-less route loaders. */
export function useMeetingWorkspaceListSuspense(filters: MeetingWorkspaceFilters) {
  const fn = useServerFn(listWorkspaceMeetingsFn);
  return useSuspenseQuery({
    queryKey: meetingWorkspaceKeys.list(filters),
    queryFn: () => fn({ data: filters }),
  });
}

// BC-7.8 Turn C — Infinite meeting-scoped timeline.
export function useMeetingWorkspaceTimeline(
  meetingId: string | null | undefined,
  options?: { enabled?: boolean; pageSize?: number },
) {
  const fn = useServerFn(getMeetingWorkspaceTimelineFn);
  const limit = options?.pageSize ?? 30;
  return useInfiniteQuery({
    queryKey: meetingWorkspaceKeys.timeline(meetingId ?? "disabled"),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fn({
        data: {
          meetingId: meetingId as string,
          cursor: pageParam ?? null,
          limit,
        },
      }),
    getNextPageParam: (last) => last?.nextCursor ?? null,
    enabled: !!meetingId && (options?.enabled ?? true),
    staleTime: 15_000,
  });
}

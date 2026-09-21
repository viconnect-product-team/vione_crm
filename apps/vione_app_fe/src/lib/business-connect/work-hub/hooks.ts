// BC-8.0 — React Query keys and hooks for the Work Hub.

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWorkHubOverviewFn, getWorkHubSummaryFn, listWorkHubItemsFn } from "./functions";
import type { WorkHubListFilters } from "./types";
import { WORK_HUB_PAGE_SIZE_DEFAULT } from "./types";

const compact = <T extends Record<string, unknown>>(o: T) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
};

export const workHubKeys = {
  root: ["work-hub"] as const,
  summary: () => [...workHubKeys.root, "summary"] as const,
  overview: () => [...workHubKeys.root, "overview"] as const,
  list: (f: WorkHubListFilters) =>
    [
      ...workHubKeys.root,
      "list",
      compact({
        category: f.category,
        sourceType: f.sourceType,
        urgency: f.urgency,
        fromDate: f.fromDate,
        toDate: f.toDate,
        limit: f.limit,
      }),
    ] as const,
};

export function useWorkHubSummary(options?: { enabled?: boolean }) {
  const fn = useServerFn(getWorkHubSummaryFn);
  return useQuery({
    queryKey: workHubKeys.summary(),
    queryFn: () => fn(),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useWorkHubOverview(options?: { enabled?: boolean }) {
  const fn = useServerFn(getWorkHubOverviewFn);
  return useQuery({
    queryKey: workHubKeys.overview(),
    queryFn: () => fn(),
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}

export function useWorkHubItems(
  filters: WorkHubListFilters,
  options?: { enabled?: boolean; pageSize?: number },
) {
  const fn = useServerFn(listWorkHubItemsFn);
  const limit = options?.pageSize ?? filters.limit ?? WORK_HUB_PAGE_SIZE_DEFAULT;
  return useInfiniteQuery({
    queryKey: workHubKeys.list({ ...filters, limit }),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fn({ data: { ...filters, limit, cursor: pageParam ?? null } }),
    getNextPageParam: (last) => last?.nextCursor ?? null,
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}

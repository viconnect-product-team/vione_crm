// BC-7.8 Turn B — Meeting Workspace React Query keys.
// No PII, no meeting titles, only stable ids and filter shape.

import type { MeetingWorkspaceFilters } from "./types";

const compact = <T extends Record<string, unknown>>(o: T) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
};

export const meetingWorkspaceKeys = {
  root: ["meeting-workspace"] as const,
  summary: () => [...meetingWorkspaceKeys.root, "summary"] as const,
  list: (filters: MeetingWorkspaceFilters) =>
    [
      ...meetingWorkspaceKeys.root,
      "list",
      filters.bucket,
      compact({
        meetingType: filters.meetingType,
        viewerRole: filters.viewerRole,
        sourceType: filters.sourceType,
        status: filters.status,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        cursor: filters.cursor,
        limit: filters.limit,
      }),
    ] as const,
  detail: (meetingId: string) => [...meetingWorkspaceKeys.root, "detail", meetingId] as const,
  timeline: (meetingId: string, cursor?: string | null) =>
    [...meetingWorkspaceKeys.root, "timeline", meetingId, compact({ cursor })] as const,
};

// BC-7.8 Turn A — MeetingWorkspaceSDK (read-only public surface, spec §10).
//
// FROZEN CONTRACT — reads only. Mutations remain in MeetingSDK and
// MeetingCalendarSDK (spec §11). Do not add mutation methods here; the
// TypeScript freeze on the interface below fails the build if any method
// name outside the whitelist appears at compile time.

import type {
  MeetingWorkspaceFilters,
  MeetingWorkspaceItemDTO,
  MeetingWorkspaceListDTO,
  MeetingWorkspaceSummaryDTO,
  MeetingWorkspaceTimelineEventDTO,
} from "./types";

export interface MeetingTimelinePageParams {
  cursor?: string | null;
  limit?: number | null;
}

export interface MeetingTimelinePageDTO {
  items: MeetingWorkspaceTimelineEventDTO[];
  nextCursor: string | null;
}

/**
 * Frozen read-only surface. Any attempt to widen this interface with a
 * write-shaped verb (create/update/delete/cancel/propose/select/respond)
 * is a spec violation — those live on MeetingSDK / MeetingCalendarSDK.
 */
export interface MeetingWorkspaceSDKType {
  getSummary(filters?: Partial<MeetingWorkspaceFilters>): Promise<MeetingWorkspaceSummaryDTO>;
  listMeetings(filters: MeetingWorkspaceFilters): Promise<MeetingWorkspaceListDTO>;
  getMeetingDetail(meetingId: string): Promise<MeetingWorkspaceItemDTO>;
  getMeetingTimeline(
    meetingId: string,
    params?: MeetingTimelinePageParams,
  ): Promise<MeetingTimelinePageDTO>;
}

// Server-fn implementations are bound in `./workspace.functions.ts`. The SDK
// is a thin façade that dispatches to those functions.
import {
  getMeetingWorkspaceDetailFn,
  getMeetingWorkspaceTimelineFn,
  getWorkspaceSummaryFn,
  listWorkspaceMeetingsFn,
} from "./workspace.functions";

export const MeetingWorkspaceSDK: MeetingWorkspaceSDKType = Object.freeze({
  getSummary: () => getWorkspaceSummaryFn(),
  listMeetings: (filters: MeetingWorkspaceFilters) => listWorkspaceMeetingsFn({ data: filters }),
  getMeetingDetail: (meetingId: string) => getMeetingWorkspaceDetailFn({ data: { meetingId } }),
  getMeetingTimeline: (meetingId: string, params?: MeetingTimelinePageParams) =>
    getMeetingWorkspaceTimelineFn({
      data: {
        meetingId,
        cursor: params?.cursor ?? null,
        limit: params?.limit ?? 30,
      },
    }) as unknown as Promise<MeetingTimelinePageDTO>,
});

/** Whitelisted method names — used by the SDK-freeze contract test (§63.15/§63.16). */
export const MEETING_WORKSPACE_SDK_METHODS = Object.freeze([
  "getSummary",
  "listMeetings",
  "getMeetingDetail",
  "getMeetingTimeline",
] as const);

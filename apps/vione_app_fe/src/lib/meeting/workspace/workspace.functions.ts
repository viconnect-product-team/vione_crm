import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { fetchNestApiFromServer } from "@/lib/api-client";
import {
  MEETING_WORKSPACE_BUCKETS,
  MEETING_WORKSPACE_PAGE_SIZE_DEFAULT,
  MEETING_WORKSPACE_PAGE_SIZE_MAX,
  type MeetingWorkspaceItemDTO,
  type MeetingWorkspaceListDTO,
  type MeetingWorkspaceSummaryDTO,
  type MeetingWorkspaceTimelineEventDTO,
} from "./types";
import {
  BUSINESS_MEETING_PARTICIPANT_ROLES,
  BUSINESS_MEETING_SOURCE_TYPES,
  BUSINESS_MEETING_STATUSES,
  BUSINESS_MEETING_TYPES,
} from "@/lib/business-meetings/types";

const uuid = z.string().uuid();

const filtersSchema = z.object({
  bucket: z.enum(MEETING_WORKSPACE_BUCKETS),
  meetingType: z.enum(BUSINESS_MEETING_TYPES).nullish(),
  viewerRole: z.enum(BUSINESS_MEETING_PARTICIPANT_ROLES).nullish(),
  sourceType: z.enum(BUSINESS_MEETING_SOURCE_TYPES).nullish(),
  status: z.enum(BUSINESS_MEETING_STATUSES).nullish(),
  fromDate: z.string().min(1).max(40).nullish(),
  toDate: z.string().min(1).max(40).nullish(),
  cursor: z.string().min(1).max(200).nullish(),
  limit: z.number().int().min(1).max(MEETING_WORKSPACE_PAGE_SIZE_MAX).nullish(),
});

// ── getWorkspaceSummaryFn ────────────────────────────────────────────────────

export const getWorkspaceSummaryFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<MeetingWorkspaceSummaryDTO> => {
    const { token } = context as any;
    try {
      return await fetchNestApiFromServer("/meetings/workspace/summary", token);
    } catch (err) {
      console.error("getWorkspaceSummaryFn failed:", err);
      return {
        needsActionCount: 0,
        upcomingCount: 0,
        unscheduledCount: 0,
        completedRecentlyCount: 0,
        thisMonthCount: 0,
        generatedAt: new Date().toISOString(),
      };
    }
  });

// ── listWorkspaceMeetingsFn ─────────────────────────────────────────────────

export const listWorkspaceMeetingsFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => filtersSchema.parse(d))
  .handler(async ({ context, data }): Promise<MeetingWorkspaceListDTO> => {
    const { token } = context as any;
    try {
      return await fetchNestApiFromServer("/meetings/workspace/list", token, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error("listWorkspaceMeetingsFn failed:", err);
      return { items: [], nextCursor: null };
    }
  });

// ── getMeetingWorkspaceDetailFn ─────────────────────────────────────────────

export const getMeetingWorkspaceDetailFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ meetingId: uuid }).parse(d))
  .handler(async ({ context, data }): Promise<MeetingWorkspaceItemDTO> => {
    const { token } = context as any;
    return fetchNestApiFromServer(`/meetings/${data.meetingId}/workspace-detail`, token);
  });

// ── getMeetingWorkspaceTimelineFn ───────────────────────────────────────────

const timelineInputSchema = z.object({
  meetingId: uuid,
  cursor: z.string().min(1).max(400).nullish(),
  limit: z.number().int().min(1).max(100).nullish(),
});

export interface MeetingWorkspaceTimelinePageDTO {
  items: MeetingWorkspaceTimelineEventDTO[];
  nextCursor: string | null;
}

export const getMeetingWorkspaceTimelineFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => timelineInputSchema.parse(d))
  .handler(async (): Promise<MeetingWorkspaceTimelinePageDTO> => {
    return { items: [], nextCursor: null };
  });


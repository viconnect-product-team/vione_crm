// BC-7.8 Turn B — MeetingWorkspaceService (server-side composition).
// Owns the RPC call, DTO assembly, viewer-scoped redaction, and delegates
// bucket/action derivation to the frozen Turn A pure functions.
//
// Client-safe by construction: no `.server` imports. The caller (server fn)
// provides an authenticated Supabase client + userId.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { deriveBucket } from "./buckets";
import { resolveMeetingWorkspaceAction } from "./action-resolver";
import { MeetingWorkspaceError } from "./errors";
import type {
  MeetingSchedulingMode,
  MeetingWorkspaceBucket,
  MeetingWorkspaceFilters,
  MeetingWorkspaceItemDTO,
  MeetingWorkspaceListDTO,
  MeetingWorkspaceParticipantPreview,
  MeetingWorkspaceSummaryDTO,
  MeetingWorkspaceTimelineEventDTO,
} from "./types";
import { projectMeetingEventMetadata } from "./timeline-projection";
import { MEETING_WORKSPACE_PAGE_SIZE_DEFAULT, MEETING_WORKSPACE_PAGE_SIZE_MAX } from "./types";
import type {
  BusinessMeetingParticipantRole,
  BusinessMeetingResponseStatus,
  BusinessMeetingStatus,
} from "@/lib/business-meetings/types";

type DB = SupabaseClient<Database>;

/** SQL bucket keys — a superset of UI buckets so we can slice overview cheaply. */
type SqlBucket =
  | "needs_action"
  | "upcoming"
  | "unscheduled"
  | "history"
  | "overview_upcoming"
  | "overview_history";

type Row = any;

// ── Row → DTO ────────────────────────────────────────────────────────────────

function toSchedulingMode(v: unknown): MeetingSchedulingMode {
  return v === "scheduled" ? "scheduled" : "unscheduled";
}

function durationMinutes(startAt: string | null, endAt: string | null): number | null {
  if (!startAt || !endAt) return null;
  const ms = Date.parse(endAt) - Date.parse(startAt);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.round(ms / 60_000);
}

function toParticipantPreviews(raw: unknown): MeetingWorkspaceParticipantPreview[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p && typeof p === "object")
    .map(
      (p): MeetingWorkspaceParticipantPreview => ({
        // opaque handle (participant row id); NOT the auth user id
        handle: String((p as Row).handle ?? ""),
        displayName: null, // display projections deferred to detail-level fetch
        avatarUrl: null,
        role: ((p as Row).role ?? "required") as BusinessMeetingParticipantRole,
        isHidden: true, // preview name/avatar redacted at list level for privacy
      }),
    );
}

function assembleItem(row: Row, nowIso: string): MeetingWorkspaceItemDTO {
  const status = row.status as BusinessMeetingStatus;
  const schedulingMode = toSchedulingMode(row.scheduling_mode);
  const scheduledStartAt = row.scheduled_start_at ? String(row.scheduled_start_at) : null;
  const scheduledEndAt = row.scheduled_end_at ? String(row.scheduled_end_at) : null;
  const viewerRole = (row.viewer_role ?? null) as BusinessMeetingParticipantRole | null;
  const viewerResponse = (row.viewer_response ?? null) as BusinessMeetingResponseStatus | null;

  const activeProposalCount = Number(row.active_proposal_count ?? 0);
  const viewerPendingProposalResponseCount = Number(row.viewer_pending_proposal_count ?? 0);
  const selectableProposalCount = Number(row.selectable_proposal_count ?? 0);
  const hasSelectedProposal = Boolean(row.selected_time_proposal_id);
  const hasUserActionableCalendarIssue = Boolean(row.viewer_sync_issue);

  // Bucket (pure)
  const bucket: MeetingWorkspaceBucket = deriveBucket({
    status,
    schedulingMode,
    scheduledStartAt,
    now: nowIso,
  });
  // Action (pure)
  const action = resolveMeetingWorkspaceAction({
    status,
    viewerRole,
    viewerInvitationResponse: viewerResponse,
    schedulingMode,
    hasSelectedProposal,
    activeProposalCount,
    viewerPendingProposalResponseCount,
    selectableProposalCount,
    hasUserActionableCalendarIssue,
    sourceVisible: true,
  });

  void bucket; // bucket is exposed via server-fn cursor; DTO stays flat per Turn A.

  return {
    meeting: {
      id: String(row.id),
      title: String(row.title),
      meetingType: row.meeting_type,
      status,
      locationType: null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
      completedAt: row.completed_at ? String(row.completed_at) : null,
    },
    viewer: {
      role: viewerRole,
      invitationResponseStatus: viewerResponse,
      canRespondToMeeting:
        viewerRole !== null &&
        viewerRole !== "organizer" &&
        (viewerResponse === null || viewerResponse === "pending"),
      hasPendingTimeProposalResponse: viewerPendingProposalResponseCount > 0,
      canSelectFinalTime:
        viewerRole === "organizer" && !hasSelectedProposal && selectableProposalCount > 0,
    },
    action,
    scheduleSummary: {
      isScheduled: schedulingMode === "scheduled" && !!scheduledStartAt,
      schedulingMode: (schedulingMode === "scheduled"
        ? "scheduled"
        : activeProposalCount > 0
          ? "scheduling"
          : "unscheduled") as MeetingSchedulingMode,
      startAt: scheduledStartAt,
      endAt: scheduledEndAt,
      timezone: (row.scheduled_timezone as string | null) ?? (row.timezone as string) ?? "UTC",
      durationMinutes: durationMinutes(scheduledStartAt, scheduledEndAt),
    },
    invitationSummary: {
      requiredCount: Number(row.required_count ?? 0),
      acceptedCount: Number(row.accepted_count ?? 0),
      declinedCount: Number(row.declined_count ?? 0),
      tentativeCount: Number(row.tentative_count ?? 0),
      pendingCount: Number(row.pending_count ?? 0),
    },
    proposalSummary: {
      activeProposalCount,
      selectedProposalId: row.selected_time_proposal_id
        ? String(row.selected_time_proposal_id)
        : null,
      viewerPendingResponseCount: viewerPendingProposalResponseCount,
      selectableProposalCount,
      latestProposalAt: row.latest_proposal_at ? String(row.latest_proposal_at) : null,
    },
    participantSummary: {
      participantCount: Number(row.participant_count ?? 0),
      requiredCount: Number(row.required_count ?? 0),
      acceptedCount: Number(row.accepted_count ?? 0),
      visibleParticipants: toParticipantPreviews(row.participants_preview),
    },
    calendarSyncSummary: {
      totalProjectionCount: Number(row.sync_total ?? 0),
      syncedCount: Number(row.sync_synced ?? 0),
      pendingCount: Number(row.sync_pending ?? 0),
      retryScheduledCount: Number(row.sync_retry ?? 0),
      failedCount: Number(row.sync_failed ?? 0),
      hasUserActionableIssue: hasUserActionableCalendarIssue,
    },
    sourceContextSummary: {
      type: row.source_type ?? "manual",
      // labels/routes derived client-side via i18n; server only exposes safe type
      label: String(row.source_type ?? "manual"),
      canNavigate: false,
      target: null,
    },
    latestTimelineSummary: {
      latestEventKind: null,
      occurredAt: null,
      summaryKey: null,
    },
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

function normalizeLimit(input: number | null | undefined): number {
  const n = input ?? MEETING_WORKSPACE_PAGE_SIZE_DEFAULT;
  if (!Number.isFinite(n) || n <= 0) return MEETING_WORKSPACE_PAGE_SIZE_DEFAULT;
  return Math.min(Math.floor(n), MEETING_WORKSPACE_PAGE_SIZE_MAX);
}

function encodeCursor(sortAt: string, id: string): string {
  return `${sortAt}|${id}`;
}
function decodeCursor(c: string | null | undefined): { sortAt: string; id: string } | null {
  if (!c) return null;
  const idx = c.lastIndexOf("|");
  if (idx <= 0) return null;
  const sortAt = c.slice(0, idx);
  const id = c.slice(idx + 1);
  if (!sortAt || !id) return null;
  return { sortAt, id };
}

/**
 * Bucket mapping — `overview` is a synthetic UI bucket assembled from a small
 * upcoming slice plus a small history slice. All other buckets map 1:1 to the
 * SQL predicate.
 */
function sqlBucketFor(bucket: MeetingWorkspaceBucket): SqlBucket | null {
  switch (bucket) {
    case "needs_action":
      return "needs_action";
    case "upcoming":
      return "upcoming";
    case "unscheduled":
      return "unscheduled";
    case "history":
      return "history";
    case "overview":
      return null;
    default:
      return null;
  }
}

async function callList(
  supabase: DB,
  sqlBucket: SqlBucket,
  filters: MeetingWorkspaceFilters,
  limit: number,
): Promise<MeetingWorkspaceListDTO> {
  const cursor = decodeCursor(filters.cursor ?? null);

  const { data, error } = await (supabase as any).rpc("business_meeting_workspace_list_v1", {
    p_bucket: sqlBucket,
    p_limit: limit,
    p_cursor_sort_at: cursor?.sortAt ?? null,
    p_cursor_meeting_id: cursor?.id ?? null,
    p_meeting_type: filters.meetingType ?? null,
    p_source_type: filters.sourceType ?? null,
  });
  if (error) {
    throw new MeetingWorkspaceError("MEETING_WORKSPACE_INTERNAL_ERROR", error.message);
  }
  const nowIso = new Date().toISOString();
  const rows: Row[] = Array.isArray(data?.items) ? data.items : [];
  const hasMore = rows.length > limit;
  const paged = hasMore ? rows.slice(0, limit) : rows;
  const items = paged.map((row) => assembleItem(row, nowIso));
  let nextCursor: string | null = null;
  if (hasMore) {
    const last = paged[paged.length - 1] as Row;
    const sortAt = last.sort_at ? String(last.sort_at) : String(last.updated_at);
    nextCursor = encodeCursor(sortAt, String(last.id));
  }
  return { items, nextCursor };
}

export const MeetingWorkspaceService = {
  async getSummary(supabase: DB): Promise<MeetingWorkspaceSummaryDTO> {
    const { data, error } = await (supabase as any).rpc(
      "business_meeting_workspace_summary_v1",
      {},
    );
    if (error) {
      throw new MeetingWorkspaceError("MEETING_WORKSPACE_INTERNAL_ERROR", error.message);
    }
    // needsActionCount is UI-derived from the Needs Action list; keep a
    // conservative placeholder so summary card stays honest until the list
    // loads. (No blocking fanout for a landing summary.)
    return {
      needsActionCount: Number(data?.needsActionCount ?? 0),
      upcomingCount: Number(data?.upcomingCount ?? 0),
      unscheduledCount: Number(data?.unscheduledCount ?? 0),
      completedRecentlyCount: Number(data?.completedRecentlyCount ?? 0),
      thisMonthCount: Number(data?.thisMonthCount ?? 0),
      generatedAt: String(data?.generatedAt ?? new Date().toISOString()),
    };
  },

  async listMeetings(
    supabase: DB,
    filters: MeetingWorkspaceFilters,
  ): Promise<MeetingWorkspaceListDTO> {
    const limit = normalizeLimit(filters.limit);
    const sqlBucket = sqlBucketFor(filters.bucket);
    if (sqlBucket === null && filters.bucket !== "overview") {
      throw new MeetingWorkspaceError("MEETING_WORKSPACE_INVALID_CURSOR");
    }
    if (filters.bucket === "overview") {
      // Overview = small upcoming slice + small history slice, one RPC each.
      const upcoming = await callList(
        supabase,
        "overview_upcoming",
        { ...filters, bucket: "upcoming", limit: 3, cursor: null },
        3,
      );
      const history = await callList(
        supabase,
        "overview_history",
        { ...filters, bucket: "history", limit: 3, cursor: null },
        3,
      );
      return {
        items: [...upcoming.items, ...history.items],
        nextCursor: null,
      };
    }
    return callList(supabase, sqlBucket as SqlBucket, filters, limit);
  },

  // BC-7.8 Turn C — Meeting-scoped timeline reader.
  // Reads business_meeting_events under caller RLS (participants only via
  // bm_events_select). Cursor pagination on (occurred_at DESC, id DESC).
  async getMeetingTimeline(
    supabase: DB,
    viewerUserId: string,
    meetingId: string,
    params: { cursor?: string | null; limit?: number | null } = {},
  ): Promise<{ items: MeetingWorkspaceTimelineEventDTO[]; nextCursor: string | null }> {
    const rawLimit = params.limit ?? 30;
    const limit = Math.max(1, Math.min(100, Math.floor(rawLimit)));

    let cursorOccurredAt: string | null = null;
    let cursorId: string | null = null;
    if (params.cursor) {
      const [occ, id] = decodeTimelineCursor(params.cursor);
      cursorOccurredAt = occ;
      cursorId = id;
    }

    let q = (supabase as any)
      .from("business_meeting_events")
      .select("id, event_type, occurred_at, metadata, actor_user_id")
      .eq("meeting_id", meetingId)
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (cursorOccurredAt && cursorId) {
      // Composite keyset: (occurred_at, id) < (cursor.occurredAt, cursor.id).
      q = q.or(
        `occurred_at.lt.${cursorOccurredAt},and(occurred_at.eq.${cursorOccurredAt},id.lt.${cursorId})`,
      );
    }

    const { data, error } = await q;
    if (error) {
      throw new MeetingWorkspaceError("MEETING_WORKSPACE_INTERNAL_ERROR", error.message);
    }

    const rows = (Array.isArray(data) ? (data as any[]) : []) as Array<{
      id: string;
      event_type: string;
      occurred_at: string;
      metadata: unknown;
      actor_user_id: string | null;
    }>;

    const hasMore = rows.length > limit;
    const paged = hasMore ? rows.slice(0, limit) : rows;
    const items: MeetingWorkspaceTimelineEventDTO[] = paged.map((r: any) => ({
      id: String(r.id),
      eventType: String(r.event_type),
      occurredAt: String(r.occurred_at),
      summaryKey: `bc.meetings.workspace.timeline.event.${String(r.event_type).toLowerCase()}`,
      metadata: projectMeetingEventMetadata(r.metadata),
      actorIsViewer: !!r.actor_user_id && r.actor_user_id === viewerUserId,
    }));

    let nextCursor: string | null = null;
    if (hasMore && paged.length > 0) {
      const last = paged[paged.length - 1];
      nextCursor = encodeTimelineCursor(String(last.occurred_at), String(last.id));
    }

    return { items, nextCursor };
  },
};

// ── Timeline cursor helpers ─────────────────────────────────────────────────

function encodeTimelineCursor(occurredAt: string, id: string): string {
  const raw = JSON.stringify({ o: occurredAt, i: id });
  if (typeof globalThis.btoa === "function") return globalThis.btoa(raw);

  return (globalThis as any).Buffer.from(raw, "utf8").toString("base64");
}

function decodeTimelineCursor(cursor: string): [string | null, string | null] {
  try {
    const raw =
      typeof globalThis.atob === "function"
        ? globalThis.atob(cursor)
        : (globalThis as any).Buffer.from(cursor, "base64").toString("utf8");
    const parsed = JSON.parse(raw) as { o?: unknown; i?: unknown };
    const o = typeof parsed.o === "string" ? parsed.o : null;
    const i = typeof parsed.i === "string" ? parsed.i : null;
    return [o, i];
  } catch {
    return [null, null];
  }
}

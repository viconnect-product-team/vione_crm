// BC-7.8 Turn A — Meeting Workspace DTO surface (spec §12–§20).
// JSON-safe. Never exposes raw auth IDs, provider tokens, busy intervals,
// raw timeline payloads, or hidden participant identities.

import type {
  BusinessMeetingParticipantRole,
  BusinessMeetingResponseStatus,
  BusinessMeetingSourceType,
  BusinessMeetingStatus,
  BusinessMeetingType,
  BusinessMeetingLocationType,
} from "@/lib/business-meetings/types";
import type { MeetingWorkspaceActionKind } from "./action-registry";

// ── Buckets (§4/§9) ──────────────────────────────────────────────────────────

export const MEETING_WORKSPACE_BUCKETS = [
  "overview",
  "needs_action",
  "upcoming",
  "unscheduled",
  "history",
] as const;
export type MeetingWorkspaceBucket = (typeof MEETING_WORKSPACE_BUCKETS)[number];

// ── Filters (§46) ────────────────────────────────────────────────────────────

export interface MeetingWorkspaceFilters {
  bucket: MeetingWorkspaceBucket;
  meetingType?: BusinessMeetingType | null;
  viewerRole?: BusinessMeetingParticipantRole | null;
  sourceType?: BusinessMeetingSourceType | null;
  status?: BusinessMeetingStatus | null;
  fromDate?: string | null;
  toDate?: string | null;
  cursor?: string | null;
  limit?: number | null;
}

// ── Action DTO (§7/§8) ───────────────────────────────────────────────────────

export interface MeetingWorkspaceActionDTO {
  kind: MeetingWorkspaceActionKind;
  priority: number;
  labelKey: string;
  /** UI navigation target hint; canonical routing owns the URL. */
  target: "detail" | "scheduling" | "timeline" | "calendar-settings" | "none";
  /** Machine-readable why-code, e.g. "viewer_pending_invitation". */
  reasonCode: string;
}

// ── Viewer summary (§13) ────────────────────────────────────────────────────

export interface MeetingWorkspaceViewerSummary {
  role: BusinessMeetingParticipantRole | null;
  invitationResponseStatus: BusinessMeetingResponseStatus | null;
  canRespondToMeeting: boolean;
  hasPendingTimeProposalResponse: boolean;
  canSelectFinalTime: boolean;
}

// ── Schedule summary (§14) ──────────────────────────────────────────────────

export type MeetingSchedulingMode = "unscheduled" | "scheduling" | "scheduled";

export interface MeetingWorkspaceScheduleSummary {
  isScheduled: boolean;
  schedulingMode: MeetingSchedulingMode;
  startAt: string | null;
  endAt: string | null;
  timezone: string;
  durationMinutes: number | null;
}

// ── Invitation summary (§15) ────────────────────────────────────────────────

export interface MeetingWorkspaceInvitationSummary {
  requiredCount: number;
  acceptedCount: number;
  declinedCount: number;
  tentativeCount: number;
  pendingCount: number;
}

// ── Proposal summary (§16) ──────────────────────────────────────────────────

export interface MeetingWorkspaceProposalSummary {
  activeProposalCount: number;
  selectedProposalId: string | null;
  viewerPendingResponseCount: number;
  selectableProposalCount: number;
  latestProposalAt: string | null;
}

// ── Participant summary (§17) ───────────────────────────────────────────────

export interface MeetingWorkspaceParticipantPreview {
  /** Stable opaque handle for React keys; NOT the auth user id. */
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: BusinessMeetingParticipantRole;
  isHidden: boolean;
}

export interface MeetingWorkspaceParticipantSummary {
  participantCount: number;
  requiredCount: number;
  acceptedCount: number;
  visibleParticipants: MeetingWorkspaceParticipantPreview[];
}

// ── Calendar sync summary (§18) ─────────────────────────────────────────────

export interface MeetingWorkspaceCalendarSyncSummary {
  totalProjectionCount: number;
  syncedCount: number;
  pendingCount: number;
  retryScheduledCount: number;
  failedCount: number;
  hasUserActionableIssue: boolean;
}

// ── Source context (§19) ────────────────────────────────────────────────────

export interface MeetingWorkspaceSourceContextSummary {
  type: BusinessMeetingSourceType | "direct";
  label: string;
  canNavigate: boolean;
  target: {
    route: string;
    params?: Record<string, string>;
  } | null;
}

// ── Timeline summary (§20) ──────────────────────────────────────────────────

export interface MeetingWorkspaceTimelineSummary {
  latestEventKind: string | null;
  occurredAt: string | null;
  summaryKey: string | null;
}

// ── Meeting-scoped timeline event DTO (§20 / Turn C) ────────────────────────
// Redacted projection of business_meeting_events for the detail page.
// Never exposes actor_user_id, mutation_key, or raw payloads.

export interface MeetingWorkspaceTimelineEventDTO {
  id: string;
  eventType: string;
  occurredAt: string;
  summaryKey: string;
  /** PII-safe allowlist projection of the source event metadata. */
  metadata: Record<string, string | number | boolean | null>;
  /** True when the current viewer is the actor of the event. */
  actorIsViewer: boolean;
}

// ── Meeting core (subset re-projected for the workspace item) ───────────────

export interface MeetingWorkspaceMeetingCore {
  id: string;
  title: string;
  meetingType: BusinessMeetingType;
  status: BusinessMeetingStatus;
  locationType: BusinessMeetingLocationType | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  completedAt: string | null;
}

// ── Composed item DTO (§12) ─────────────────────────────────────────────────

export interface MeetingWorkspaceItemDTO {
  meeting: MeetingWorkspaceMeetingCore;
  viewer: MeetingWorkspaceViewerSummary;
  action: MeetingWorkspaceActionDTO;
  scheduleSummary: MeetingWorkspaceScheduleSummary;
  invitationSummary: MeetingWorkspaceInvitationSummary;
  proposalSummary: MeetingWorkspaceProposalSummary;
  participantSummary: MeetingWorkspaceParticipantSummary;
  calendarSyncSummary: MeetingWorkspaceCalendarSyncSummary;
  sourceContextSummary: MeetingWorkspaceSourceContextSummary;
  latestTimelineSummary: MeetingWorkspaceTimelineSummary;
}

// ── Summary cards (§22) ─────────────────────────────────────────────────────

export interface MeetingWorkspaceSummaryDTO {
  needsActionCount: number;
  upcomingCount: number;
  unscheduledCount: number;
  completedRecentlyCount: number;
  thisMonthCount: number;
  generatedAt: string;
}

// ── List envelope (cursor pagination, §48) ──────────────────────────────────

export interface MeetingWorkspaceListDTO {
  items: MeetingWorkspaceItemDTO[];
  nextCursor: string | null;
}

// ── Pagination bounds (§43/§48) ─────────────────────────────────────────────

export const MEETING_WORKSPACE_PAGE_SIZE_DEFAULT = 20;
export const MEETING_WORKSPACE_PAGE_SIZE_MAX = 100;

// BC-8.0 — Unified Work Hub — frozen types, registries, and DTOs.
//
// The Work Hub is a READ-MODEL over canonical Business Connect domains
// (Connection, Introduction, Meeting, Follow-up, Calendar, Relationship
// Timeline). It never owns lifecycle state, never persists a new source of
// truth, and never mutates canonical records itself. UI cards route into
// the canonical product surfaces via `WorkHubActionDTO.targetRoute`.

/** Registry version. Bump when kinds/categories/priority tiers change. */
export const WORK_HUB_PRIORITY_VERSION = "1.0.0" as const;

// ── Sources (§4) ────────────────────────────────────────────────────────────

export const WORK_HUB_SOURCE_TYPES = [
  "connection",
  "introduction_request",
  "introduction_delivery",
  "introduction_outcome",
  "meeting_invitation",
  "meeting_scheduling",
  "meeting",
  "meeting_outcome",
  "meeting_follow_up",
  "calendar_sync",
  "relationship_activity",
] as const;
export type WorkHubSourceType = (typeof WORK_HUB_SOURCE_TYPES)[number];

// ── Item kinds (§8) ─────────────────────────────────────────────────────────

export const WORK_HUB_ITEM_KINDS = [
  "connection_request_received",
  "connection_request_sent_waiting",
  "introduction_request_received",
  "introduction_request_accepted_waiting_delivery",
  "introduction_delivery_received",
  "introduction_outcome_missing",
  "meeting_invitation_response_required",
  "meeting_time_response_required",
  "meeting_final_time_selection_ready",
  "meeting_schedule_required",
  "meeting_upcoming",
  "meeting_outcome_missing",
  "meeting_follow_up_due_soon",
  "meeting_follow_up_overdue",
  "meeting_follow_up_active",
  "calendar_sync_action_required",
  "relationship_activity_recent",
] as const;
export type WorkHubItemKind = (typeof WORK_HUB_ITEM_KINDS)[number];

// ── Categories (§9) ─────────────────────────────────────────────────────────

export const WORK_HUB_CATEGORIES = [
  "needs_action",
  "due_soon",
  "overdue",
  "upcoming",
  "waiting",
  "recent",
] as const;
export type WorkHubCategory = (typeof WORK_HUB_CATEGORIES)[number];

/** Deterministic precedence (§34). Lower index = higher precedence. */
export const WORK_HUB_CATEGORY_PRECEDENCE: readonly WorkHubCategory[] = [
  "overdue",
  "needs_action",
  "due_soon",
  "upcoming",
  "waiting",
  "recent",
] as const;

// ── Urgency (§13) ───────────────────────────────────────────────────────────

export const WORK_HUB_URGENCY = ["critical", "high", "normal", "low", "informational"] as const;
export type WorkHubUrgency = (typeof WORK_HUB_URGENCY)[number];

// ── Actions (§16) ───────────────────────────────────────────────────────────

export const WORK_HUB_ACTION_KINDS = [
  "review_connection_request",
  "review_introduction_request",
  "deliver_introduction",
  "view_introduction",
  "respond_meeting",
  "review_meeting_times",
  "select_meeting_time",
  "schedule_meeting",
  "record_meeting_outcome",
  "review_follow_up",
  "view_upcoming_meeting",
  "resolve_calendar_issue",
  "view_relationship_activity",
  "none",
] as const;
export type WorkHubActionKind = (typeof WORK_HUB_ACTION_KINDS)[number];

/** Optional inline low-risk mutations allowed on Hub cards (§18). */
export const WORK_HUB_INLINE_MUTATION_CAPABILITIES = [
  "accept_connection_request",
  "decline_connection_request",
  "acknowledge_introduction_delivery",
] as const;
export type WorkHubInlineMutationCapability =
  (typeof WORK_HUB_INLINE_MUTATION_CAPABILITIES)[number];

/** Priority tiers (§11). Lower = more urgent. Frozen. */
export const WORK_HUB_PRIORITY = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
  P5: 5,
  P6: 6,
  P7: 7,
} as const;
export type WorkHubPriority = (typeof WORK_HUB_PRIORITY)[keyof typeof WORK_HUB_PRIORITY];

// ── DTOs ────────────────────────────────────────────────────────────────────

export interface WorkHubActionDTO {
  kind: WorkHubActionKind;
  labelKey: string;
  /** Type-safe TanStack route path; UI must not construct URLs by hand (§17). */
  targetRoute: string | null;
  targetParams: Record<string, string> | null;
  targetSearch: Record<string, string | number | boolean> | null;
  mutationCapability: WorkHubInlineMutationCapability | null;
  requiresConfirmation: boolean;
}

/** PII-safe display data. NEVER include user IDs, tenant IDs, tokens, note
 *  bodies, outcome summaries, calendar details, or raw event payloads (§6). */
export interface WorkHubDisplayData {
  /** Opaque handle for the counterpart, if any — never a raw auth user id. */
  counterpartHandle?: string | null;
  counterpartDisplayName?: string | null;
  counterpartAvatarUrl?: string | null;
  /** Extra display scalars (allowlisted): counts, timezone, safe status names. */
  scalars?: Record<string, string | number | boolean | null>;
}

export interface WorkHubViewerPermissions {
  canRoute: boolean;
  canInlineMutate: boolean;
}

export interface WorkHubItemDTO {
  /** Deterministic logical id: sourceType:sourceRecordId:itemKind (§7). */
  id: string;
  sourceType: WorkHubSourceType;
  sourceRecordId: string;
  itemKind: WorkHubItemKind;
  category: WorkHubCategory;
  priority: WorkHubPriority;
  urgency: WorkHubUrgency;
  titleKey: string;
  descriptionKey: string | null;
  safeDisplayData: WorkHubDisplayData;
  dueAt: string | null;
  startsAt: string | null;
  occurredAt: string | null;
  status: string | null;
  action: WorkHubActionDTO;
  secondaryAction: WorkHubActionDTO | null;
  context: Record<string, string | number | boolean | null>;
  viewerPermissions: WorkHubViewerPermissions;
  /** Stable key used for cross-source deduplication (§32). */
  dedupeKey: string;
  registryVersion: typeof WORK_HUB_PRIORITY_VERSION;
}

export interface WorkHubSummaryDTO {
  needsActionCount: number;
  overdueCount: number;
  dueSoonCount: number;
  upcomingCount: number;
  waitingCount: number;
  recentCount: number;
  highestPriority: WorkHubPriority | null;
  registryVersion: typeof WORK_HUB_PRIORITY_VERSION;
  generatedAt: string;
}

export interface WorkHubOverviewDTO {
  summary: WorkHubSummaryDTO;
  /** Small preview slice per category (§10). Not paginated. */
  previews: Record<WorkHubCategory, WorkHubItemDTO[]>;
}

// ── Filters + pagination (§36–§37) ──────────────────────────────────────────

export interface WorkHubListFilters {
  category?: WorkHubCategory | null;
  sourceType?: WorkHubSourceType | null;
  urgency?: WorkHubUrgency | null;
  fromDate?: string | null;
  toDate?: string | null;
  cursor?: string | null;
  limit?: number | null;
}

export interface WorkHubListDTO {
  items: WorkHubItemDTO[];
  nextCursor: string | null;
  registryVersion: typeof WORK_HUB_PRIORITY_VERSION;
}

/** Cursor payload (§36) — encoded as base64(JSON). */
export interface WorkHubCursor {
  v: typeof WORK_HUB_PRIORITY_VERSION;
  c: WorkHubCategory | null;
  p: WorkHubPriority | null;
  d: string | null; // dueAt
  s: string | null; // startsAt
  o: string | null; // occurredAt
  i: string; // item id
  f: string | null; // filter fingerprint
}

// ── Bounds (§24/§36) ────────────────────────────────────────────────────────

export const WORK_HUB_PAGE_SIZE_DEFAULT = 20;
export const WORK_HUB_PAGE_SIZE_MAX = 100;

/** Per-source read caps (§24). */
export const WORK_HUB_SOURCE_READ_LIMIT_DEFAULT = 30;
export const WORK_HUB_SOURCE_READ_LIMIT_MAX = 100;

// ── Time windows (§25) ──────────────────────────────────────────────────────

export const WORK_HUB_WINDOWS = Object.freeze({
  upcomingDays: 30,
  dueSoonDays: 7,
  recentDays: 14,
});

// BC-8.1 — Frozen notification orchestration DTOs, statuses, priorities, and
// action/channel enums. Notifications are NEVER a canonical source of state;
// they describe "something happened or requires attention" and route the
// recipient to a canonical surface. See docs/business-connect/notification-orchestration/.

/** Bumps ONLY when the frozen registries/policies below change. */
export const NOTIFICATION_POLICY_VERSION = "1.0.0" as const;
export const NOTIFICATION_SCHEMA_VERSION = 1 as const;

// ── Source domains (§2) ─────────────────────────────────────────────────────
export const NOTIFICATION_SOURCE_DOMAINS = [
  "connection",
  "introduction",
  "meeting",
  "meeting_calendar",
  "meeting_outcome",
  "meeting_follow_up",
  "meeting_collaboration",
  "work_hub",
  "relationship_activity",
] as const;
export type NotificationSourceDomain = (typeof NOTIFICATION_SOURCE_DOMAINS)[number];

// ── Notification kinds (§5) ─────────────────────────────────────────────────
export const NOTIFICATION_KINDS = [
  // Connection
  "connection_request_received",
  "connection_request_accepted",
  "connection_request_declined",
  // Introduction
  "introduction_request_received",
  "introduction_request_accepted",
  "introduction_request_declined",
  "introduction_delivery_required",
  "introduction_delivered",
  "introduction_delivery_acknowledged",
  "introduction_outcome_due",
  // Meeting
  "meeting_invitation_received",
  "meeting_invitation_accepted",
  "meeting_invitation_declined",
  "meeting_time_response_required",
  "meeting_final_time_ready",
  "meeting_confirmed",
  "meeting_cancelled",
  "meeting_upcoming_reminder",
  "meeting_outcome_missing",
  // Follow-up
  "follow_up_created",
  "follow_up_assigned",
  "follow_up_due_soon",
  "follow_up_overdue",
  "follow_up_completed",
  "follow_up_cancelled",
  // Collaboration
  "shared_notes_published",
  "agenda_updated",
  // Calendar
  "calendar_account_revoked",
  "calendar_sync_failed_action_required",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

// ── Statuses (§4) — decoupled from channel dispatch status ──────────────────
export const NOTIFICATION_STATUSES = [
  "pending",
  "scheduled",
  "delivered",
  "read",
  "archived",
  "expired",
  "cancelled",
] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const NOTIFICATION_DISPATCH_STATUSES = [
  "pending",
  "processing",
  "delivered",
  "retry_scheduled",
  "failed",
  "dead_lettered",
  "cancelled",
] as const;
export type NotificationDispatchStatus = (typeof NOTIFICATION_DISPATCH_STATUSES)[number];

// ── Channels (§15) ──────────────────────────────────────────────────────────
export const NOTIFICATION_CHANNELS = ["in_app", "email", "push"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

// ── Priorities (§16) ────────────────────────────────────────────────────────
export const NOTIFICATION_PRIORITIES = ["critical", "high", "normal", "informational"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

// ── Digest modes (§18) ──────────────────────────────────────────────────────
export const NOTIFICATION_DIGEST_MODES = ["off", "immediate", "daily", "weekly"] as const;
export type NotificationDigestMode = (typeof NOTIFICATION_DIGEST_MODES)[number];

// ── Preference UI categories (§45) ──────────────────────────────────────────
export const NOTIFICATION_PREFERENCE_CATEGORIES = [
  "connections",
  "introductions",
  "meetings",
  "follow_ups",
  "calendar",
  "collaboration",
] as const;
export type NotificationPreferenceCategory = (typeof NOTIFICATION_PREFERENCE_CATEGORIES)[number];

// ── Action DTO (§12) ────────────────────────────────────────────────────────
export const NOTIFICATION_ACTION_KINDS = [
  "open_connection_incoming",
  "open_connection_thread",
  "open_introduction_request",
  "open_introduction_delivery",
  "open_meeting_detail",
  "open_meeting_scheduling",
  "open_meeting_notes",
  "open_meeting_follow_up",
  "open_calendar_settings",
  "open_work_hub_filter",
  "none",
] as const;
export type NotificationActionKind = (typeof NOTIFICATION_ACTION_KINDS)[number];

export interface NotificationActionDTO {
  kind: NotificationActionKind;
  labelKey: string;
  targetRoute: string | null;
  targetParams: Record<string, string> | null;
  targetSearch: Record<string, string | number | boolean> | null;
  requiresConfirmation: boolean;
  /** Optional low-risk inline mutation capability (§14). v1: read/archive only. */
  canonicalCapability: "mark_read" | "archive" | null;
}

// ── Safe display data (§10) — PII-safe subset only ──────────────────────────
export interface NotificationDisplayData {
  counterpartHandle?: string | null;
  counterpartDisplayName?: string | null;
  counterpartAvatarUrl?: string | null;
  meetingTitle?: string | null;
  scheduledAt?: string | null;
  dueAt?: string | null;
  followUpTitle?: string | null;
  associationName?: string | null;
  scalars?: Record<string, string | number | boolean | null>;
}

// ── Notification DTO (§3) ───────────────────────────────────────────────────
export interface NotificationDTO {
  id: string;
  recipientUserId: string;
  sourceDomain: NotificationSourceDomain;
  sourceRecordId: string;
  eventKind: string;
  notificationKind: NotificationKind;
  titleKey: string;
  bodyKey: string;
  safeDisplayData: NotificationDisplayData;
  action: NotificationActionDTO;
  priority: NotificationPriority;
  status: NotificationStatus;
  scheduledFor: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  archivedAt: string | null;
  expiredAt: string | null;
  dedupeKey: string;
  schemaVersion: typeof NOTIFICATION_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
}

// ── Preferences (§17) ───────────────────────────────────────────────────────
export interface NotificationPreferencesDTO {
  userId: string;
  globalEnabled: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  digestMode: NotificationDigestMode;
  digestTime: string; // "HH:mm" wall clock
  timezone: string; // IANA
  quietHoursStart: string | null; // "HH:mm"
  quietHoursEnd: string | null; // "HH:mm"
  criticalBypassQuietHours: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferenceOverrideDTO {
  userId: string;
  notificationKind: NotificationKind;
  inAppEnabled: boolean | null;
  emailEnabled: boolean | null;
  pushEnabled: boolean | null;
  reminderEnabled: boolean | null;
}

// ── List cursor / filter (§68) ──────────────────────────────────────────────
export interface NotificationListFilters {
  status?: NotificationStatus | null;
  category?: NotificationPreferenceCategory | null;
  unreadOnly?: boolean | null;
  cursor?: string | null;
  limit?: number | null;
}

export interface NotificationListDTO {
  items: NotificationDTO[];
  nextCursor: string | null;
  policyVersion: typeof NOTIFICATION_POLICY_VERSION;
}

export interface NotificationCursor {
  v: typeof NOTIFICATION_POLICY_VERSION;
  t: string; // reference timestamp
  i: string; // notification id
  f: string | null; // filter fingerprint
}

// ── Bounds (§24, §67) ───────────────────────────────────────────────────────
export const NOTIFICATION_LIST_PAGE_SIZE_DEFAULT = 20;
export const NOTIFICATION_LIST_PAGE_SIZE_MAX = 100;
export const NOTIFICATION_SCHEDULER_CLAIM_DEFAULT = 100;
export const NOTIFICATION_SCHEDULER_CLAIM_MAX = 500;

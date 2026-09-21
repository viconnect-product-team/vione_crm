// BC-8.1 Turn B — Internal runtime types.
//
// These types are internal to the runtime. They are NOT part of the public
// NotificationOrchestrationSDK. Do NOT export from ../index.ts.
//
// The runtime layer:
//   - claims outbox events (SKIP LOCKED),
//   - revalidates canonical authority server-side (§9, §22),
//   - resolves recipients + templates (§7–§11),
//   - applies preferences + quiet hours (§17, §19),
//   - writes canonical notification rows idempotently on dedupe_key (§25),
//   - fans out channel dispatch rows,
//   - claims/dispatches with SKIP LOCKED, retries, dead-letters (§33–§34),
//   - runs bounded escalation and reconciliation (§29, §51).

import type {
  NotificationChannel,
  NotificationDisplayData,
  NotificationKind,
  NotificationPriority,
  NotificationSourceDomain,
  NotificationActionKind,
} from "../types";

/** Bounded batch sizes (§67). */
export const NOTIFICATION_BATCH_DEFAULTS = Object.freeze({
  outbox: 100,
  schedule: 100,
  dispatch: 100,
  escalation: 100,
  hardMax: 500,
  stuckThresholdMinutes: 15,
});

/** Adapter result kinds. */
export type AdapterResultKind =
  | "delivered"
  | "retryable"
  | "permanent"
  | "unsupported"
  | "suppressed";

export interface AdapterResult {
  kind: AdapterResultKind;
  errorCode?: string;
  /** Opaque provider reference (never PII). */
  externalReference?: string | null;
}

/** Canonical facts hydrated by the runtime BEFORE recipient/template resolution. */
export interface CanonicalFacts {
  sourceDomain: NotificationSourceDomain;
  sourceRecordId: string;
  eventKind: string;
  notificationKind: NotificationKind;
  actorUserId: string | null;
  /** Result of `resolveXRecipients` — pre-filtered by revalidation. */
  recipientUserIds: readonly string[];
  /** Facts scoped to what each recipient may safely see. */
  displayFacts: {
    counterpartHandle?: string | null;
    counterpartDisplayName?: string | null;
    counterpartAvatarUrl?: string | null;
    counterpartVisible?: boolean;
    meetingTitle?: string | null;
    scheduledAt?: string | null;
    dueAt?: string | null;
    followUpTitle?: string | null;
    associationName?: string | null;
    scalars?: Record<string, string | number | boolean | null>;
  };
  action: {
    kind: NotificationActionKind;
    targetRoute: string | null;
    targetParams: Record<string, string> | null;
    targetSearch: Record<string, string | number | boolean> | null;
  };
}

export interface RuntimeNotificationRow {
  id: string;
  recipient_user_id: string;
  source_domain: string;
  source_record_id: string;
  event_kind: string;
  notification_kind: NotificationKind;
  title_key: string;
  body_key: string;
  action_label_key: string | null;
  safe_display_data: NotificationDisplayData;
  action_kind: NotificationActionKind | null;
  action_target: Record<string, unknown> | null;
  priority: NotificationPriority;
  status: string;
  scheduled_for: string | null;
  delivered_at: string | null;
  read_at: string | null;
  archived_at: string | null;
  expired_at: string | null;
  dedupe_key: string;
  schema_version: string;
  policy_version: string;
}

export interface RuntimeDispatchRow {
  id: string;
  notification_id: string;
  channel: NotificationChannel;
  provider: string;
  status: string;
  attempt_count: number;
  next_retry_at: string | null;
  claimed_at: string | null;
  delivered_at: string | null;
  last_error_code: string | null;
  external_reference: string | null;
  payload_hash: string | null;
}

export interface ConsumeReport {
  claimed: number;
  processed: number;
  notificationsCreated: number;
  notificationsDeduped: number;
  suppressed: number;
  failed: number;
}

export interface DispatchReport {
  claimed: number;
  delivered: number;
  retried: number;
  deadLettered: number;
  failed: number;
}

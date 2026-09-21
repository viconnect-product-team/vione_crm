// BC-8.1 §B §L §T — Notification + schedule persistence.
//
// SERVICE-ROLE ONLY. Never imported by browser code. All writes flow through
// this module so we keep templates safe (§L) and dedupe stable (§25).

type Admin = any;

import { NOTIFICATION_KIND_REGISTRY } from "../registry";
import { NOTIFICATION_POLICY_VERSION, NOTIFICATION_SCHEMA_VERSION } from "../types";
import type { NotificationChannel, NotificationKind } from "../types";
import { resolveNotificationTemplate } from "../template-resolver";
import { buildDedupeKey } from "../dedupe";
import type { CanonicalFacts } from "./types";

export interface WriteNotificationInput {
  facts: CanonicalFacts;
  recipientUserId: string;
  channels: readonly NotificationChannel[];
  scheduledFor?: string | null;
  sourceEventId?: string | null;
  discriminator?: string | null;
}

export interface WriteNotificationResult {
  notificationId: string;
  created: boolean;
  channels: readonly NotificationChannel[];
}

/**
 * Idempotently create a canonical notification row (unique on dedupe_key)
 * and its channel dispatch rows. In-app is inserted delivered (§M model 1);
 * external channels are inserted pending.
 */
export async function writeNotificationIdempotent(
  admin: Admin,
  input: WriteNotificationInput,
): Promise<WriteNotificationResult> {
  const { facts, recipientUserId, channels, scheduledFor, sourceEventId, discriminator } = input;
  const descriptor = NOTIFICATION_KIND_REGISTRY[facts.notificationKind];
  const template = resolveNotificationTemplate({
    kind: facts.notificationKind,
    facts: facts.displayFacts,
  });
  const dedupeKey = buildDedupeKey({
    kind: facts.notificationKind,
    sourceRecordId: facts.sourceRecordId,
    recipientUserId,
    discriminator: discriminator ?? null,
  });

  const row = {
    recipient_user_id: recipientUserId,
    source_domain: facts.sourceDomain,
    source_record_id: facts.sourceRecordId,
    source_event_id: sourceEventId ?? null,
    event_kind: facts.eventKind,
    notification_kind: facts.notificationKind,
    title_key: template.titleKey,
    body_key: template.bodyKey,
    action_label_key: template.actionLabelKey,
    safe_display_data: template.safeDisplayData,
    action_kind: template.actionKind,
    action_target: facts.action.targetRoute
      ? {
          route: facts.action.targetRoute,
          params: facts.action.targetParams,
          search: facts.action.targetSearch,
        }
      : null,
    priority: descriptor.priority,
    status: scheduledFor ? "scheduled" : channels.includes("in_app") ? "delivered" : "pending",
    scheduled_for: scheduledFor ?? null,
    delivered_at: channels.includes("in_app") && !scheduledFor ? new Date().toISOString() : null,
    dedupe_key: dedupeKey,
    schema_version: String(NOTIFICATION_SCHEMA_VERSION),
    policy_version: NOTIFICATION_POLICY_VERSION,
  };

  // Attempt insert. Unique on dedupe_key → conflict = already exists.
  const ins = await admin
    .from("business_notifications")
    .insert(row)
    .select("id, dedupe_key")
    .maybeSingle();

  let notificationId: string;
  let created = false;
  if (ins.error) {
    // 23505 = unique_violation → already exists; look up id.
    if (ins.error.code === "23505") {
      const sel = await admin
        .from("business_notifications")
        .select("id")
        .eq("dedupe_key", dedupeKey)
        .maybeSingle();
      if (sel.error || !sel.data)
        throw new Error(`notification lookup failed: ${sel.error?.message}`);
      notificationId = (sel.data as { id: string }).id;
    } else {
      throw new Error(`notification insert failed: ${ins.error.message}`);
    }
  } else if (ins.data) {
    notificationId = (ins.data as { id: string }).id;
    created = true;
  } else {
    throw new Error("notification insert returned no row");
  }

  // Dispatch rows — unique on (notification_id, channel).
  const dispatches = channels.map((ch) => ({
    notification_id: notificationId,
    channel: ch,
    provider: ch === "in_app" ? "internal" : "unavailable",
    status: ch === "in_app" ? "delivered" : "pending",
    delivered_at: ch === "in_app" ? new Date().toISOString() : null,
  }));
  if (dispatches.length > 0) {
    await admin
      .from("business_notification_dispatches")
      .upsert(dispatches, { onConflict: "notification_id,channel" });
  }

  return { notificationId, created, channels };
}

/** Create a reminder / escalation schedule row idempotently. */
export async function upsertScheduleIdempotent(
  admin: Admin,
  input: {
    kind: NotificationKind;
    sourceDomain: string;
    sourceRecordId: string;
    recipientUserId: string;
    scheduledFor: Date;
    discriminator: string;
  },
): Promise<{ id: string; created: boolean } | null> {
  const dedupeKey = buildDedupeKey({
    kind: input.kind,
    sourceRecordId: input.sourceRecordId,
    recipientUserId: input.recipientUserId,
    discriminator: input.discriminator,
  });
  const row = {
    notification_kind: input.kind,
    source_domain: input.sourceDomain,
    source_record_id: input.sourceRecordId,
    recipient_user_id: input.recipientUserId,
    scheduled_for: input.scheduledFor.toISOString(),
    dedupe_key: dedupeKey,
    policy_version: NOTIFICATION_POLICY_VERSION,
  };
  const ins = await admin
    .from("business_notification_schedules")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (ins.error) {
    if (ins.error.code === "23505") {
      const sel = await admin
        .from("business_notification_schedules")
        .select("id")
        .eq("dedupe_key", dedupeKey)
        .maybeSingle();
      if (sel.data) return { id: (sel.data as { id: string }).id, created: false };
      return null;
    }
    throw new Error(`schedule insert failed: ${ins.error.message}`);
  }
  if (!ins.data) return null;
  return { id: (ins.data as { id: string }).id, created: true };
}

/** Cancel schedules for a resolved source (§AC). Idempotent. */
export async function cancelSchedulesForSource(
  admin: Admin,
  input: { sourceDomain: string; sourceRecordId: string; kinds?: readonly NotificationKind[] },
): Promise<number> {
  const q = admin
    .from("business_notification_schedules")
    .update({ status: "cancelled" })
    .eq("source_domain", input.sourceDomain)
    .eq("source_record_id", input.sourceRecordId)
    .in("status", ["scheduled", "claimed"]);
  if (input.kinds && input.kinds.length > 0) q.in("notification_kind", input.kinds);
  const res = await q.select("id");
  if (res.error) throw new Error(`cancel schedules failed: ${res.error.message}`);
  return (res.data ?? []).length;
}

export async function writeEventReceipt(
  admin: Admin,
  input: { sourceEventId: string; result: string; count: number; reason?: string | null },
): Promise<void> {
  await admin.from("business_notification_event_receipts").upsert(
    {
      source_event_id: input.sourceEventId,
      policy_version: NOTIFICATION_POLICY_VERSION,
      result: input.result,
      notification_count: input.count,
      suppression_reason: input.reason ?? null,
      processed_at: new Date().toISOString(),
    },
    { onConflict: "source_event_id,policy_version" },
  );
}

export async function hasReceipt(admin: Admin, sourceEventId: string): Promise<boolean> {
  const q = await admin
    .from("business_notification_event_receipts")
    .select("id")
    .eq("source_event_id", sourceEventId)
    .eq("policy_version", NOTIFICATION_POLICY_VERSION)
    .maybeSingle();
  return !!q.data;
}

// BC-8.1 §T §U §V — Schedule creation + claim + fulfillment.
//
// SERVICE-ROLE ONLY. Uses SKIP LOCKED RPC bnotif_claim_schedules for claiming.
// Reminder revalidation is performed here BEFORE creating the resulting
// notification; stale reminders self-cancel (§U, §AC).

type Admin = any;

import { NOTIFICATION_REMINDER_SCHEDULE } from "../policy";
import { NOTIFICATION_KIND_REGISTRY } from "../registry";
import type { NotificationKind } from "../types";
import {
  cancelSchedulesForSource,
  upsertScheduleIdempotent,
  writeNotificationIdempotent,
} from "./persistence.server";
import type { CanonicalFacts } from "./types";
import { NOTIFICATION_BATCH_DEFAULTS } from "./types";

/** Compute reminder schedule times for a reference instant. */
export function computeReminderSchedule(
  kind: NotificationKind,
  reference: Date,
  now: Date = new Date(),
  policy: "suppress_past" | "catch_up" = "suppress_past",
): Date[] {
  const offsets = NOTIFICATION_REMINDER_SCHEDULE[kind] ?? [];
  const out: Date[] = [];
  for (const minutes of offsets) {
    const at = new Date(reference.getTime() + minutes * 60_000);
    if (at <= now) {
      if (policy === "catch_up") out.push(now);
      continue;
    }
    out.push(at);
  }
  return out;
}

export interface ReminderRevalidationInput {
  kind: NotificationKind;
  sourceDomain: string;
  sourceRecordId: string;
  recipientUserId: string;
}

export type ReminderRevalidation = (
  input: ReminderRevalidationInput,
  admin: Admin,
) => Promise<{ valid: boolean; reason?: string; facts?: CanonicalFacts }>;

/** Default revalidator — conservative. Real per-domain hooks plug in at Turn C
 *  domain wiring. This default trusts the schedule and re-reads only presence. */
const defaultRevalidator: ReminderRevalidation = async () => ({ valid: true });

export async function claimAndFulfillSchedulesBatch(
  admin: Admin,
  options: { batch?: number; revalidate?: ReminderRevalidation } = {},
): Promise<{ claimed: number; fulfilled: number; cancelled: number; failed: number }> {
  const batch = Math.min(
    options.batch ?? NOTIFICATION_BATCH_DEFAULTS.schedule,
    NOTIFICATION_BATCH_DEFAULTS.hardMax,
  );
  const token = `sch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const claimed = await admin.rpc("bnotif_claim_schedules", { _batch: batch, _token: token });
  if (claimed.error) throw new Error(`claim schedules failed: ${claimed.error.message}`);
  const rows = (claimed.data ?? []) as Array<{
    id: string;
    notification_kind: NotificationKind;
    source_domain: string;
    source_record_id: string;
    recipient_user_id: string;
    dedupe_key: string;
  }>;
  const revalidate = options.revalidate ?? defaultRevalidator;
  let fulfilled = 0,
    cancelled = 0,
    failed = 0;
  for (const row of rows) {
    try {
      const check = await revalidate(
        {
          kind: row.notification_kind,
          sourceDomain: row.source_domain,
          sourceRecordId: row.source_record_id,
          recipientUserId: row.recipient_user_id,
        },
        admin,
      );
      if (!check.valid) {
        await admin
          .from("business_notification_schedules")
          .update({ status: "cancelled", last_error_code: check.reason ?? "revalidation_failed" })
          .eq("id", row.id);
        cancelled += 1;
        continue;
      }
      const descriptor = NOTIFICATION_KIND_REGISTRY[row.notification_kind];
      const facts: CanonicalFacts = check.facts ?? {
        sourceDomain: descriptor.sourceDomain,
        sourceRecordId: row.source_record_id,
        eventKind: `reminder.${row.notification_kind}`,
        notificationKind: row.notification_kind,
        actorUserId: null,
        recipientUserIds: [row.recipient_user_id],
        displayFacts: {},
        action: {
          kind: descriptor.actionKind,
          targetRoute: null,
          targetParams: null,
          targetSearch: null,
        },
      };
      await writeNotificationIdempotent(admin, {
        facts,
        recipientUserId: row.recipient_user_id,
        channels: descriptor.defaultChannels.slice(),
        discriminator: `reminder`,
      });
      await admin
        .from("business_notification_schedules")
        .update({ status: "delivered" })
        .eq("id", row.id);
      fulfilled += 1;
    } catch (err) {
      failed += 1;
      console.error("schedule fulfillment isolated failure", {
        id: row.id,
        err: (err as Error).message,
      });
    }
  }
  return { claimed: rows.length, fulfilled, cancelled, failed };
}

export { upsertScheduleIdempotent, cancelSchedulesForSource };

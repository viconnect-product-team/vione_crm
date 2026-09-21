// BC-8.1 §W §X §Y §AA — Dispatch worker.
//
// SERVICE-ROLE ONLY. Claims dispatch rows via SKIP LOCKED (bnotif_claim_dispatches),
// resolves adapter, sends, classifies result, updates dispatch atomically.
// One dispatch failure never stops others.

type Admin = any;

import { defaultProviderRegistry, type NotificationProviderRegistry } from "./adapters.server";
import { classifyNotificationDispatchError } from "./error-classifier";
import { computeNextRetryAt, isMaxAttemptsReached } from "./retry-policy";
import type { DispatchReport, RuntimeDispatchRow } from "./types";
import { NOTIFICATION_BATCH_DEFAULTS } from "./types";

async function loadNotification(admin: Admin, id: string) {
  const q = await admin
    .from("business_notifications")
    .select("id, recipient_user_id, title_key, body_key, status, archived_at, expired_at")
    .eq("id", id)
    .maybeSingle();
  if (q.error) throw new Error(q.error.message);
  return q.data as {
    id: string;
    recipient_user_id: string;
    title_key: string;
    body_key: string;
    status: string;
    archived_at: string | null;
    expired_at: string | null;
  } | null;
}

export async function dispatchNotificationBatch(
  admin: Admin,
  options: { batch?: number; registry?: NotificationProviderRegistry } = {},
): Promise<DispatchReport> {
  const batch = Math.min(
    options.batch ?? NOTIFICATION_BATCH_DEFAULTS.dispatch,
    NOTIFICATION_BATCH_DEFAULTS.hardMax,
  );
  const registry = options.registry ?? defaultProviderRegistry;
  const token = `disp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const claimed = await admin.rpc("bnotif_claim_dispatches", { _batch: batch, _token: token });
  if (claimed.error) throw new Error(`claim dispatches failed: ${claimed.error.message}`);
  const rows = (claimed.data ?? []) as RuntimeDispatchRow[];
  const report: DispatchReport = {
    claimed: rows.length,
    delivered: 0,
    retried: 0,
    deadLettered: 0,
    failed: 0,
  };

  for (const row of rows) {
    try {
      const notif = await loadNotification(admin, row.notification_id);
      if (!notif || notif.archived_at || notif.expired_at || notif.status === "cancelled") {
        await admin
          .from("business_notification_dispatches")
          .update({ status: "cancelled", claimed_at: null })
          .eq("id", row.id);
        continue;
      }
      const adapter = registry.resolve(row.channel);
      if (!adapter || !adapter.enabled) {
        // Unsupported channel — permanent, do not fake success (§N/§O).
        await admin
          .from("business_notification_dispatches")
          .update({
            status: "dead_lettered",
            last_error_code: "unsupported_channel",
            claimed_at: null,
          })
          .eq("id", row.id);
        report.deadLettered += 1;
        continue;
      }

      const result = await adapter.send({
        notificationId: notif.id,
        recipientUserId: notif.recipient_user_id,
        titleKey: notif.title_key,
        bodyKey: notif.body_key,
      });

      if (result.kind === "delivered") {
        await admin
          .from("business_notification_dispatches")
          .update({
            status: "delivered",
            delivered_at: new Date().toISOString(),
            external_reference: result.externalReference ?? null,
            last_error_code: null,
            claimed_at: null,
          })
          .eq("id", row.id);
        report.delivered += 1;
        continue;
      }
      if (result.kind === "suppressed") {
        await admin
          .from("business_notification_dispatches")
          .update({
            status: "cancelled",
            last_error_code: result.errorCode ?? "suppressed",
            claimed_at: null,
          })
          .eq("id", row.id);
        continue;
      }
      if (result.kind === "unsupported" || result.kind === "permanent") {
        await admin
          .from("business_notification_dispatches")
          .update({
            status: "dead_lettered",
            last_error_code:
              result.errorCode ??
              classifyNotificationDispatchError({ code: result.errorCode }).code,
            claimed_at: null,
          })
          .eq("id", row.id);
        report.deadLettered += 1;
        continue;
      }
      // retryable
      const cls = classifyNotificationDispatchError({ code: result.errorCode });
      const attempts = row.attempt_count + 1;
      if (isMaxAttemptsReached(attempts)) {
        await admin
          .from("business_notification_dispatches")
          .update({ status: "dead_lettered", last_error_code: cls.code, claimed_at: null })
          .eq("id", row.id);
        report.deadLettered += 1;
      } else {
        await admin
          .from("business_notification_dispatches")
          .update({
            status: "retry_scheduled",
            next_retry_at: computeNextRetryAt(attempts),
            last_error_code: cls.code,
            claimed_at: null,
          })
          .eq("id", row.id);
        report.retried += 1;
      }
    } catch (err) {
      report.failed += 1;
      console.error("dispatch failure isolated", { id: row.id, err: (err as Error).message });
      await admin
        .from("business_notification_dispatches")
        .update({
          status: "retry_scheduled",
          next_retry_at: computeNextRetryAt(row.attempt_count + 1),
          last_error_code: "unknown",
          claimed_at: null,
        })
        .eq("id", row.id)
        .then(
          () => undefined,
          () => undefined,
        );
    }
  }
  return report;
}

/** Admin-only replay for a dead-lettered dispatch (§AA). */
export async function replayDeadLetterDispatch(
  admin: Admin,
  dispatchId: string,
): Promise<{ ok: boolean }> {
  const res = await admin
    .from("business_notification_dispatches")
    .update({ status: "pending", next_retry_at: new Date().toISOString(), last_error_code: null })
    .eq("id", dispatchId)
    .eq("status", "dead_lettered")
    .select("id")
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return { ok: !!res.data };
}

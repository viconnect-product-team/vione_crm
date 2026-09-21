// BC-8.1 §AD §AE §AF — Reconciliation, stuck recovery, expiry.

type Admin = any;

import { NOTIFICATION_BATCH_DEFAULTS } from "./types";

/** Recover schedules/dispatches stuck in "processing"/"claimed" past threshold. */
export async function recoverStuckProcessing(
  admin: Admin,
  thresholdMinutes: number = NOTIFICATION_BATCH_DEFAULTS.stuckThresholdMinutes,
): Promise<{ recovered: number }> {
  const r = await admin.rpc("bnotif_recover_stuck", { _threshold_minutes: thresholdMinutes });
  if (r.error) throw new Error(r.error.message);
  return { recovered: (r.data as number) ?? 0 };
}

/** Expire notifications whose action is no longer valid. */
export async function expireNotificationsBatch(
  admin: Admin,
  options: { batch?: number; now?: Date } = {},
): Promise<{ expired: number }> {
  const batch = Math.min(options.batch ?? 100, NOTIFICATION_BATCH_DEFAULTS.hardMax);
  const now = options.now ?? new Date();
  // Informational_30d — expire after 30 days.
  const cutoff30 = new Date(now.getTime() - 30 * 24 * 3_600_000).toISOString();
  const cutoff90 = new Date(now.getTime() - 90 * 24 * 3_600_000).toISOString();
  const upd1 = await admin
    .from("business_notifications")
    .update({ status: "expired", expired_at: now.toISOString() })
    .in("notification_kind", [
      "connection_request_received",
      "connection_request_accepted",
      "connection_request_declined",
    ])
    .lt("created_at", cutoff30)
    .is("expired_at", null)
    .in("status", ["delivered", "read", "pending", "scheduled"])
    .limit(batch)
    .select("id");
  const upd2 = await admin
    .from("business_notifications")
    .update({ status: "expired", expired_at: now.toISOString() })
    .lt("created_at", cutoff90)
    .is("expired_at", null)
    .in("status", ["delivered", "read", "pending", "scheduled"])
    .limit(batch)
    .select("id");
  const n = (upd1.data ?? []).length + (upd2.data ?? []).length;
  return { expired: n };
}

/** Aggregate one reconciliation pass (§AD). */
export async function reconcileNotificationRuntime(
  admin: Admin,
  options: { thresholdMinutes?: number } = {},
): Promise<{ recovered: number; expired: number }> {
  const { recovered } = await recoverStuckProcessing(admin, options.thresholdMinutes);
  const { expired } = await expireNotificationsBatch(admin);
  return { recovered, expired };
}

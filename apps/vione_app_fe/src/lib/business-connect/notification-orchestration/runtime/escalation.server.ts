// BC-8.1 §AB §AC — Escalation runtime. Bounded and revalidation-gated.

type Admin = any;

import { NOTIFICATION_ESCALATION_POLICY } from "../policy";
import type { NotificationKind } from "../types";
import { buildDedupeKey, escalationDiscriminator } from "../dedupe";
import { NOTIFICATION_POLICY_VERSION } from "../types";

export function computeEscalationSteps(
  kind: NotificationKind,
  base: Date,
): { level: number; at: Date }[] {
  const hoursList = NOTIFICATION_ESCALATION_POLICY[kind] ?? [];
  return hoursList.map((h, idx) => ({
    level: idx + 1,
    at: new Date(base.getTime() + h * 3_600_000),
  }));
}

/** Idempotently persist escalation rows for the given source + recipient. */
export async function seedEscalationSchedule(
  admin: Admin,
  input: {
    kind: NotificationKind;
    sourceDomain: string;
    sourceRecordId: string;
    recipientUserId: string;
    base: Date;
    policyKey: string;
  },
): Promise<{ created: number }> {
  const steps = computeEscalationSteps(input.kind, input.base);
  if (steps.length === 0) return { created: 0 };
  const rows = steps.map((s) => ({
    source_domain: input.sourceDomain,
    source_record_id: input.sourceRecordId,
    recipient_user_id: input.recipientUserId,
    policy_key: input.policyKey,
    escalation_level: s.level,
    next_run_at: s.at.toISOString(),
    dedupe_key: buildDedupeKey({
      kind: input.kind,
      sourceRecordId: input.sourceRecordId,
      recipientUserId: input.recipientUserId,
      discriminator: escalationDiscriminator(s.level),
    }),
  }));
  const res = await admin
    .from("business_notification_escalations")
    .upsert(rows, { onConflict: "dedupe_key" })
    .select("id");
  if (res.error) throw new Error(res.error.message);
  return { created: (res.data ?? []).length };
}

/** Cancel all future escalations for a source (§AC). */
export async function cancelEscalationsForSource(
  admin: Admin,
  input: { sourceDomain: string; sourceRecordId: string },
): Promise<number> {
  const res = await admin
    .from("business_notification_escalations")
    .update({ status: "cancelled" })
    .eq("source_domain", input.sourceDomain)
    .eq("source_record_id", input.sourceRecordId)
    .in("status", ["scheduled", "claimed"])
    .select("id");
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []).length;
}
export { NOTIFICATION_POLICY_VERSION };

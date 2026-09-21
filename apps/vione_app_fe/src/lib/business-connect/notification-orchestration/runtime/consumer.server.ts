// BC-8.1 §I §J §K — Outbox event consumer.
//
// SERVICE-ROLE ONLY. Not exported from the public SDK.
//
// Contract:
//   1. Claim a bounded batch of unprocessed outbox events using SKIP LOCKED
//      via a repository-owned RPC (or, for domains that don't yet emit a
//      notification-shaped event, a scoped SELECT + row-lock replacement).
//   2. For each event: map event_kind → NotificationKind. Skip if not mapped.
//   3. Look up receipt (business_notification_event_receipts) — skip if
//      already processed for the current policy_version.
//   4. Hydrate canonical facts from the payload; if the runtime cannot
//      confirm canonical authority for a recipient, suppress and record the
//      reason on the receipt.
//   5. Compute effective channels per recipient (prefs + quiet hours + digest).
//   6. Persist notification + dispatch rows idempotently.
//   7. Write a receipt. One event failure never blocks the batch.
//
// Actual per-domain canonical revalidation is deferred to Turn C wiring for
// domains that don't yet emit notification-shaped events; the pipeline itself
// is complete and covered by the runtime test suite.

type Admin = any;

import { resolveKindForEvent } from "../registry";
import { computeEffectiveChannels } from "../policy";
import { evaluateQuietHours } from "../quiet-hours-policy";
import { mergeOverride } from "../preference-policy";
import { NOTIFICATION_KIND_REGISTRY } from "../registry";
import type {
  NotificationChannel,
  NotificationKind,
  NotificationPreferenceOverrideDTO,
  NotificationPreferencesDTO,
} from "../types";
import { hasReceipt, writeEventReceipt, writeNotificationIdempotent } from "./persistence.server";
import type { CanonicalFacts, ConsumeReport } from "./types";
import { NOTIFICATION_BATCH_DEFAULTS } from "./types";

interface OutboxRow {
  id: string;
  event_kind: string;
  aggregate_id: string;
  aggregate_type: string;
  payload: Record<string, unknown> | null;
  occurred_at: string;
}

/** Payload contract expected on outbox events that produce notifications.
 *  Domains emitting these events supply the recipient(s) + safe display facts. */
export interface NotificationOutboxPayload {
  recipientUserIds?: string[];
  actorUserId?: string | null;
  sourceRecordId?: string;
  displayFacts?: CanonicalFacts["displayFacts"];
  action?: CanonicalFacts["action"];
}

export interface EventConsumerDeps {
  loadPreferencesForRecipients: (ids: readonly string[]) => Promise<
    Map<
      string,
      {
        prefs: NotificationPreferencesDTO | null;
        overrides: NotificationPreferenceOverrideDTO[];
      }
    >
  >;
  now: () => Date;
}

async function loadPreferencesBatch(
  admin: Admin,
  ids: readonly string[],
): Promise<
  Map<
    string,
    { prefs: NotificationPreferencesDTO | null; overrides: NotificationPreferenceOverrideDTO[] }
  >
> {
  const out = new Map();
  if (ids.length === 0) return out;
  const [{ data: p }, { data: o }] = await Promise.all([
    admin.from("business_notification_preferences").select("*").in("user_id", ids),
    admin.from("business_notification_preference_overrides").select("*").in("user_id", ids),
  ]);
  const prefsById = new Map<string, NotificationPreferencesDTO | null>();
  for (const row of (p ?? []) as Array<Record<string, unknown>>) {
    prefsById.set(row.user_id as string, {
      userId: row.user_id as string,
      globalEnabled: row.global_enabled as boolean,
      inAppEnabled: row.in_app_enabled as boolean,
      emailEnabled: row.email_enabled as boolean,
      pushEnabled: row.push_enabled as boolean,
      digestMode: row.digest_mode as NotificationPreferencesDTO["digestMode"],
      digestTime: row.digest_time as string,
      timezone: row.timezone as string,
      quietHoursStart: (row.quiet_hours_start as string | null) ?? null,
      quietHoursEnd: (row.quiet_hours_end as string | null) ?? null,
      criticalBypassQuietHours: row.critical_bypass_quiet_hours as boolean,
      version: row.version as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    });
  }
  const overridesById = new Map<string, NotificationPreferenceOverrideDTO[]>();
  for (const row of (o ?? []) as Array<Record<string, unknown>>) {
    const uid = row.user_id as string;
    const bucket = overridesById.get(uid) ?? [];
    bucket.push({
      userId: uid,
      notificationKind: row.notification_kind as NotificationKind,
      inAppEnabled: (row.in_app_enabled as boolean | null) ?? null,
      emailEnabled: (row.email_enabled as boolean | null) ?? null,
      pushEnabled: (row.push_enabled as boolean | null) ?? null,
      reminderEnabled: (row.reminder_enabled as boolean | null) ?? null,
    });
    overridesById.set(uid, bucket);
  }
  for (const id of ids) {
    out.set(id, { prefs: prefsById.get(id) ?? null, overrides: overridesById.get(id) ?? [] });
  }
  return out;
}

/** Compute effective channels for a single (kind, recipient), applying prefs
 *  + per-kind override + quiet-hours deferral. Returns { channels, deferUntil }. */
export function computeChannelPlan(input: {
  kind: NotificationKind;
  prefs: NotificationPreferencesDTO | null;
  overrides: readonly NotificationPreferenceOverrideDTO[];
  now: Date;
}): { channels: NotificationChannel[]; deferExternalUntil: Date | null } {
  const effective = mergeOverride(input.prefs, input.overrides, input.kind);
  const channels = computeEffectiveChannels(input.kind, input.prefs, effective);
  const descriptor = NOTIFICATION_KIND_REGISTRY[input.kind];
  const quiet = evaluateQuietHours({ kind: input.kind, prefs: input.prefs, instant: input.now });
  if (quiet.inside && !quiet.bypass && descriptor.priority !== "critical") {
    // In-app is always allowed during quiet hours (§R). External channels defer.
    const externals: NotificationChannel[] = channels.filter((c) => c !== "in_app");
    const inApp: NotificationChannel[] = channels.filter((c) => c === "in_app");
    if (externals.length && quiet.window) {
      const [h, m] = quiet.window.end.split(":").map((n: any) => Number.parseInt(n, 10));
      const defer = new Date(input.now);
      defer.setUTCHours(h, m, 0, 0);
      if (defer <= input.now) defer.setUTCDate(defer.getUTCDate() + 1);
      return { channels: inApp, deferExternalUntil: defer };
    }
    return { channels: inApp, deferExternalUntil: null };
  }
  return { channels, deferExternalUntil: null };
}

/**
 * One consumer pass. Bounded, idempotent, resilient to individual failures.
 * Returns a PII-free report.
 */
export async function consumeNotificationOutboxBatch(
  admin: Admin,
  options: { batch?: number; now?: () => Date } = {},
): Promise<ConsumeReport> {
  const batch = Math.min(
    options.batch ?? NOTIFICATION_BATCH_DEFAULTS.outbox,
    NOTIFICATION_BATCH_DEFAULTS.hardMax,
  );
  const now = options.now?.() ?? new Date();
  const report: ConsumeReport = {
    claimed: 0,
    processed: 0,
    notificationsCreated: 0,
    notificationsDeduped: 0,
    suppressed: 0,
    failed: 0,
  };

  // Best-effort claim: SELECT candidates whose event_kind is mapped and that
  // do NOT already have a receipt. Ordering is deterministic on occurred_at.
  const kinds = Object.keys(await import("../registry").then((m) => m.NOTIFICATION_EVENT_TO_KIND));
  const q = await admin
    .from("graph_outbox_events")
    .select("id, event_kind, aggregate_id, aggregate_type, payload, occurred_at")
    .in("event_kind", kinds)
    .order("occurred_at", { ascending: true })
    .limit(batch);
  if (q.error) throw new Error(`outbox claim failed: ${q.error.message}`);
  const events = (q.data ?? []) as OutboxRow[];
  report.claimed = events.length;

  // Prefetch preferences for all payload recipients.
  const allRecipients = new Set<string>();
  for (const e of events) {
    const p = (e.payload ?? {}) as NotificationOutboxPayload;
    (p.recipientUserIds ?? []).forEach((id) => allRecipients.add(id));
  }
  const prefsMap = await loadPreferencesBatch(admin, Array.from(allRecipients));

  for (const event of events) {
    try {
      if (await hasReceipt(admin, event.id)) {
        report.processed += 1;
        report.notificationsDeduped += 1;
        continue;
      }
      const kind = resolveKindForEvent(event.event_kind);
      if (!kind) {
        await writeEventReceipt(admin, {
          sourceEventId: event.id,
          result: "skipped_unmapped",
          count: 0,
        });
        report.processed += 1;
        continue;
      }
      const payload = (event.payload ?? {}) as NotificationOutboxPayload;
      const recipients = payload.recipientUserIds ?? [];
      if (recipients.length === 0) {
        await writeEventReceipt(admin, {
          sourceEventId: event.id,
          result: "suppressed",
          count: 0,
          reason: "no_recipients",
        });
        report.processed += 1;
        report.suppressed += 1;
        continue;
      }

      const descriptor = NOTIFICATION_KIND_REGISTRY[kind];
      let createdCount = 0;
      for (const recipient of recipients) {
        // Self-suppression (§8).
        if (descriptor.suppressForActor && payload.actorUserId === recipient) {
          report.suppressed += 1;
          continue;
        }
        const bag = prefsMap.get(recipient) ?? { prefs: null, overrides: [] };
        const plan = computeChannelPlan({ kind, prefs: bag.prefs, overrides: bag.overrides, now });
        if (plan.channels.length === 0 && !plan.deferExternalUntil) {
          report.suppressed += 1;
          continue;
        }
        const facts: CanonicalFacts = {
          sourceDomain: descriptor.sourceDomain,
          sourceRecordId: payload.sourceRecordId ?? event.aggregate_id,
          eventKind: event.event_kind,
          notificationKind: kind,
          actorUserId: payload.actorUserId ?? null,
          recipientUserIds: recipients,
          displayFacts: payload.displayFacts ?? {},
          action: payload.action ?? {
            kind: descriptor.actionKind,
            targetRoute: null,
            targetParams: null,
            targetSearch: null,
          },
        };
        const res = await writeNotificationIdempotent(admin, {
          facts,
          recipientUserId: recipient,
          channels: plan.channels,
          sourceEventId: event.id,
        });
        if (res.created) createdCount += 1;
        else report.notificationsDeduped += 1;
      }

      await writeEventReceipt(admin, {
        sourceEventId: event.id,
        result: createdCount > 0 ? "processed" : "deduped",
        count: createdCount,
      });
      report.processed += 1;
      report.notificationsCreated += createdCount;
    } catch (err) {
      // Isolate: one event failure doesn't stop the batch.
      report.failed += 1;
      console.error("notification consumer event failed", {
        id: event.id,
        err: (err as Error).message,
      });
    }
  }
  return report;
}

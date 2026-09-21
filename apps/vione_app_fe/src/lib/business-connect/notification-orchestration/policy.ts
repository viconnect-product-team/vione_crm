// BC-8.1 §6 §16 §21 §27 §29 — Deterministic policy computations.
//
// Pure functions only. No DB. No side effects. The runtime layer imports these
// helpers to decide channel set, reminder timing, expiry, and escalation.

import { NOTIFICATION_KIND_REGISTRY } from "./registry";
import type {
  NotificationChannel,
  NotificationDigestMode,
  NotificationKind,
  NotificationPreferencesDTO,
  NotificationPriority,
} from "./types";

/** Reminder schedule per kind (§21). Absolute offsets in minutes relative to
 *  the reference time (meeting.startsAt / follow_up.dueAt / meeting end for
 *  outcome / introduction acceptance for delivery). Negative = BEFORE, 0/positive = AFTER. */
export const NOTIFICATION_REMINDER_SCHEDULE: Readonly<
  Partial<Record<NotificationKind, readonly number[]>>
> = Object.freeze({
  meeting_upcoming_reminder: [-24 * 60, -60],
  follow_up_due_soon: [-24 * 60],
  follow_up_overdue: [0],
  meeting_outcome_missing: [24 * 60],
  introduction_delivery_required: [48 * 60], // ~2 days after acceptance
});

/** Escalation policy for unresolved actions (§29). Values are hours between
 *  successive reminders after the initial notification. Frozen bounded steps. */
export const NOTIFICATION_ESCALATION_POLICY: Readonly<
  Partial<Record<NotificationKind, readonly number[]>>
> = Object.freeze({
  follow_up_overdue: [24, 72], // +24h, then +72h. Stop on completion/cancellation.
  meeting_invitation_received: [], // one-shot; reminder handled by upcoming reminder
  introduction_delivery_required: [72], // one repeat only
});

/** Bounded retry backoff (§33). Minutes. */
export const NOTIFICATION_RETRY_BACKOFF_MINUTES: readonly number[] = [1, 5, 15, 60, 360];
export const NOTIFICATION_MAX_ATTEMPTS = NOTIFICATION_RETRY_BACKOFF_MINUTES.length + 1;

/** Retryable vs permanent error classification (§33). */
export const NOTIFICATION_RETRYABLE_ERROR_CODES = [
  "timeout",
  "rate_limited",
  "provider_5xx",
  "temporary_unavailable",
] as const;
export const NOTIFICATION_PERMANENT_ERROR_CODES = [
  "invalid_recipient",
  "provider_disabled",
  "revoked_token",
  "unsupported_channel",
  "malformed_payload",
] as const;
export type NotificationRetryableCode = (typeof NOTIFICATION_RETRYABLE_ERROR_CODES)[number];
export type NotificationPermanentCode = (typeof NOTIFICATION_PERMANENT_ERROR_CODES)[number];

export function classifyDispatchError(code: string): "retryable" | "permanent" | "unknown" {
  if ((NOTIFICATION_RETRYABLE_ERROR_CODES as readonly string[]).includes(code)) return "retryable";
  if ((NOTIFICATION_PERMANENT_ERROR_CODES as readonly string[]).includes(code)) return "permanent";
  return "unknown";
}

/** Digest eligibility (§18). Critical/high never defer to weekly. */
export function isEligibleForDigest(kind: NotificationKind, mode: NotificationDigestMode): boolean {
  if (mode === "off" || mode === "immediate") return false;
  const d = NOTIFICATION_KIND_REGISTRY[kind];
  if (!d.digestEligible) return false;
  if (d.priority === "critical" || d.priority === "high") return false;
  return true;
}

/** Apply user preferences + digest to compute the effective channel set (§16, §17). */
export function computeEffectiveChannels(
  kind: NotificationKind,
  prefs: NotificationPreferencesDTO | null,
  override?: {
    inAppEnabled?: boolean | null;
    emailEnabled?: boolean | null;
    pushEnabled?: boolean | null;
  } | null,
): NotificationChannel[] {
  const d = NOTIFICATION_KIND_REGISTRY[kind];
  // Critical channels are unaffected by globalEnabled=false.
  const globalOff = prefs ? !prefs.globalEnabled && !d.critical : false;
  if (globalOff) return [];
  const allow = (ch: NotificationChannel): boolean => {
    if (d.critical) return d.defaultChannels.includes(ch); // §46
    // Overrides win over prefs; nulls fall through.
    const ov = override
      ? ch === "in_app"
        ? override.inAppEnabled
        : ch === "email"
          ? override.emailEnabled
          : override.pushEnabled
      : null;
    if (ov === false) return false;
    if (ov === true) return d.defaultChannels.includes(ch);
    if (!prefs) return d.defaultChannels.includes(ch);
    if (ch === "in_app") return prefs.inAppEnabled && d.defaultChannels.includes(ch);
    if (ch === "email") return prefs.emailEnabled && d.defaultChannels.includes(ch);
    return prefs.pushEnabled && d.defaultChannels.includes(ch);
  };
  return d.defaultChannels.filter(allow);
}

/** Priority ranking used for stable sort. Lower = more urgent. */
export const NOTIFICATION_PRIORITY_RANK: Readonly<Record<NotificationPriority, number>> =
  Object.freeze({ critical: 0, high: 1, normal: 2, informational: 3 });

export function comparePriority(a: NotificationPriority, b: NotificationPriority): number {
  return NOTIFICATION_PRIORITY_RANK[a] - NOTIFICATION_PRIORITY_RANK[b];
}

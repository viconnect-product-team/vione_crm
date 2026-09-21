// BC-8.1 §17 §18 §45 — Preference & override merge policy.
//
// Pure deterministic merge. Runtime callers combine (base preferences) with
// (per-kind overrides) to decide effective channel eligibility. Actual channel
// filtering lives in `policy.computeEffectiveChannels`.

import type {
  NotificationDigestMode,
  NotificationKind,
  NotificationPreferenceCategory,
  NotificationPreferenceOverrideDTO,
  NotificationPreferencesDTO,
} from "./types";
import { NOTIFICATION_DIGEST_MODES, NOTIFICATION_PREFERENCE_CATEGORIES } from "./types";
import { NotificationError } from "./errors";
import { NOTIFICATION_KIND_REGISTRY } from "./registry";

export const DEFAULT_PREFERENCES: Omit<
  NotificationPreferencesDTO,
  "userId" | "createdAt" | "updatedAt" | "version"
> = Object.freeze({
  globalEnabled: true,
  inAppEnabled: true,
  emailEnabled: false, // activated when email infra ships (§37)
  pushEnabled: false, // activated when push infra ships (§38)
  digestMode: "off",
  digestTime: "08:00",
  timezone: "Asia/Ho_Chi_Minh",
  quietHoursStart: null,
  quietHoursEnd: null,
  criticalBypassQuietHours: true,
});

export interface EffectivePreference {
  inAppEnabled: boolean | null;
  emailEnabled: boolean | null;
  pushEnabled: boolean | null;
  reminderEnabled: boolean | null;
}

export function mergeOverride(
  prefs: NotificationPreferencesDTO | null,
  overrides: readonly NotificationPreferenceOverrideDTO[] | null,
  kind: NotificationKind,
): EffectivePreference {
  const ov = overrides?.find((o) => o.notificationKind === kind) ?? null;
  return {
    inAppEnabled: ov?.inAppEnabled ?? (prefs ? prefs.inAppEnabled : null),
    emailEnabled: ov?.emailEnabled ?? (prefs ? prefs.emailEnabled : null),
    pushEnabled: ov?.pushEnabled ?? (prefs ? prefs.pushEnabled : null),
    reminderEnabled: ov?.reminderEnabled ?? null,
  };
}

/** UI grouping — kinds bucketed under preference categories (§45). */
export function categoryForKind(kind: NotificationKind): NotificationPreferenceCategory {
  return NOTIFICATION_KIND_REGISTRY[kind].category;
}

// ── Validators (§57) ────────────────────────────────────────────────────────

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateDigestMode(mode: string): NotificationDigestMode {
  if (!(NOTIFICATION_DIGEST_MODES as readonly string[]).includes(mode)) {
    throw new NotificationError("NOTIFICATION_INVALID_PREFERENCE", `Unknown digest mode: ${mode}`);
  }
  return mode as NotificationDigestMode;
}

export function validateHhmm(
  v: string,
  code:
    | "NOTIFICATION_INVALID_PREFERENCE"
    | "NOTIFICATION_INVALID_QUIET_HOURS" = "NOTIFICATION_INVALID_PREFERENCE",
): string {
  if (!HHMM_RE.test(v)) throw new NotificationError(code, `Invalid time: ${v}`);
  return v;
}

export function validateTimezone(tz: string): string {
  try {
    // Uses ICU tz database when available.
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    throw new NotificationError("NOTIFICATION_INVALID_TIMEZONE", `Invalid timezone: ${tz}`);
  }
}

export function validateCategory(c: string): NotificationPreferenceCategory {
  if (!(NOTIFICATION_PREFERENCE_CATEGORIES as readonly string[]).includes(c)) {
    throw new NotificationError("NOTIFICATION_INVALID_PREFERENCE", `Unknown category: ${c}`);
  }
  return c as NotificationPreferenceCategory;
}

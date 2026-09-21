// BC-8.1 §19 §20 §46 — Quiet-hours policy.
//
// Wall-clock interval in an IANA timezone; supports cross-midnight windows.
// DST-safe: local wall clock is derived from `Intl.DateTimeFormat` at the
// given instant, avoiding fixed UTC offsets.

import { NotificationError } from "./errors";
import { NOTIFICATION_KIND_REGISTRY } from "./registry";
import { validateHhmm, validateTimezone } from "./preference-policy";
import type { NotificationKind, NotificationPreferencesDTO } from "./types";

export interface QuietHoursWindow {
  /** "HH:mm" local wall clock. */
  start: string;
  end: string;
  timezone: string; // IANA
}

export function normalizeQuietHours(
  start: string | null,
  end: string | null,
  timezone: string,
): QuietHoursWindow | null {
  if (!start && !end) return null;
  if (!start || !end) {
    throw new NotificationError(
      "NOTIFICATION_INVALID_QUIET_HOURS",
      "Quiet hours require both start and end",
    );
  }
  return {
    start: validateHhmm(start, "NOTIFICATION_INVALID_QUIET_HOURS"),
    end: validateHhmm(end, "NOTIFICATION_INVALID_QUIET_HOURS"),
    timezone: validateTimezone(timezone),
  };
}

/** Returns the local wall-clock HH:mm for the instant in the given tz. */
export function getLocalHhmm(instant: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  // en-GB yields "HH:mm"
  return fmt.format(instant);
}

function hhmmToMinutes(v: string): number {
  const [h, m] = v.split(":").map((n: any) => Number.parseInt(n, 10));
  return h * 60 + m;
}

/** True when `instant` falls inside the wall-clock quiet window (§19). */
export function isInsideQuietHours(instant: Date, w: QuietHoursWindow): boolean {
  const now = hhmmToMinutes(getLocalHhmm(instant, w.timezone));
  const start = hhmmToMinutes(w.start);
  const end = hhmmToMinutes(w.end);
  if (start === end) return false;
  if (start < end) return now >= start && now < end;
  // Cross-midnight (e.g. 22:00–07:00).
  return now >= start || now < end;
}

/** Combined evaluation for a notification kind at a given instant. §19 + §46. */
export function evaluateQuietHours(input: {
  kind: NotificationKind;
  prefs: NotificationPreferencesDTO | null;
  instant: Date;
}): {
  inside: boolean;
  bypass: boolean;
  window: QuietHoursWindow | null;
} {
  const { kind, prefs, instant } = input;
  const window = prefs
    ? normalizeQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd, prefs.timezone)
    : null;
  const inside = window ? isInsideQuietHours(instant, window) : false;
  const d = NOTIFICATION_KIND_REGISTRY[kind];
  const bypass = inside && !!prefs?.criticalBypassQuietHours && d.priority === "critical";
  return { inside, bypass, window };
}

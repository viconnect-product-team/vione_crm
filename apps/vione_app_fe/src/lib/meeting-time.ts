// BC-4.1C — Meeting timezone-aware formatting (client-safe, pure).
// No naive datetime handling: every scheduled time is rendered in the viewer's
// locale AND labelled with the meeting timezone. DST-safe via Intl.

export function isValidIanaTimezone(tz: string): boolean {
  if (typeof tz !== "string" || tz.length === 0) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Viewer-local time range, e.g. "10:00–10:30" (viewer's own timezone). */
export function formatLocalTimeRange(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  locale: string,
): string {
  if (!startAt) return "";
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) return "";
  const tf = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  const startStr = tf.format(start);
  if (!endAt) return startStr;
  const end = new Date(endAt);
  if (Number.isNaN(end.getTime())) return startStr;
  return `${startStr}\u2013${tf.format(end)}`;
}

/** Viewer-local date, e.g. "Mon, 13 Jul 2026". */
export function formatLocalDate(startAt: string | null | undefined, locale: string): string {
  if (!startAt) return "";
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(start);
}

/** Time range expressed in the meeting timezone (for cross-tz clarity). */
export function formatMeetingTzTimeRange(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  timezone: string,
  locale: string,
): string {
  if (!startAt || !isValidIanaTimezone(timezone)) return "";
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) return "";
  const tf = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
  const startStr = tf.format(start);
  if (!endAt) return startStr;
  const end = new Date(endAt);
  if (Number.isNaN(end.getTime())) return startStr;
  return `${startStr}\u2013${tf.format(end)}`;
}

/** True when viewer-local date differs from meeting-timezone date. */
export function crossesDateBoundary(
  startAt: string | null | undefined,
  timezone: string,
  locale: string,
): boolean {
  if (!startAt || !isValidIanaTimezone(timezone)) return false;
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) return false;
  const localDay = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(start);
  const tzDay = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(start);
  return localDay !== tzDay;
}

/** Convert a local wall-clock date+time (in a given IANA tz) to a UTC ISO string. */
export function wallClockToUtcIso(
  date: string, // YYYY-MM-DD
  time: string, // HH:mm
  timezone: string,
): string | null {
  if (!isValidIanaTimezone(timezone)) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
  // Interpret the wall-clock as UTC first, then correct by the tz offset at
  // that instant (DST-safe because we measure the offset at the target time).
  const asUtc = Date.UTC(y, m - 1, d, hh, mm, 0);
  const tzOffsetMs = timezoneOffsetMs(new Date(asUtc), timezone);
  return new Date(asUtc - tzOffsetMs).toISOString();
}

/** Offset (ms) of the timezone relative to UTC at a specific instant. */
function timezoneOffsetMs(instant: Date, timezone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - instant.getTime();
}

export const MIN_MEETING_MINUTES = 15;
export const MAX_MEETING_MINUTES = 8 * 60;

/** Validate a proposed [start,end] pair. Returns a stable reason or null. */
export function validateProposedRange(
  startIso: string | null,
  endIso: string | null,
): "invalid" | "past" | "too_short" | "too_long" | null {
  if (!startIso || !endIso) return "invalid";
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (Number.isNaN(start) || Number.isNaN(end)) return "invalid";
  if (start <= Date.now()) return "past";
  const minutes = (end - start) / 60000;
  if (minutes < MIN_MEETING_MINUTES) return "too_short";
  if (minutes > MAX_MEETING_MINUTES) return "too_long";
  return null;
}

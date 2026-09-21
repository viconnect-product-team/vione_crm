// BC-7.7 Turn B1 — Timezone / DST-safe wall-clock conversions.
// Uses ICU (Intl) which is fully available in the Node/Cloudflare Worker
// runtimes we target. Deterministic and side-effect free.

/**
 * Return the offset (minutes to ADD to UTC to get local time in `tz`)
 * at the given UTC instant. Positive east of UTC.
 */
export function getTzOffsetMinutes(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const p: Record<string, string> = {};
  for (const x of parts) if (x.type !== "literal") p[x.type] = x.value;
  let hour = parseInt(p.hour, 10);
  if (hour === 24) hour = 0; // ICU midnight quirk
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, hour, +p.minute, +p.second);
  return Math.round((asUtc - utcMs) / 60000);
}

/**
 * Convert a local wall-clock time in `tz` to UTC.
 *
 * Returns `null` for a **non-existent** wall time (DST spring-forward gap):
 * e.g. 2026-03-08 02:30 America/New_York does not exist because 02:00→03:00.
 * For an **ambiguous** wall time (DST fall-back) returns the FIRST occurrence
 * (earlier UTC instant).
 */
export function localWallToUtc(
  y: number,
  m: number,
  d: number,
  h: number,
  mi: number,
  tz: string,
): Date | null {
  // Fixed-point iterate on the offset. Converges in ≤2 iterations except
  // right on a DST boundary; cap at 5 for safety.
  let guess = Date.UTC(y, m - 1, d, h, mi);
  for (let i = 0; i < 5; i++) {
    const off = getTzOffsetMinutes(guess, tz);
    const next = Date.UTC(y, m - 1, d, h, mi) - off * 60000;
    if (next === guess) break;
    guess = next;
  }
  // Verify round-trip. A non-existent wall time will resolve to a different
  // wall time when re-formatted in tz — that's how we detect the DST gap.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(guess));
  const p: Record<string, string> = {};
  for (const x of parts) if (x.type !== "literal") p[x.type] = x.value;
  let hh = parseInt(p.hour, 10);
  if (hh === 24) hh = 0;
  if (+p.year !== y || +p.month !== m || +p.day !== d || hh !== h || +p.minute !== mi) {
    return null;
  }

  // Ambiguous wall time (fall-back): also try guess-3600000 and prefer the
  // earlier one if it round-trips to the same wall clock.
  const earlier = guess - 3_600_000;
  const eParts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(earlier));
  const ep: Record<string, string> = {};
  for (const x of eParts) if (x.type !== "literal") ep[x.type] = x.value;
  let eh = parseInt(ep.hour, 10);
  if (eh === 24) eh = 0;
  if (+ep.year === y && +ep.month === m && +ep.day === d && eh === h && +ep.minute === mi) {
    return new Date(earlier);
  }
  return new Date(guess);
}

/** Parse "HH:MM" into { h, mi }. Throws on malformed input. */
export function parseHm(hm: string): { h: number; mi: number } {
  const m = /^(\d{2}):(\d{2})$/.exec(hm);
  if (!m) throw new Error(`CALENDAR_INVALID_INPUT: bad HH:MM ${hm}`);
  const h = +m[1];
  const mi = +m[2];
  if (h < 0 || h > 23 || mi < 0 || mi > 59) {
    throw new Error(`CALENDAR_INVALID_INPUT: bad HH:MM ${hm}`);
  }
  return { h, mi };
}

/** ISO weekday (1=Mon..7=Sun) for a UTC instant in the given tz. */
export function isoWeekdayInTz(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).formatToParts(new Date(utcMs));
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return map[wd] ?? 1;
}

/** Local calendar Y/M/D for a UTC instant in the given tz. */
export function localCalendarDate(utcMs: number, tz: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(utcMs));
  const p: Record<string, string> = {};
  for (const x of parts) if (x.type !== "literal") p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day };
}

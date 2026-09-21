// BC-7.7 Turn B1 — Deterministic Common-Availability Engine (pure).
//
// Given N participants (each with their own timezone, working windows, busy
// intervals, buffers, minimum notice) and a UTC search window, return the
// candidate meeting slots at the requested granularity.
//
// No I/O, no clock reads outside `now` (which is injectable). Timezone/DST
// math is delegated to ./timezone.ts. Interval math to ./busy.ts.

import { CALENDAR_QUERY_BOUNDS } from "./registry";
import { CalendarError } from "./errors";
import type { AvailabilitySlotDTO, BusyInterval, IsoWeekday, WorkingHourWindow } from "./types";
import { expandBusyWithBuffers, intersect, normalize, subtract, type Interval } from "./busy";
import { isoWeekdayInTz, localCalendarDate, localWallToUtc, parseHm } from "./timezone";

export interface AvailabilityParticipant {
  userId: string;
  timezone: string;
  workingDays: IsoWeekday[];
  workingHours: WorkingHourWindow[];
  busyIntervals: BusyInterval[];
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minimumNoticeMinutes: number;
}

export interface AvailabilityRequest {
  participants: AvailabilityParticipant[];
  fromAt: string; // ISO
  toAt: string; // ISO
  durationMinutes: number;
  organizerTimezone: string;
  /** Injectable for deterministic tests. Defaults to Date.now(). */
  now?: string;
  granularityMinutes?: number;
  maxSlots?: number;
}

const DAY_MS = 86_400_000;

export function validateAvailabilityRequest(req: AvailabilityRequest): void {
  const B = CALENDAR_QUERY_BOUNDS;
  if (
    !req.participants ||
    req.participants.length === 0 ||
    req.participants.length > B.MAX_PARTICIPANTS
  ) {
    throw new CalendarError("CALENDAR_TOO_MANY_PARTICIPANTS");
  }
  const from = Date.parse(req.fromAt);
  const to = Date.parse(req.toAt);
  if (!isFinite(from) || !isFinite(to) || to <= from) {
    throw new CalendarError("CALENDAR_INVALID_DATE_RANGE");
  }
  if (to - from > B.MAX_DATE_RANGE_DAYS * DAY_MS) {
    throw new CalendarError("CALENDAR_INVALID_DATE_RANGE");
  }
  if (
    req.durationMinutes < B.MIN_DURATION_MINUTES ||
    req.durationMinutes > B.MAX_DURATION_MINUTES
  ) {
    throw new CalendarError("CALENDAR_INVALID_DURATION");
  }
  if (!req.organizerTimezone) {
    throw new CalendarError("CALENDAR_INVALID_TIMEZONE");
  }
}

/** Compute working intervals (UTC ms) for one participant across `[from,to]`. */
function participantWorkingIntervals(
  p: AvailabilityParticipant,
  fromMs: number,
  toMs: number,
): Interval[] {
  const out: Interval[] = [];
  // Walk local calendar dates. Pad by 1 day on each side so a working window
  // that starts before `fromMs` in local time (but ends after) is included.
  const startProbe = fromMs - DAY_MS;
  const endProbe = toMs + DAY_MS;
  const days = Math.ceil((endProbe - startProbe) / DAY_MS) + 2;
  const seen = new Set<string>();
  for (let i = 0; i <= days; i++) {
    const probe = startProbe + i * DAY_MS;
    const { y, m, d } = localCalendarDate(probe, p.timezone);
    const key = `${y}-${m}-${d}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // ISO weekday for local midnight of that date
    const midnight = localWallToUtc(y, m, d, 12, 0, p.timezone);
    if (!midnight) continue;
    const wd = isoWeekdayInTz(midnight.getTime(), p.timezone) as IsoWeekday;
    if (!p.workingDays.includes(wd)) continue;
    for (const w of p.workingHours) {
      if (w.day !== wd) continue;
      const { h: sh, mi: smi } = parseHm(w.start);
      const { h: eh, mi: emi } = parseHm(w.end);
      const declaredMinutes = eh * 60 + emi - (sh * 60 + smi);
      // DST spring-forward: if the declared start falls in the missing hour
      // (returns null), bump forward one hour to the first existing minute.
      // Symmetrically for end. If still null, drop the window.
      let sUtc = localWallToUtc(y, m, d, sh, smi, p.timezone);
      if (!sUtc) sUtc = localWallToUtc(y, m, d, sh + 1, smi, p.timezone);
      let eUtc = localWallToUtc(y, m, d, eh, emi, p.timezone);
      if (!eUtc) eUtc = localWallToUtc(y, m, d, eh - 1, emi, p.timezone);
      if (!sUtc || !eUtc) continue;
      let s = sUtc.getTime();
      // DST fall-back: clip UTC span to the DECLARED LOCAL duration so a
      // "1-hour working window" that straddles the fall-back does not become
      // a 2-hour UTC window (which would emit phantom slots).
      let e = Math.min(eUtc.getTime(), s + declaredMinutes * 60000);
      if (e <= s) continue;
      s = Math.max(s, fromMs);
      e = Math.min(e, toMs);
      if (e > s) out.push({ s, e });
    }
  }
  return normalize(out);
}

/**
 * Enumerate slot starts of length `duration` at `granularity` within a free
 * interval. Result is inclusive-start, exclusive-end.
 */
function slotsInInterval(
  iv: Interval,
  durationMs: number,
  granularityMs: number,
  fromMs: number,
): number[] {
  const out: number[] = [];
  const firstAligned = Math.ceil(Math.max(iv.s, fromMs) / granularityMs) * granularityMs;
  for (let t = firstAligned; t + durationMs <= iv.e; t += granularityMs) {
    out.push(t);
  }
  return out;
}

export function computeCommonAvailability(req: AvailabilityRequest): AvailabilitySlotDTO[] {
  validateAvailabilityRequest(req);

  const B = CALENDAR_QUERY_BOUNDS;
  const granularity = (req.granularityMinutes ?? B.SLOT_GRANULARITY_MINUTES) * 60000;
  const maxSlots = Math.min(req.maxSlots ?? B.DEFAULT_RETURNED_SLOTS, B.MAX_RETURNED_SLOTS);
  const durationMs = req.durationMinutes * 60000;
  const nowMs = req.now ? Date.parse(req.now) : Date.now();
  const strictestNotice =
    Math.max(0, ...req.participants.map((p) => p.minimumNoticeMinutes)) * 60000;
  const effectiveFromMs = Math.max(Date.parse(req.fromAt), nowMs + strictestNotice);
  const toMs = Date.parse(req.toAt);
  if (effectiveFromMs >= toMs) return [];

  // Compute each participant's free time = working ∖ (busy ⊕ buffers).
  const perParticipantFree: Interval[][] = req.participants.map((p) => {
    const working = participantWorkingIntervals(p, effectiveFromMs, toMs);
    const busy = expandBusyWithBuffers(
      p.busyIntervals,
      p.bufferBeforeMinutes,
      p.bufferAfterMinutes,
    );
    return subtract(working, busy);
  });

  // Intersect across participants (pairwise fold).
  let common: Interval[] = perParticipantFree[0] ?? [];
  for (let i = 1; i < perParticipantFree.length; i++) {
    common = intersect(common, perParticipantFree[i]);
    if (common.length === 0) return [];
  }

  // Emit slots.
  const slots: AvailabilitySlotDTO[] = [];
  for (const iv of common) {
    const starts = slotsInInterval(iv, durationMs, granularity, effectiveFromMs);
    for (const t of starts) {
      slots.push({
        startAt: new Date(t).toISOString(),
        endAt: new Date(t + durationMs).toISOString(),
        durationMinutes: req.durationMinutes,
        displayTimezone: req.organizerTimezone,
        participantCount: req.participants.length,
        availabilityConfidence: "deterministic",
      });
      if (slots.length >= maxSlots) return slots;
    }
  }
  return slots;
}

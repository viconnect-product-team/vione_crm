// BC-7.7 Turn B1 — Pure interval math. All times are epoch ms.
// The engine never returns provider event refs; caller mappers strip them.

import type { BusyInterval } from "./types";

export interface Interval {
  s: number;
  e: number;
}

/** Merge overlapping and adjacent intervals in place-free fashion. */
export function normalize(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];
  const sorted = intervals
    .filter((i) => i.e > i.s)
    .slice()
    .sort((a, b) => a.s - b.s);
  const out: Interval[] = [];
  for (const cur of sorted) {
    const last = out[out.length - 1];
    if (last && cur.s <= last.e) {
      last.e = Math.max(last.e, cur.e);
    } else {
      out.push({ ...cur });
    }
  }
  return out;
}

/** Intersect two normalized interval sets. Result is normalized. */
export function intersect(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const s = Math.max(a[i].s, b[j].s);
    const e = Math.min(a[i].e, b[j].e);
    if (e > s) out.push({ s, e });
    if (a[i].e < b[j].e) i++;
    else j++;
  }
  return out;
}

/** Subtract normalized `busy` from normalized `free`. */
export function subtract(free: Interval[], busy: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const f of free) {
    let cursor = f.s;
    for (const b of busy) {
      if (b.e <= cursor) continue;
      if (b.s >= f.e) break;
      if (b.s > cursor) out.push({ s: cursor, e: Math.min(b.s, f.e) });
      cursor = Math.max(cursor, b.e);
      if (cursor >= f.e) break;
    }
    if (cursor < f.e) out.push({ s: cursor, e: f.e });
  }
  return out;
}

/** Expand busy intervals by buffers, then normalize. */
export function expandBusyWithBuffers(
  busy: BusyInterval[],
  bufferBeforeMinutes: number,
  bufferAfterMinutes: number,
): Interval[] {
  const bb = bufferBeforeMinutes * 60000;
  const ba = bufferAfterMinutes * 60000;
  return normalize(
    busy.map((b) => ({
      s: Date.parse(b.startAt) - bb,
      e: Date.parse(b.endAt) + ba,
    })),
  );
}

/**
 * Strip server-only fields from BusyInterval before returning to clients.
 * Provider event refs and any raw provider payloads MUST be dropped.
 */
export function toBusyIntervalDTO(b: BusyInterval): BusyInterval {
  return {
    startAt: b.startAt,
    endAt: b.endAt,
    source: b.source,
    transparency: b.transparency,
  };
}

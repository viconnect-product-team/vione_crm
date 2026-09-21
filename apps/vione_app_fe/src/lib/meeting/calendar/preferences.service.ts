// BC-7.7 Turn B1 — Availability preference input validation.
// The DB RPC re-validates; this service is the app-side gate so callers
// never trigger the RPC with obviously bad input.

import { CalendarError } from "./errors";
import type { AvailabilityPreferencesDTO, IsoWeekday, WorkingHourWindow } from "./types";
import { parseHm } from "./timezone";

export interface UpdatePreferencesInput {
  timezone: string;
  workingDays: IsoWeekday[];
  workingHours: WorkingHourWindow[];
  minimumNoticeMinutes: number;
  defaultMeetingDurationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  expectedVersion?: number | null;
}

const VALID_TZ_RE = /^[A-Za-z][A-Za-z0-9_+\-/]{1,63}$/;

export function validateUpdatePreferences(input: UpdatePreferencesInput): void {
  if (!input.timezone || !VALID_TZ_RE.test(input.timezone)) {
    throw new CalendarError("CALENDAR_INVALID_TIMEZONE");
  }
  try {
    // Quick smoke test: unknown zones throw here.
    new Intl.DateTimeFormat("en-US", { timeZone: input.timezone });
  } catch {
    throw new CalendarError("CALENDAR_INVALID_TIMEZONE");
  }
  if (
    !Array.isArray(input.workingDays) ||
    input.workingDays.length === 0 ||
    input.workingDays.some((d) => d < 1 || d > 7)
  ) {
    throw new CalendarError("CALENDAR_INVALID_INPUT" as never);
  }
  if (!Array.isArray(input.workingHours) || input.workingHours.length === 0) {
    throw new CalendarError("CALENDAR_INVALID_INPUT" as never);
  }
  for (const w of input.workingHours) {
    if (w.day < 1 || w.day > 7) throw new CalendarError("CALENDAR_INVALID_INPUT" as never);
    let s: { h: number; mi: number };
    let e: { h: number; mi: number };
    try {
      s = parseHm(w.start);
      e = parseHm(w.end);
    } catch {
      throw new CalendarError("CALENDAR_INVALID_INPUT" as never);
    }
    if (e.h * 60 + e.mi <= s.h * 60 + s.mi) {
      throw new CalendarError("CALENDAR_INVALID_INPUT" as never);
    }
  }
  if (input.minimumNoticeMinutes < 0 || input.minimumNoticeMinutes > 10080) {
    throw new CalendarError("CALENDAR_INVALID_INPUT" as never);
  }
  if (input.defaultMeetingDurationMinutes < 15 || input.defaultMeetingDurationMinutes > 480) {
    throw new CalendarError("CALENDAR_INVALID_DURATION");
  }
  if (
    input.bufferBeforeMinutes < 0 ||
    input.bufferBeforeMinutes > 240 ||
    input.bufferAfterMinutes < 0 ||
    input.bufferAfterMinutes > 240
  ) {
    throw new CalendarError("CALENDAR_INVALID_INPUT" as never);
  }
}

/** Public projection: strips nothing sensitive (preferences are user-owned). */
export function toPreferencesDTO(row: AvailabilityPreferencesDTO): AvailabilityPreferencesDTO {
  return { ...row };
}

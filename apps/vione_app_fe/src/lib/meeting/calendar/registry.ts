// BC-7.7 — Provider registry (frozen v1).
import type { CalendarProvider } from "./types";

export const CALENDAR_PROVIDERS: readonly CalendarProvider[] = [
  "google",
  "microsoft",
  "internal",
] as const;

export const CALENDAR_QUERY_BOUNDS = {
  MAX_PARTICIPANTS: 10,
  MAX_DATE_RANGE_DAYS: 30,
  DEFAULT_SEARCH_WINDOW_DAYS: 14,
  MAX_RETURNED_SLOTS: 100,
  DEFAULT_RETURNED_SLOTS: 20,
  SLOT_GRANULARITY_MINUTES: 15,
  MIN_DURATION_MINUTES: 15,
  MAX_DURATION_MINUTES: 480,
  DEFAULT_DURATION_MINUTES: 60,
  MAX_PROPOSALS_PER_ROUND: 5,
} as const;

export function isCalendarProvider(v: unknown): v is CalendarProvider {
  return typeof v === "string" && (CALENDAR_PROVIDERS as readonly string[]).includes(v);
}

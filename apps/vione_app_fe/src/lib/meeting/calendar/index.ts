// BC-7.7 — Calendar & Availability barrel. Turn A scope: types + provider
// port + internal adapter + repository + registry + errors. Availability,
// scheduling and sync services land in Turn B; SDK + UI in Turn C.

export * from "./types";
export * from "./registry";
export * from "./errors";
export type {
  CalendarProviderAdapter,
  ProviderCalendarEventInput,
  ProviderCalendarEventRef,
  ListBusyIntervalsInput,
} from "./calendar-provider.port";

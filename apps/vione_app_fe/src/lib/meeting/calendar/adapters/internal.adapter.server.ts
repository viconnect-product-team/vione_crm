// BC-7.7 — Internal calendar adapter (always-available).
// Serves users without any external calendar. Busy intervals come from
// confirmed Business Connect meetings only. All state is read from Postgres
// via the caller's supabase client (RLS-scoped) — the adapter itself is
// stateless.

import type {
  CalendarProviderAdapter,
  ListBusyIntervalsInput,
  ProviderCalendarEventInput,
  ProviderCalendarEventRef,
} from "../calendar-provider.port";
import type { BusyInterval, CalendarAccountDTO, CalendarAccountStatus } from "../types";

export function createInternalCalendarAdapter(): CalendarProviderAdapter {
  return {
    provider: "internal",

    async getAccountStatus(_userId: string): Promise<{
      account: CalendarAccountDTO | null;
      status: CalendarAccountStatus;
    }> {
      // "internal" never has an OAuth-backed account row; treat as connected.
      return { account: null, status: "connected" };
    },

    async listBusyIntervals(_input: ListBusyIntervalsInput): Promise<BusyInterval[]> {
      // Confirmed BusinessMeetings are aggregated by AvailabilityService
      // directly from business_meetings; the internal adapter contributes no
      // external busy intervals of its own.
      return [];
    },

    async createCalendarEvent(
      _userId: string,
      _input: ProviderCalendarEventInput,
    ): Promise<ProviderCalendarEventRef> {
      // Internal provider: canonical meeting IS the "external" event.
      return { externalEventRef: "internal" };
    },

    async updateCalendarEvent(
      _userId: string,
      externalEventRef: string,
    ): Promise<ProviderCalendarEventRef> {
      return { externalEventRef };
    },

    async cancelCalendarEvent(): Promise<void> {
      return;
    },

    async getCalendarEvent(
      _userId: string,
      externalEventRef: string,
    ): Promise<ProviderCalendarEventRef | null> {
      return externalEventRef ? { externalEventRef } : null;
    },

    async refreshConnection(): Promise<CalendarAccountStatus> {
      return "connected";
    },
  };
}

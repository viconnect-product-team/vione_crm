// BC-7.7 — Provider-agnostic Calendar port.
// MeetingService MUST NOT contain Google-/Microsoft-specific logic. Adapters
// live behind this port; the InternalCalendarAdapter is the always-available
// default when a user has no external calendar connected.

import type {
  BusyInterval,
  CalendarAccountDTO,
  CalendarAccountStatus,
  CalendarProvider,
} from "./types";

export interface ProviderCalendarEventInput {
  meetingId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  timezone: string;
  location?: string;
  virtualJoinUrl?: string;
  sourceLink?: string;
}

export interface ProviderCalendarEventRef {
  externalEventRef: string;
}

export interface ListBusyIntervalsInput {
  userId: string;
  fromAt: string;
  toAt: string;
}

export interface CalendarProviderAdapter {
  readonly provider: CalendarProvider;

  getAccountStatus(userId: string): Promise<{
    account: CalendarAccountDTO | null;
    status: CalendarAccountStatus;
  }>;

  listBusyIntervals(input: ListBusyIntervalsInput): Promise<BusyInterval[]>;

  createCalendarEvent(
    userId: string,
    input: ProviderCalendarEventInput,
  ): Promise<ProviderCalendarEventRef>;

  updateCalendarEvent(
    userId: string,
    externalEventRef: string,
    input: ProviderCalendarEventInput,
  ): Promise<ProviderCalendarEventRef>;

  cancelCalendarEvent(userId: string, externalEventRef: string): Promise<void>;

  getCalendarEvent(
    userId: string,
    externalEventRef: string,
  ): Promise<ProviderCalendarEventRef | null>;

  refreshConnection(userId: string): Promise<CalendarAccountStatus>;
}

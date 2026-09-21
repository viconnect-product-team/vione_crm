// BC-7.7 — Calendar & Availability domain types.
// Canonical meeting stays in business_meetings; these types describe
// availability preferences, busy intervals, scheduling proposals and
// external calendar projections. No provider tokens or raw event content
// ever appears in these DTOs.

export type CalendarProvider = "google" | "microsoft" | "internal";

export type CalendarAccountStatus = "connected" | "degraded" | "disconnected" | "revoked";

export interface CalendarAccountDTO {
  id: string;
  userId: string;
  provider: CalendarProvider;
  providerAccountRef: string | null;
  status: CalendarAccountStatus;
  scopes: string[];
  connectedAt: string;
  refreshedAt: string | null;
  expiresAt: string | null;
  lastSyncAt: string | null;
  lastErrorCode: string | null;
  version: number;
}

/** ISO weekday 1=Mon..7=Sun. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface WorkingHourWindow {
  /** ISO weekday */
  day: IsoWeekday;
  /** local HH:MM 24h */
  start: string;
  /** local HH:MM 24h */
  end: string;
}

export interface AvailabilityPreferencesDTO {
  id: string;
  userId: string;
  timezone: string;
  workingDays: IsoWeekday[];
  workingHours: WorkingHourWindow[];
  minimumNoticeMinutes: number;
  defaultMeetingDurationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  version: number;
}

export type BusyIntervalTransparency = "opaque" | "tentative";
export type BusyIntervalSource = "external_calendar" | "confirmed_meeting" | "blocked_period";

export interface BusyInterval {
  startAt: string;
  endAt: string;
  source: BusyIntervalSource;
  transparency: BusyIntervalTransparency;
  /** Server-only; never sent to browser DTOs. */
  providerEventRef?: string;
}

export interface AvailabilitySlotDTO {
  startAt: string;
  endAt: string;
  durationMinutes: number;
  displayTimezone: string;
  participantCount: number;
  availabilityConfidence?: "deterministic";
}

export type MeetingTimeProposalStatus = "active" | "selected" | "withdrawn" | "expired";

export interface MeetingTimeProposalDTO {
  id: string;
  meetingId: string;
  proposedByUserId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: MeetingTimeProposalStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type MeetingTimeProposalResponseValue = "available" | "unavailable" | "tentative";

export interface MeetingTimeProposalResponseDTO {
  id: string;
  proposalId: string;
  participantId: string;
  response: MeetingTimeProposalResponseValue;
  respondedAt: string;
}

export type CalendarSyncStatus = "pending" | "synced" | "retry_scheduled" | "failed" | "cancelled";

export interface CalendarProjectionDTO {
  id: string;
  meetingId: string;
  participantUserId: string;
  provider: CalendarProvider;
  syncStatus: CalendarSyncStatus;
  lastSyncedAt: string | null;
  lastErrorCode: string | null;
  retryCount: number;
}

export interface FindCommonAvailabilityInput {
  meetingId?: string;
  participantUserIds: string[];
  fromDate: string; // ISO date
  toDate: string; // ISO date
  durationMinutes: number;
  organizerTimezone: string;
}

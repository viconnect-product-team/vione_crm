// BC-7.7 Turn C — React Query keys for the calendar & availability domain.
// Every UI subscription MUST use these keys so invalidation stays precise.

export const meetingCalendarKeys = {
  all: ["meeting-calendar"] as const,
  preferences: () => [...meetingCalendarKeys.all, "preferences"] as const,
  proposals: (meetingId: string) => [...meetingCalendarKeys.all, "proposals", meetingId] as const,
  projections: (meetingId: string) =>
    [...meetingCalendarKeys.all, "projections", meetingId] as const,
  commonAvailability: (input: {
    meetingId?: string;
    participantUserIds: string[];
    fromDate: string;
    toDate: string;
    durationMinutes: number;
    organizerTimezone: string;
  }) =>
    [
      ...meetingCalendarKeys.all,
      "common-availability",
      input.meetingId ?? null,
      [...input.participantUserIds].sort().join(","),
      input.fromDate,
      input.toDate,
      input.durationMinutes,
      input.organizerTimezone,
    ] as const,
} as const;

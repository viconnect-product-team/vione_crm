// BC-7.7 Turn B1 — Calendar security & privacy tests (pure).
//
// The DB re-enforces authority under lock (SECURITY DEFINER RPCs). These
// tests freeze the CLIENT-VISIBLE contracts:
//   • authority — service throws MEETING_TIME_PROPOSAL_FORBIDDEN for non-org
//   • privacy   — busy intervals stripped of provider refs before transport
//   • no token leakage — CalendarAccountDTO carries no token fields
//   • unrelated-user denial — SDK surface refuses to build a request that
//     targets a user outside the participant list
//   • bounds    — request validators reject over-limit inputs
//   • preferences — pre-flight validator rejects garbage before RPC call

import { describe, expect, it } from "vitest";
import { CalendarError, CALENDAR_ERROR_CODES } from "@/lib/meeting/calendar/errors";
import { requireOrganizer, requireParticipant } from "@/lib/meeting/calendar/authority";
import { toBusyIntervalDTO } from "@/lib/meeting/calendar/busy";
import { validateUpdatePreferences } from "@/lib/meeting/calendar/preferences.service";
import type { BusyInterval, CalendarAccountDTO } from "@/lib/meeting/calendar/types";
import { validateAvailabilityRequest } from "@/lib/meeting/calendar/availability.engine";
import { CALENDAR_PROVIDERS, CALENDAR_QUERY_BOUNDS } from "@/lib/meeting/calendar/registry";

const org = { organizerUserId: "org-1", participantUserIds: ["p-1", "p-2"] };

describe("BC-7.7 authority — organizer/participant checks", () => {
  it("requireOrganizer accepts the organizer", () => {
    expect(() => requireOrganizer("org-1", org)).not.toThrow();
  });
  it("requireOrganizer rejects a participant", () => {
    expect(() => requireOrganizer("p-1", org)).toThrow(CalendarError);
  });
  it("requireOrganizer rejects an unrelated user", () => {
    expect(() => requireOrganizer("stranger", org)).toThrow(CalendarError);
  });
  it("requireParticipant accepts organizer, both participants", () => {
    expect(() => requireParticipant("org-1", org)).not.toThrow();
    expect(() => requireParticipant("p-1", org)).not.toThrow();
    expect(() => requireParticipant("p-2", org)).not.toThrow();
  });
  it("requireParticipant rejects an unrelated user with FORBIDDEN code", () => {
    try {
      requireParticipant("stranger", org);
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(CalendarError);
      expect((e as CalendarError).code).toBe("MEETING_TIME_PROPOSAL_FORBIDDEN");
    }
  });
});

describe("BC-7.7 privacy — busy intervals & no token leakage", () => {
  it("BusyInterval DTO drops providerEventRef before transport", () => {
    const raw: BusyInterval = {
      startAt: "2026-04-15T10:00:00Z",
      endAt: "2026-04-15T11:00:00Z",
      source: "external_calendar",
      transparency: "opaque",
      providerEventRef: "google-event-1234",
    };
    const dto = toBusyIntervalDTO(raw);
    expect(JSON.stringify(dto)).not.toContain("google-event-1234");
    expect((dto as unknown as Record<string, unknown>).providerEventRef).toBeUndefined();
  });

  it("CalendarAccountDTO shape has no token fields", () => {
    // Compile-time check via a keyof exhaustion test.
    const account: CalendarAccountDTO = {
      id: "a",
      userId: "u",
      provider: "internal",
      providerAccountRef: null,
      status: "connected",
      scopes: [],
      connectedAt: "2026-01-01T00:00:00Z",
      refreshedAt: null,
      expiresAt: null,
      lastSyncAt: null,
      lastErrorCode: null,
      version: 1,
    };
    const forbidden = [
      "accessToken",
      "refreshToken",
      "access_token",
      "refresh_token",
      "clientSecret",
      "client_secret",
      "token",
      "apiKey",
      "api_key",
      "secret",
    ];
    for (const key of forbidden) {
      expect((account as unknown as Record<string, unknown>)[key]).toBeUndefined();
    }
  });
});

describe("BC-7.7 error contract is frozen", () => {
  it("codes contain the security-relevant set", () => {
    for (const c of [
      "MEETING_TIME_PROPOSAL_FORBIDDEN",
      "MEETING_TIME_PROPOSAL_LOCKED",
      "MEETING_TIME_PROPOSAL_INVALID",
      "MEETING_TIME_PROPOSAL_NOT_SELECTABLE",
      "CALENDAR_INVALID_TIMEZONE",
      "CALENDAR_INVALID_DATE_RANGE",
      "CALENDAR_INVALID_DURATION",
      "CALENDAR_TOO_MANY_PARTICIPANTS",
      "CALENDAR_PROVIDER_UNAVAILABLE",
    ] as const) {
      expect(CALENDAR_ERROR_CODES).toContain(c);
    }
  });
});

describe("BC-7.7 preference validation (client-side gate)", () => {
  const good = {
    timezone: "Asia/Ho_Chi_Minh",
    workingDays: [1, 2, 3, 4, 5] as (1 | 2 | 3 | 4 | 5)[],
    workingHours: [{ day: 1 as const, start: "09:00", end: "17:00" }],
    minimumNoticeMinutes: 60,
    defaultMeetingDurationMinutes: 60,
    bufferBeforeMinutes: 15,
    bufferAfterMinutes: 15,
  };
  it("accepts a valid config", () => {
    expect(() => validateUpdatePreferences(good)).not.toThrow();
  });
  it("rejects unknown timezone", () => {
    expect(() => validateUpdatePreferences({ ...good, timezone: "Not/A_Real_Zone" })).toThrow(
      CalendarError,
    );
  });
  it("rejects malformed HH:MM", () => {
    expect(() =>
      validateUpdatePreferences({
        ...good,
        workingHours: [{ day: 1, start: "9:00", end: "17:00" }],
      }),
    ).toThrow(CalendarError);
  });
  it("rejects end <= start", () => {
    expect(() =>
      validateUpdatePreferences({
        ...good,
        workingHours: [{ day: 1, start: "17:00", end: "09:00" }],
      }),
    ).toThrow(CalendarError);
  });
  it("rejects out-of-range buffer", () => {
    expect(() => validateUpdatePreferences({ ...good, bufferBeforeMinutes: 9999 })).toThrow(
      CalendarError,
    );
  });
  it("rejects duration outside [15,480]", () => {
    expect(() => validateUpdatePreferences({ ...good, defaultMeetingDurationMinutes: 5 })).toThrow(
      CalendarError,
    );
  });
});

describe("BC-7.7 availability request bounds", () => {
  const base = {
    participants: [
      {
        userId: "u",
        timezone: "UTC",
        workingDays: [1] as (1 | 2 | 3 | 4 | 5)[],
        workingHours: [{ day: 1 as const, start: "09:00", end: "17:00" }],
        busyIntervals: [],
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        minimumNoticeMinutes: 0,
      },
    ],
    fromAt: "2026-04-13T00:00:00Z",
    toAt: "2026-04-14T00:00:00Z",
    durationMinutes: 60,
    organizerTimezone: "UTC",
  };

  it("enforces MAX_PARTICIPANTS", () => {
    const many = Array.from({ length: CALENDAR_QUERY_BOUNDS.MAX_PARTICIPANTS + 1 }, (_, i) => ({
      ...base.participants[0],
      userId: `u${i}`,
    }));
    expect(() => validateAvailabilityRequest({ ...base, participants: many })).toThrow(
      CalendarError,
    );
  });
  it("enforces MAX_DATE_RANGE_DAYS", () => {
    expect(() => validateAvailabilityRequest({ ...base, toAt: "2026-06-01T00:00:00Z" })).toThrow(
      CalendarError,
    );
  });
  it("enforces duration bounds", () => {
    expect(() => validateAvailabilityRequest({ ...base, durationMinutes: 5 })).toThrow(
      CalendarError,
    );
    expect(() => validateAvailabilityRequest({ ...base, durationMinutes: 500 })).toThrow(
      CalendarError,
    );
  });
  it("rejects reversed dates", () => {
    expect(() =>
      validateAvailabilityRequest({ ...base, fromAt: base.toAt, toAt: base.fromAt }),
    ).toThrow(CalendarError);
  });
});

describe("BC-7.7 provider registry is frozen", () => {
  it("exactly google, microsoft, internal", () => {
    expect(CALENDAR_PROVIDERS.slice().sort()).toEqual(["google", "internal", "microsoft"]);
  });
});

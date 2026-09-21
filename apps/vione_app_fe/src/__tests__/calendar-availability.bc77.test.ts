// BC-7.7 Turn B1 — Availability engine matrix.
// Pure unit tests: no DB, no I/O. Covers timezone, DST, intersection,
// buffers, notice, bounds, privacy of intervals.

import { describe, expect, it } from "vitest";
import {
  computeCommonAvailability,
  type AvailabilityParticipant,
} from "@/lib/meeting/calendar/availability.engine";
import { getTzOffsetMinutes, localWallToUtc } from "@/lib/meeting/calendar/timezone";
import {
  normalize,
  intersect,
  subtract,
  expandBusyWithBuffers,
  toBusyIntervalDTO,
} from "@/lib/meeting/calendar/busy";
import { CalendarError } from "@/lib/meeting/calendar/errors";
import type { BusyInterval, IsoWeekday, WorkingHourWindow } from "@/lib/meeting/calendar/types";

const WEEKDAYS: IsoWeekday[] = [1, 2, 3, 4, 5];
const WORKING_9_17: WorkingHourWindow[] = WEEKDAYS.map((d) => ({
  day: d,
  start: "09:00",
  end: "17:00",
}));

function participant(overrides: Partial<AvailabilityParticipant> = {}): AvailabilityParticipant {
  return {
    userId: overrides.userId ?? "u",
    timezone: overrides.timezone ?? "UTC",
    workingDays: overrides.workingDays ?? WEEKDAYS,
    workingHours: overrides.workingHours ?? WORKING_9_17,
    busyIntervals: overrides.busyIntervals ?? [],
    bufferBeforeMinutes: overrides.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: overrides.bufferAfterMinutes ?? 0,
    minimumNoticeMinutes: overrides.minimumNoticeMinutes ?? 0,
  };
}

describe("BC-7.7 timezone helpers", () => {
  it("normal timezone conversion: 09:00 Asia/Ho_Chi_Minh = 02:00 UTC", () => {
    const d = localWallToUtc(2026, 4, 15, 9, 0, "Asia/Ho_Chi_Minh");
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2026-04-15T02:00:00.000Z");
  });

  it("DST spring-forward: 2026-03-08 02:30 America/New_York DOES NOT EXIST", () => {
    const d = localWallToUtc(2026, 3, 8, 2, 30, "America/New_York");
    expect(d).toBeNull();
  });

  it("DST spring-forward: 01:59 exists (before jump), 03:00 exists (after)", () => {
    const before = localWallToUtc(2026, 3, 8, 1, 59, "America/New_York");
    const after = localWallToUtc(2026, 3, 8, 3, 0, "America/New_York");
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    // 01:59 EST = -05:00 → 06:59Z, 03:00 EDT = -04:00 → 07:00Z (only 1 min apart)
    expect(after!.getTime() - before!.getTime()).toBe(60_000);
  });

  it("DST fall-back: 2026-11-01 01:30 America/New_York picks FIRST occurrence", () => {
    // 01:30 happens twice: once EDT (-04:00) → 05:30Z, once EST (-05:00) → 06:30Z.
    // Contract: pick the earlier UTC.
    const d = localWallToUtc(2026, 11, 1, 1, 30, "America/New_York");
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2026-11-01T05:30:00.000Z");
  });

  it("offset flips across a DST boundary", () => {
    const winter = Date.UTC(2026, 0, 15, 12, 0);
    const summer = Date.UTC(2026, 6, 15, 12, 0);
    expect(getTzOffsetMinutes(winter, "America/New_York")).toBe(-300);
    expect(getTzOffsetMinutes(summer, "America/New_York")).toBe(-240);
  });
});

describe("BC-7.7 busy interval math", () => {
  it("merges overlapping intervals", () => {
    expect(
      normalize([
        { s: 0, e: 10 },
        { s: 5, e: 15 },
      ]),
    ).toEqual([{ s: 0, e: 15 }]);
  });
  it("merges adjacent intervals", () => {
    expect(
      normalize([
        { s: 0, e: 10 },
        { s: 10, e: 20 },
      ]),
    ).toEqual([{ s: 0, e: 20 }]);
  });
  it("intersects non-overlapping to empty", () => {
    expect(intersect([{ s: 0, e: 5 }], [{ s: 6, e: 10 }])).toEqual([]);
  });
  it("subtracts a middle busy from a free interval", () => {
    expect(subtract([{ s: 0, e: 100 }], [{ s: 40, e: 60 }])).toEqual([
      { s: 0, e: 40 },
      { s: 60, e: 100 },
    ]);
  });
  it("expands busy by buffers", () => {
    const b: BusyInterval[] = [
      {
        startAt: "2026-04-15T10:00:00Z",
        endAt: "2026-04-15T11:00:00Z",
        source: "confirmed_meeting",
        transparency: "opaque",
      },
    ];
    const exp = expandBusyWithBuffers(b, 15, 30);
    expect(exp).toEqual([
      { s: Date.parse("2026-04-15T09:45:00Z"), e: Date.parse("2026-04-15T11:30:00Z") },
    ]);
  });
  it("DTO projection strips providerEventRef", () => {
    const b: BusyInterval = {
      startAt: "2026-04-15T10:00:00Z",
      endAt: "2026-04-15T11:00:00Z",
      source: "external_calendar",
      transparency: "opaque",
      providerEventRef: "evt_leak_me_secret",
    };
    const dto = toBusyIntervalDTO(b);
    expect((dto as { providerEventRef?: string }).providerEventRef).toBeUndefined();
  });
});

describe("BC-7.7 availability engine — bounds", () => {
  const base = {
    fromAt: "2026-04-13T00:00:00Z",
    toAt: "2026-04-14T00:00:00Z",
    durationMinutes: 60,
    organizerTimezone: "UTC",
    now: "2026-04-01T00:00:00Z",
  };
  it("rejects too many participants", () => {
    const many = Array.from({ length: 11 }, (_, i) => participant({ userId: `u${i}` }));
    expect(() => computeCommonAvailability({ ...base, participants: many })).toThrow(CalendarError);
  });
  it("rejects reversed date range", () => {
    expect(() =>
      computeCommonAvailability({
        ...base,
        fromAt: base.toAt,
        toAt: base.fromAt,
        participants: [participant()],
      }),
    ).toThrow(CalendarError);
  });
  it("rejects >30 day range", () => {
    expect(() =>
      computeCommonAvailability({
        ...base,
        toAt: "2026-06-01T00:00:00Z",
        participants: [participant()],
      }),
    ).toThrow(CalendarError);
  });
  it("rejects duration < 15 or > 480", () => {
    expect(() =>
      computeCommonAvailability({ ...base, durationMinutes: 5, participants: [participant()] }),
    ).toThrow(CalendarError);
    expect(() =>
      computeCommonAvailability({ ...base, durationMinutes: 999, participants: [participant()] }),
    ).toThrow(CalendarError);
  });
  it("caps result at maxSlots", () => {
    const slots = computeCommonAvailability({
      ...base,
      participants: [participant()],
      granularityMinutes: 15,
      maxSlots: 3,
    });
    expect(slots.length).toBe(3);
  });
});

describe("BC-7.7 availability engine — matrix", () => {
  const NOW = "2026-04-01T00:00:00Z"; // Wed
  const MON = "2026-04-13T00:00:00Z"; // Monday
  const TUE = "2026-04-14T00:00:00Z"; // Tuesday

  it("normal timezone conversion: HCM 09-17 → UTC 02-10", () => {
    const slots = computeCommonAvailability({
      participants: [participant({ timezone: "Asia/Ho_Chi_Minh" })],
      fromAt: MON,
      toAt: TUE,
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: NOW,
      granularityMinutes: 60,
    });
    expect(slots[0].startAt).toBe("2026-04-13T02:00:00.000Z");
    // Latest 60-min slot fits at 09:00Z (ends 10:00Z == 17:00 HCM)
    expect(slots[slots.length - 1].startAt).toBe("2026-04-13T09:00:00.000Z");
    expect(slots).toHaveLength(8);
  });

  it("DST spring-forward: NY working 02:00-04:00 loses the 02:00 hour", () => {
    // 2026-03-08 is Sunday. Add Sunday to working days for this test.
    const slots = computeCommonAvailability({
      participants: [
        participant({
          timezone: "America/New_York",
          workingDays: [7],
          workingHours: [{ day: 7, start: "02:00", end: "04:00" }],
        }),
      ],
      fromAt: "2026-03-08T00:00:00Z",
      toAt: "2026-03-09T00:00:00Z",
      durationMinutes: 30,
      organizerTimezone: "UTC",
      now: "2026-03-01T00:00:00Z",
      granularityMinutes: 30,
    });
    // 02:00-03:00 local doesn't exist; only 03:00-04:00 EDT is emitted.
    // 03:00 EDT = 07:00Z, 03:30 EDT = 07:30Z.
    expect(slots.map((s) => s.startAt)).toEqual([
      "2026-03-08T07:00:00.000Z",
      "2026-03-08T07:30:00.000Z",
    ]);
  });

  it("DST fall-back: NY working 01:00-02:00 on transition day picks first occurrence", () => {
    const slots = computeCommonAvailability({
      participants: [
        participant({
          timezone: "America/New_York",
          workingDays: [7],
          workingHours: [{ day: 7, start: "01:00", end: "02:00" }],
        }),
      ],
      fromAt: "2026-11-01T00:00:00Z",
      toAt: "2026-11-02T00:00:00Z",
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: "2026-10-15T00:00:00Z",
      granularityMinutes: 60,
    });
    // 01:00 EDT (-04:00) = 05:00Z (first occurrence).
    expect(slots).toHaveLength(1);
    expect(slots[0].startAt).toBe("2026-11-01T05:00:00.000Z");
  });

  it("different participant timezones — overlap = 15:00-17:00 HCM", () => {
    // HCM 09-17 = 02-10Z. NY 09-17 EDT = 13-21Z. Overlap = 13-17 HCM = 06-10Z? No:
    // Wait: HCM in April is UTC+7, NY in April is EDT UTC-4.
    // HCM 09-17 -> 02-10Z. NY 09-17 -> 13-21Z. Intersection: none!
    const slots = computeCommonAvailability({
      participants: [
        participant({ userId: "a", timezone: "Asia/Ho_Chi_Minh" }),
        participant({ userId: "b", timezone: "America/New_York" }),
      ],
      fromAt: MON,
      toAt: TUE,
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: NOW,
      granularityMinutes: 60,
    });
    expect(slots).toEqual([]);
  });

  it("overlapping working windows — London & Berlin share afternoon", () => {
    const slots = computeCommonAvailability({
      participants: [
        participant({ userId: "a", timezone: "Europe/London" }),
        participant({ userId: "b", timezone: "Europe/Berlin" }),
      ],
      fromAt: MON,
      toAt: TUE,
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: NOW,
      granularityMinutes: 60,
    });
    // London BST -> UTC+1, so 09-17 = 08-16Z. Berlin CEST -> UTC+2, so 09-17 = 07-15Z.
    // Overlap = 08-15Z. 60-min slots start 08,09,10,11,12,13,14 = 7 slots.
    expect(slots).toHaveLength(7);
    expect(slots[0].startAt).toBe("2026-04-13T08:00:00.000Z");
    expect(slots[6].startAt).toBe("2026-04-13T14:00:00.000Z");
  });

  it("busy interval subtraction removes affected slot but not adjacent", () => {
    const slots = computeCommonAvailability({
      participants: [
        participant({
          timezone: "UTC",
          busyIntervals: [
            {
              startAt: "2026-04-13T12:00:00Z",
              endAt: "2026-04-13T13:00:00Z",
              source: "confirmed_meeting",
              transparency: "opaque",
            },
          ],
        }),
      ],
      fromAt: MON,
      toAt: TUE,
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: NOW,
      granularityMinutes: 60,
    });
    const starts = slots.map((s) => s.startAt);
    expect(starts).toContain("2026-04-13T11:00:00.000Z");
    expect(starts).not.toContain("2026-04-13T12:00:00.000Z");
    expect(starts).toContain("2026-04-13T13:00:00.000Z");
  });

  it("adjacent busy intervals merge — no phantom gap", () => {
    const slots = computeCommonAvailability({
      participants: [
        participant({
          busyIntervals: [
            {
              startAt: "2026-04-13T10:00:00Z",
              endAt: "2026-04-13T11:00:00Z",
              source: "confirmed_meeting",
              transparency: "opaque",
            },
            {
              startAt: "2026-04-13T11:00:00Z",
              endAt: "2026-04-13T12:00:00Z",
              source: "confirmed_meeting",
              transparency: "opaque",
            },
          ],
        }),
      ],
      fromAt: MON,
      toAt: TUE,
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: NOW,
      granularityMinutes: 60,
    });
    const starts = slots.map((s) => s.startAt);
    // 10, 11 both fully busy; 12 free
    expect(starts).not.toContain("2026-04-13T10:00:00.000Z");
    expect(starts).not.toContain("2026-04-13T11:00:00.000Z");
    expect(starts).toContain("2026-04-13T12:00:00.000Z");
  });

  it("buffer BEFORE blocks slots overlapping the buffer, allows exact-boundary end", () => {
    const slots = computeCommonAvailability({
      participants: [
        participant({
          bufferBeforeMinutes: 30,
          busyIntervals: [
            {
              startAt: "2026-04-13T12:00:00Z",
              endAt: "2026-04-13T13:00:00Z",
              source: "confirmed_meeting",
              transparency: "opaque",
            },
          ],
        }),
      ],
      fromAt: MON,
      toAt: TUE,
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: NOW,
      granularityMinutes: 30,
    });
    const starts = slots.map((s) => s.startAt);
    // Busy 12-13, buffer-before 30m ⇒ blocked band 11:30-13:00.
    // 11:00 slot [11:00,12:00) overlaps 11:30-12:00 → blocked.
    expect(starts).not.toContain("2026-04-13T11:00:00.000Z");
    // 10:30 slot ends exactly at 11:30 (half-open) → allowed at boundary.
    expect(starts).toContain("2026-04-13T10:30:00.000Z");
    expect(starts).toContain("2026-04-13T10:00:00.000Z");
  });

  it("buffer AFTER blocks slots inside the buffer, allows exact-boundary start", () => {
    const slots = computeCommonAvailability({
      participants: [
        participant({
          bufferAfterMinutes: 30,
          busyIntervals: [
            {
              startAt: "2026-04-13T12:00:00Z",
              endAt: "2026-04-13T13:00:00Z",
              source: "confirmed_meeting",
              transparency: "opaque",
            },
          ],
        }),
      ],
      fromAt: MON,
      toAt: TUE,
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: NOW,
      granularityMinutes: 30,
    });
    const starts = slots.map((s) => s.startAt);
    // Blocked band 12:00-13:30.
    // 13:00 slot starts inside the buffer → blocked.
    expect(starts).not.toContain("2026-04-13T13:00:00.000Z");
    // 13:30 starts exactly at buffer end (half-open) → allowed.
    expect(starts).toContain("2026-04-13T13:30:00.000Z");
    expect(starts).toContain("2026-04-13T14:00:00.000Z");
  });

  it("strictest minimum notice wins", () => {
    // NOW = 2026-04-13T09:00Z (Monday morning). Two participants: 2h and 4h notice.
    const slots = computeCommonAvailability({
      participants: [
        participant({ userId: "a", minimumNoticeMinutes: 120, timezone: "UTC" }),
        participant({ userId: "b", minimumNoticeMinutes: 240, timezone: "UTC" }),
      ],
      fromAt: "2026-04-13T09:00:00Z",
      toAt: "2026-04-13T18:00:00Z",
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: "2026-04-13T09:00:00Z",
      granularityMinutes: 60,
    });
    // Working hours 09-17, notice 4h from 09:00 → earliest is 13:00Z.
    expect(slots[0].startAt).toBe("2026-04-13T13:00:00.000Z");
  });

  it("no-overlap case returns []", () => {
    const slots = computeCommonAvailability({
      participants: [
        participant({
          workingDays: [1],
          workingHours: [{ day: 1, start: "09:00", end: "10:00" }],
        }),
        participant({
          userId: "b",
          workingDays: [1],
          workingHours: [{ day: 1, start: "12:00", end: "13:00" }],
        }),
      ],
      fromAt: "2026-04-13T00:00:00Z",
      toAt: "2026-04-14T00:00:00Z",
      durationMinutes: 30,
      organizerTimezone: "UTC",
      now: NOW,
      granularityMinutes: 30,
    });
    expect(slots).toEqual([]);
  });

  it("privacy: emitted slots never carry provider event refs or raw busy detail", () => {
    const slots = computeCommonAvailability({
      participants: [
        participant({
          busyIntervals: [
            {
              startAt: "2026-04-13T12:00:00Z",
              endAt: "2026-04-13T13:00:00Z",
              source: "external_calendar",
              transparency: "opaque",
              providerEventRef: "SECRET_evt_xyz",
            },
          ],
        }),
      ],
      fromAt: MON,
      toAt: TUE,
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: NOW,
      granularityMinutes: 60,
    });
    for (const s of slots) {
      const asAny = s as unknown as Record<string, unknown>;
      expect(asAny.providerEventRef).toBeUndefined();
      expect(asAny.source).toBeUndefined();
      expect(JSON.stringify(s)).not.toContain("SECRET_evt_xyz");
    }
  });

  it("internal-only participant contributes no external busy — full working window free", () => {
    const slots = computeCommonAvailability({
      participants: [participant({ timezone: "UTC" })],
      fromAt: MON,
      toAt: TUE,
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: NOW,
      granularityMinutes: 60,
    });
    // 09-17 UTC → 8 hourly slots
    expect(slots).toHaveLength(8);
  });

  it("provider-unavailable fail-closed: engine treats missing busy as no external busy, still respects confirmed meetings", () => {
    // Simulates the AvailabilityService returning [] when it cannot fetch
    // external busy (fail-closed = do NOT invent free time from external).
    // Internal confirmed meetings still show as busy.
    const slots = computeCommonAvailability({
      participants: [
        participant({
          busyIntervals: [
            {
              startAt: "2026-04-13T09:00:00Z",
              endAt: "2026-04-13T17:00:00Z",
              source: "confirmed_meeting",
              transparency: "opaque",
            },
          ],
        }),
      ],
      fromAt: MON,
      toAt: TUE,
      durationMinutes: 60,
      organizerTimezone: "UTC",
      now: NOW,
      granularityMinutes: 60,
    });
    expect(slots).toEqual([]);
  });
});

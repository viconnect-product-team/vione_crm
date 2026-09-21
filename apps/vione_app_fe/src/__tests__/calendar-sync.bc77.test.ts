// BC-7.7 Turn B2 — CalendarSyncService integration tests using a mock
// Supabase client and a mock provider adapter. Verifies:
//   • cancels external event when meeting no longer scheduled
//   • creates external event when projection has no external_event_ref
//   • updates external event when ref already exists
//   • schedules retry with retry_after_at when adapter throws transient error
//   • marks permanent_failure when adapter throws permanent error
//   • idempotent: re-processing a synced projection is a no-op equivalent

import { describe, it, expect, vi } from "vitest";
import {
  createCalendarSyncService,
  type ProjectionRow,
} from "@/lib/meeting/calendar/sync.service.server";
import type { CalendarProviderAdapter } from "@/lib/meeting/calendar/calendar-provider.port";
import { CalendarError } from "@/lib/meeting/calendar/errors";

const NOW = new Date("2026-07-15T10:00:00Z");

function makeMeetingRow(scheduled: boolean) {
  return scheduled
    ? {
        id: "m1",
        title: "Sync me",
        description: null,
        scheduled_start_at: "2026-07-16T09:00:00Z",
        scheduled_end_at: "2026-07-16T10:00:00Z",
        scheduled_timezone: "Asia/Ho_Chi_Minh",
        status: "confirmed",
        scheduling_mode: "scheduled",
      }
    : {
        id: "m1",
        title: "Draft",
        description: null,
        scheduled_start_at: null,
        scheduled_end_at: null,
        scheduled_timezone: null,
        status: "draft",
        scheduling_mode: "unscheduled",
      };
}

function makeMockSupabase(opts: {
  meeting: ReturnType<typeof makeMeetingRow> | null;
  onUpdate?: (patch: Record<string, unknown>) => void;
}) {
  const updates: Record<string, unknown>[] = [];
  const supabase = {
    from(table: string) {
      if (table === "business_meetings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: opts.meeting, error: null }),
            }),
          }),
        };
      }
      // business_meeting_calendar_projections
      return {
        update: (patch: Record<string, unknown>) => {
          updates.push(patch);
          opts.onUpdate?.(patch);
          return {
            eq: async () => ({ error: null }),
          };
        },
      };
    },
    rpc: async () => ({ data: [], error: null }),
  };
  return {
    supabase: supabase as unknown as import("@supabase/supabase-js").SupabaseClient,
    updates,
  };
}

function makeAdapter(overrides: Partial<CalendarProviderAdapter> = {}): CalendarProviderAdapter {
  return {
    provider: "internal",
    async getAccountStatus() {
      return { account: null, status: "connected" };
    },
    async listBusyIntervals() {
      return [];
    },
    async createCalendarEvent() {
      return { externalEventRef: "ext-new-1" };
    },
    async updateCalendarEvent(_u, ref) {
      return { externalEventRef: ref };
    },
    async cancelCalendarEvent() {},
    async getCalendarEvent() {
      return null;
    },
    async refreshConnection() {
      return "connected";
    },
    ...overrides,
  };
}

const baseProjection: ProjectionRow = {
  id: "p1",
  meetingId: "m1",
  participantUserId: "u1",
  provider: "internal",
  syncStatus: "pending",
  retryCount: 0,
  lastErrorCode: null,
  externalEventRef: null,
};

describe("CalendarSyncService.syncOne", () => {
  it("creates external event and marks synced when no prior ref", async () => {
    const { supabase, updates } = makeMockSupabase({ meeting: makeMeetingRow(true) });
    const adapter = makeAdapter();
    const svc = createCalendarSyncService({
      supabase,
      adapters: () => adapter,
      now: () => NOW,
    });
    const outcome = await svc.syncOne(baseProjection);
    expect(outcome.decision).toBe("synced");
    expect(outcome.externalEventRef).toBe("ext-new-1");
    expect(updates[0].sync_status).toBe("synced");
    expect(updates[0].retry_count).toBe(0);
    expect(updates[0].external_event_ref).toBe("ext-new-1");
  });

  it("updates existing external event when ref present", async () => {
    const { supabase } = makeMockSupabase({ meeting: makeMeetingRow(true) });
    const updateSpy = vi.fn(async (_u: string, ref: string) => ({ externalEventRef: ref }));
    const adapter = makeAdapter({ updateCalendarEvent: updateSpy });
    const svc = createCalendarSyncService({ supabase, adapters: () => adapter, now: () => NOW });
    const outcome = await svc.syncOne({ ...baseProjection, externalEventRef: "ext-existing" });
    expect(outcome.decision).toBe("synced");
    expect(updateSpy).toHaveBeenCalledOnce();
  });

  it("cancels event and marks cancelled when meeting is no longer scheduled", async () => {
    const { supabase, updates } = makeMockSupabase({ meeting: makeMeetingRow(false) });
    const cancelSpy = vi.fn(async () => {});
    const adapter = makeAdapter({ cancelCalendarEvent: cancelSpy });
    const svc = createCalendarSyncService({ supabase, adapters: () => adapter, now: () => NOW });
    const outcome = await svc.syncOne({ ...baseProjection, externalEventRef: "ext-existing" });
    expect(outcome.decision).toBe("cancelled");
    expect(cancelSpy).toHaveBeenCalledOnce();
    expect(updates[0].sync_status).toBe("cancelled");
  });

  it("schedules retry with retry_after_at on transient failure", async () => {
    const { supabase, updates } = makeMockSupabase({ meeting: makeMeetingRow(true) });
    const adapter = makeAdapter({
      async createCalendarEvent() {
        throw new CalendarError("CALENDAR_PROVIDER_UNAVAILABLE", "boom");
      },
    });
    const svc = createCalendarSyncService({
      supabase,
      adapters: () => adapter,
      now: () => NOW,
      random: () => 0.5,
    });
    const outcome = await svc.syncOne(baseProjection);
    expect(outcome.decision).toBe("retry_scheduled");
    expect(outcome.errorCode).toBe("CALENDAR_PROVIDER_UNAVAILABLE");
    expect(updates[0].sync_status).toBe("retry_scheduled");
    expect(typeof updates[0].retry_after_at).toBe("string");
    expect(updates[0].retry_count).toBe(1);
  });

  it("marks permanent_failure when adapter throws non-retriable code", async () => {
    const { supabase, updates } = makeMockSupabase({ meeting: makeMeetingRow(true) });
    const adapter = makeAdapter({
      async createCalendarEvent() {
        throw new CalendarError("CALENDAR_ACCOUNT_REVOKED", "revoked");
      },
    });
    const svc = createCalendarSyncService({ supabase, adapters: () => adapter, now: () => NOW });
    const outcome = await svc.syncOne(baseProjection);
    expect(outcome.decision).toBe("failed");
    expect(outcome.errorCode).toBe("CALENDAR_ACCOUNT_REVOKED");
    expect(updates[0].permanent_failure).toBe(true);
    expect(updates[0].sync_status).toBe("failed");
  });

  it("re-processing an already-synced projection still writes idempotent synced state", async () => {
    // Simulates worker double-claim (SKIP LOCKED shouldn't dispatch twice but
    // defence-in-depth: outcome must remain synced, no error, ref preserved).
    const { supabase, updates } = makeMockSupabase({ meeting: makeMeetingRow(true) });
    const adapter = makeAdapter({
      async updateCalendarEvent(_u, ref) {
        return { externalEventRef: ref };
      },
    });
    const svc = createCalendarSyncService({ supabase, adapters: () => adapter, now: () => NOW });
    const outcome = await svc.syncOne({
      ...baseProjection,
      syncStatus: "synced",
      externalEventRef: "ext-persisted",
    });
    expect(outcome.decision).toBe("synced");
    expect(updates[0].external_event_ref).toBe("ext-persisted");
    expect(updates[0].retry_count).toBe(0);
  });
});

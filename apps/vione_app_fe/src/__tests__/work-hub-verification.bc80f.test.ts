// BC-8.0F — Supplementary acceptance-gate evidence.
// Covers dedupe/suppression, summary/list parity, cursor category-binding,
// resilience, SDK read-only freeze, source-limit constants.

import { describe, expect, it } from "vitest";
import {
  WORK_HUB_PAGE_SIZE_MAX,
  WORK_HUB_PRIORITY_VERSION,
  WORK_HUB_SOURCE_READ_LIMIT_DEFAULT,
  WORK_HUB_WINDOWS,
  WorkHubSDK,
  buildOverview,
  buildSummary,
  decodeCursor,
  dedupeWorkHubItems,
  resolveConnectionRequest,
  resolveIntroductionRequest,
  resolveMeetingFollowUp,
  resolveMeetingWorkspaceItem,
} from "@/lib/business-connect/work-hub";
import { WorkHubService } from "@/lib/business-connect/work-hub/service.server";
import { WorkHubError } from "@/lib/business-connect/work-hub/errors";

const NOW = "2026-07-16T10:00:00.000Z";

// ── Fake bounded Supabase (records .limit calls) ────────────────────────────
function makeSb(rows: Record<string, unknown[]>) {
  const limitCalls: Array<{ table: string; limit: number }> = [];
  const builder = (table: string) => {
    const data = rows[table] ?? [];
    const b: any = {
      select: () => b,
      in: () => b,
      order: () => b,
      limit: (n: number) => {
        limitCalls.push({ table, limit: n });
        return Promise.resolve({ data, error: null });
      },
    };
    return b;
  };
  return { from: builder as any, limitCalls };
}

describe("BC-8.0F suppression & dedupe", () => {
  it("dedupes overdue vs active follow-up on same source record", () => {
    const overdue = resolveMeetingFollowUp({
      id: "f1",
      meetingId: "m1",
      status: "open",
      dueAt: "2026-07-01T00:00:00Z",
      temporalState: "overdue",
      title: null,
    })!;
    const active = resolveMeetingFollowUp({
      id: "f1",
      meetingId: "m1",
      status: "open",
      dueAt: null,
      temporalState: "active",
      title: null,
    })!;
    const kept = dedupeWorkHubItems([active, overdue]);
    expect(kept).toHaveLength(1);
    expect(kept[0]!.itemKind).toBe("meeting_follow_up_overdue");
  });

  it("resolver drops terminal connection statuses", () => {
    for (const status of ["accepted", "declined", "cancelled"]) {
      const r = resolveConnectionRequest(
        { id: "r", direction: "incoming", status, createdAt: NOW },
        { now: NOW },
      );
      expect(r).toBeNull();
    }
  });

  it("resolver drops terminal introduction statuses", () => {
    const r = resolveIntroductionRequest(
      { id: "i", role: "intermediary", status: "declined", createdAt: NOW },
      { now: NOW },
    );
    expect(r).toBeNull();
  });

  it("cancelled meeting produces no work-hub item", () => {
    const it = resolveMeetingWorkspaceItem(
      {
        meetingId: "m1",
        status: "cancelled",
        bucket: "overview",
        suggestedActionKind: "view_meeting",
        scheduledStartAt: null,
        viewerRole: "organizer",
        hasOutcome: false,
      },
      { now: NOW },
    );
    expect(it).toBeNull();
  });

  it("finalized outcome suppresses outcome_missing", () => {
    const it = resolveMeetingWorkspaceItem(
      {
        meetingId: "m1",
        status: "completed",
        bucket: "history",
        suggestedActionKind: "view_meeting",
        scheduledStartAt: "2026-07-10T00:00:00Z",
        viewerRole: "organizer",
        hasOutcome: true,
      },
      { now: NOW },
    );
    expect(it).toBeNull();
  });

  it("dedupeKey is stable across repeated reads", () => {
    const a = resolveConnectionRequest(
      { id: "r1", direction: "incoming", status: "pending", createdAt: NOW },
      { now: NOW },
    )!;
    const b = resolveConnectionRequest(
      { id: "r1", direction: "incoming", status: "pending", createdAt: NOW },
      { now: NOW },
    )!;
    expect(a.dedupeKey).toBe(b.dedupeKey);
    expect(a.id).toBe(b.id);
  });
});

describe("BC-8.0F summary/list parity", () => {
  it("summary counts equal categorized list counts", () => {
    const items = [
      resolveConnectionRequest(
        { id: "r1", direction: "incoming", status: "pending", createdAt: NOW },
        { now: NOW },
      )!,
      resolveConnectionRequest(
        { id: "r2", direction: "incoming", status: "pending", createdAt: NOW },
        { now: NOW },
      )!,
      resolveMeetingFollowUp({
        id: "f1",
        meetingId: "m",
        status: "open",
        dueAt: "2026-07-01T00:00:00Z",
        temporalState: "overdue",
        title: null,
      })!,
    ];
    const summary = buildSummary(items, NOW);
    expect(summary.needsActionCount).toBe(2);
    expect(summary.overdueCount).toBe(1);
    const overview = buildOverview(items, NOW, 10);
    expect(overview.previews.needs_action.length).toBe(summary.needsActionCount);
    expect(overview.previews.overdue.length).toBe(summary.overdueCount);
  });
});

describe("BC-8.0F cursor pagination", () => {
  it("cursor carries registry version and item identity", () => {
    const dec = decodeCursor(
      Buffer.from(
        JSON.stringify({
          v: WORK_HUB_PRIORITY_VERSION,
          c: "needs_action",
          p: 1,
          d: null,
          s: null,
          o: NOW,
          i: "connection:r1:connection_request_received",
          f: null,
        }),
      ).toString("base64"),
    );
    expect(dec?.v).toBe(WORK_HUB_PRIORITY_VERSION);
    expect(dec?.c).toBe("needs_action");
  });

  it("mismatched registry version is rejected", () => {
    const bad = Buffer.from(JSON.stringify({ v: "0.0.0", i: "x" })).toString("base64");
    expect(decodeCursor(bad)).toBeNull();
  });

  it("service rejects stale/invalid cursor with typed error", async () => {
    const sb = makeSb({}).from as any;
    await expect(
      WorkHubService.listItems({ from: sb } as any, "u1", NOW, {
        cursor: "!!!not-base64!!!",
        limit: 20,
      } as any),
    ).rejects.toBeInstanceOf(WorkHubError);
  });

  it("service enforces max page size", async () => {
    const sb = makeSb({}).from as any;
    await expect(
      WorkHubService.listItems({ from: sb } as any, "u1", NOW, {
        limit: WORK_HUB_PAGE_SIZE_MAX + 1,
      } as any),
    ).rejects.toBeInstanceOf(WorkHubError);
  });
});

describe("BC-8.0F bounded reads (N+1 gate)", () => {
  it("repository issues a fixed, bounded query count regardless of item count", async () => {
    // Simulate 500 rows in every source; repository must still cap at LIMIT.
    const many = Array.from({ length: 500 }, (_, i) => ({
      id: `x${i}`,
      created_at: NOW,
      occurred_at: NOW,
      event_kind: "x",
      status: "pending",
      requester_user_id: "u1",
      target_user_id: "u2",
      scheduled_start_at: NOW,
      organizer_user_id: "u1",
      meeting_id: "m",
      owner_user_id: "u1",
      due_at: NOW,
      recipient_user_id: "u1",
    }));
    const { from, limitCalls } = makeSb({
      global_connection_requests: many,
      introduction_requests: many,
      introduction_deliveries: many,
      business_meetings: many,
      business_meeting_follow_ups: many,
      graph_timeline_events: many,
    });
    await WorkHubService.getOverview({ from } as any, "u1", NOW);
    // Exactly one bounded read per source. No per-card reads.
    expect(limitCalls.length).toBe(6);
    for (const c of limitCalls) {
      expect(c.limit).toBeLessThanOrEqual(WORK_HUB_SOURCE_READ_LIMIT_DEFAULT);
    }
  });
});

describe("BC-8.0F resilience", () => {
  it("all-source failure returns empty overview instead of throwing", async () => {
    const brokenFrom = () => {
      const b: any = {
        select: () => b,
        in: () => b,
        order: () => b,
        limit: () => Promise.reject(new Error("db down")),
      };
      return b;
    };
    const ov = await WorkHubService.getOverview({ from: brokenFrom } as any, "u1", NOW);
    expect(ov.summary.needsActionCount).toBe(0);
    expect(ov.previews.needs_action).toEqual([]);
  });
});

describe("BC-8.0F SDK read-only freeze", () => {
  it("SDK exposes no lifecycle mutation methods", () => {
    for (const k of Object.keys(WorkHubSDK)) {
      expect(k).not.toMatch(
        /create|update|delete|cancel|accept|decline|respond|propose|select|mutate/i,
      );
    }
  });
});

describe("BC-8.0F windows are frozen", () => {
  it("registry version + windows are immutable constants", () => {
    expect(WORK_HUB_WINDOWS.upcomingDays).toBe(30);
    expect(WORK_HUB_WINDOWS.dueSoonDays).toBe(7);
    expect(WORK_HUB_WINDOWS.recentDays).toBe(14);
    expect(() => {
      (WORK_HUB_WINDOWS as any).upcomingDays = 99;
    }).toThrow();
  });
});

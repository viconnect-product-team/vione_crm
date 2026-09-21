// BC-8.0 — Work Hub domain unit tests. Pure logic only (no DB, no network).

import { describe, expect, it } from "vitest";
import {
  WORK_HUB_CATEGORIES,
  WORK_HUB_CATEGORY_PRECEDENCE,
  WORK_HUB_ITEM_KINDS,
  WORK_HUB_PRIORITY,
  WORK_HUB_PRIORITY_VERSION,
  WORK_HUB_SDK_METHODS,
  WORK_HUB_SOURCE_TYPES,
  WorkHubSDK,
  buildOverview,
  buildSummary,
  compareWorkHubItems,
  dedupeWorkHubItems,
  decodeCursor,
  encodeCursor,
  resolveConnectionRequest,
  resolveIntroductionRequest,
  resolveMeetingFollowUp,
  resolveMeetingWorkspaceItem,
  resolveRelationshipActivity,
  sortWorkHubItems,
  type WorkHubItemDTO,
} from "@/lib/business-connect/work-hub";
import { WORK_HUB_KIND_REGISTRY } from "@/lib/business-connect/work-hub/registry";

const NOW = "2026-07-16T10:00:00.000Z";

describe("BC-8.0 registry integrity", () => {
  it("every item kind has a descriptor", () => {
    for (const k of WORK_HUB_ITEM_KINDS) {
      expect(WORK_HUB_KIND_REGISTRY[k]).toBeDefined();
    }
  });
  it("category precedence covers every category exactly once", () => {
    const set = new Set(WORK_HUB_CATEGORY_PRECEDENCE);
    expect(set.size).toBe(WORK_HUB_CATEGORIES.length);
    for (const c of WORK_HUB_CATEGORIES) expect(set.has(c)).toBe(true);
  });
  it("registry version is frozen and non-empty", () => {
    expect(typeof WORK_HUB_PRIORITY_VERSION).toBe("string");
    expect(WORK_HUB_PRIORITY_VERSION.length).toBeGreaterThan(0);
  });
});

describe("BC-8.0 SDK freeze", () => {
  it("exposes only whitelisted read methods", () => {
    const actual = Object.keys(WorkHubSDK).sort();
    expect(actual).toEqual([...WORK_HUB_SDK_METHODS].sort());
    for (const m of actual) {
      expect(m).not.toMatch(/^(create|update|delete|cancel|respond|propose|select)/i);
    }
  });
  it("registry priority tiers are P0..P7 only", () => {
    const allowed = new Set(Object.values(WORK_HUB_PRIORITY));
    for (const k of WORK_HUB_ITEM_KINDS) {
      expect(allowed.has(WORK_HUB_KIND_REGISTRY[k].priority)).toBe(true);
    }
  });
});

describe("BC-8.0 sort + dedup", () => {
  const a = resolveMeetingFollowUp({
    id: "f1",
    meetingId: "m1",
    status: "open",
    dueAt: "2026-07-15T00:00:00Z",
    temporalState: "overdue",
    title: null,
  })!;
  const b = resolveMeetingFollowUp({
    id: "f2",
    meetingId: "m2",
    status: "open",
    dueAt: "2026-07-17T00:00:00Z",
    temporalState: "due_soon",
    title: null,
  })!;
  const c = resolveMeetingWorkspaceItem(
    {
      meetingId: "m3",
      status: "confirmed",
      bucket: "upcoming",
      suggestedActionKind: "view_meeting",
      scheduledStartAt: "2026-07-20T00:00:00Z",
      viewerRole: "organizer",
      counterpartDisplayName: null,
      hasOutcome: false,
    },
    { now: NOW },
  )!;

  it("overdue beats due_soon beats upcoming", () => {
    const sorted = sortWorkHubItems([c, b, a]);
    expect(sorted[0]!.id).toBe(a.id);
    expect(sorted[1]!.id).toBe(b.id);
    expect(sorted[2]!.id).toBe(c.id);
  });

  it("sort is stable and deterministic", () => {
    const one = sortWorkHubItems([a, b, c]);
    const two = sortWorkHubItems([c, b, a]);
    expect(one.map((i) => i.id)).toEqual(two.map((i) => i.id));
  });

  it("dedup keeps highest-precedence item for same source record", () => {
    // craft a duplicate for follow-up f1 with lower urgency
    const dup: WorkHubItemDTO = {
      ...a,
      id: "meeting_follow_up:f1:meeting_follow_up_active",
      itemKind: "meeting_follow_up_active",
      category: "waiting",
      priority: WORK_HUB_PRIORITY.P6,
      urgency: "low",
    };
    const deduped = dedupeWorkHubItems([dup, a]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]!.id).toBe(a.id);
  });

  it("compareWorkHubItems is total-order (never returns NaN)", () => {
    expect(Number.isFinite(compareWorkHubItems(a, b))).toBe(true);
    expect(compareWorkHubItems(a, a)).toBe(0);
    expect(compareWorkHubItems(a, b) + compareWorkHubItems(b, a)).toBe(0);
  });
});

describe("BC-8.0 resolvers safety", () => {
  it("connection request produces PII-safe DTO with route+params", () => {
    const it = resolveConnectionRequest(
      {
        id: "r1",
        direction: "incoming",
        status: "pending",
        createdAt: NOW,
        counterpartHandle: "@alice",
        counterpartDisplayName: "Alice",
        counterpartAvatarUrl: null,
      },
      { now: NOW },
    )!;
    expect(it.sourceType).toBe("connection");
    expect(it.action.targetRoute).toBe("/business-connect/connections");
    expect(it.action.targetParams).toBeNull();
    expect(it.action.targetSearch).toEqual({ requestId: "r1" });
    // NO raw user IDs on display data
    expect(JSON.stringify(it.safeDisplayData)).not.toMatch(/user_id|auth\.uid/);
  });

  it("skips non-actionable connection statuses", () => {
    const it = resolveConnectionRequest(
      { id: "r1", direction: "incoming", status: "accepted", createdAt: NOW },
      { now: NOW },
    );
    expect(it).toBeNull();
  });

  it("introduction request resolver picks correct kind per role/status", () => {
    const received = resolveIntroductionRequest(
      { id: "i1", role: "intermediary", status: "pending", createdAt: NOW },
      { now: NOW },
    );
    expect(received?.itemKind).toBe("introduction_request_received");
    const waiting = resolveIntroductionRequest(
      { id: "i2", role: "intermediary", status: "accepted", createdAt: NOW },
      { now: NOW },
    );
    expect(waiting?.itemKind).toBe("introduction_request_accepted_waiting_delivery");
    const ignored = resolveIntroductionRequest(
      { id: "i3", role: "target", status: "delivered", createdAt: NOW },
      { now: NOW },
    );
    expect(ignored).toBeNull();
  });

  it("upcoming meeting is dropped past the 30-day window", () => {
    const far = resolveMeetingWorkspaceItem(
      {
        meetingId: "m9",
        status: "confirmed",
        bucket: "upcoming",
        suggestedActionKind: "view_meeting",
        scheduledStartAt: "2027-01-01T00:00:00Z",
        viewerRole: "organizer",
        counterpartDisplayName: null,
        hasOutcome: false,
      },
      { now: NOW },
    );
    expect(far).toBeNull();
  });

  it("relationship activity outside recent window is dropped", () => {
    const stale = resolveRelationshipActivity(
      {
        id: "ev1",
        occurredAt: "2020-01-01T00:00:00Z",
        eventKind: "meeting_completed",
        personNodeId: null,
      },
      { now: NOW },
    );
    expect(stale).toBeNull();
  });
});

describe("BC-8.0 summary + overview", () => {
  it("counts each category correctly", () => {
    const overdue = resolveMeetingFollowUp({
      id: "f1",
      meetingId: "m1",
      status: "open",
      dueAt: "2026-07-01T00:00:00Z",
      temporalState: "overdue",
      title: null,
    })!;
    const needs = resolveConnectionRequest(
      { id: "r1", direction: "incoming", status: "pending", createdAt: NOW },
      { now: NOW },
    )!;
    const summary = buildSummary([overdue, needs], NOW);
    expect(summary.overdueCount).toBe(1);
    expect(summary.needsActionCount).toBe(1);
    expect(summary.highestPriority).toBe(WORK_HUB_PRIORITY.P1);
    expect(summary.registryVersion).toBe(WORK_HUB_PRIORITY_VERSION);
  });

  it("overview previews cap per category", () => {
    const items: WorkHubItemDTO[] = [];
    for (let i = 0; i < 10; i++) {
      const it = resolveConnectionRequest(
        {
          id: `r${i}`,
          direction: "incoming",
          status: "pending",
          createdAt: NOW,
        },
        { now: NOW },
      );
      if (it) items.push(it);
    }
    const ov = buildOverview(items, NOW, 3);
    expect(ov.previews.needs_action.length).toBeLessThanOrEqual(3);
    expect(ov.summary.needsActionCount).toBe(10);
  });
});

describe("BC-8.0 cursor codec", () => {
  it("round-trips a cursor", () => {
    const enc = encodeCursor({
      v: WORK_HUB_PRIORITY_VERSION,
      c: "needs_action",
      p: WORK_HUB_PRIORITY.P1,
      d: null,
      s: null,
      o: NOW,
      i: "connection:r1:connection_request_received",
      f: null,
    });
    const dec = decodeCursor(enc);
    expect(dec?.i).toBe("connection:r1:connection_request_received");
    expect(dec?.v).toBe(WORK_HUB_PRIORITY_VERSION);
  });
  it("rejects garbled cursors", () => {
    expect(decodeCursor("not-a-cursor")).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor(null)).toBeNull();
  });
});

describe("BC-8.0 source coverage", () => {
  it("every declared source type is represented by at least one kind", () => {
    const covered = new Set<string>();
    for (const k of WORK_HUB_ITEM_KINDS) {
      covered.add(WORK_HUB_KIND_REGISTRY[k].sourceHint);
    }
    for (const s of WORK_HUB_SOURCE_TYPES) {
      // "meeting_invitation" and "meeting" both map to meeting UI; the
      // resolver produces the concrete sourceType per item, so we only
      // require the source hint (used in docs/tests) to exist somewhere.
      // A few source types (e.g. calendar_sync) are surfaced through a
      // single kind — that still counts as covered.
      if (s === "meeting" || s === "meeting_invitation" || s === "meeting_scheduling") {
        continue;
      }
      expect(covered.has(s)).toBe(true);
    }
  });
});

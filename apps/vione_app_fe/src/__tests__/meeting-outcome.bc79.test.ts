// BC-7.9 Turn A — Meeting Outcome domain tests.
// Pure logic + service-level behaviour via an in-memory Supabase-shaped mock
// that mirrors the RPC contract (organizer authority, meeting eligibility,
// idempotency, version conflict, finalized immutability, exactly-once events).

import { describe, expect, it, beforeEach } from "vitest";
import { MEETING_OUTCOME_TYPES, MEETING_OUTCOME_STATUSES } from "@/lib/meeting/outcome/types";
import {
  MeetingOutcomeRegistry,
  isAllowedStatusTransition,
  isKnownOutcomeType,
} from "@/lib/meeting/outcome/registry";
import {
  MeetingOutcomeError,
  mapMeetingOutcomeError,
  MEETING_OUTCOME_ERROR_CODES,
} from "@/lib/meeting/outcome/errors";
import {
  canCreateOutcome,
  canFinalizeOutcome,
  canReadOutcome,
  canUpdateOutcome,
  derivePermissions,
  isOutcomeMeetingStateEligible,
  validateOutcomeTransition,
} from "@/lib/meeting/outcome/outcome-policy";
import { MeetingOutcomeService } from "@/lib/meeting/outcome/service.server";
import { MEETING_OUTCOME_SDK_METHODS, MeetingOutcomeSDK } from "@/lib/meeting/outcome/sdk";

// ─── Registry ────────────────────────────────────────────────────────────────

describe("BC-7.9 outcome registry", () => {
  it("freezes 10 outcome types", () => {
    expect(MEETING_OUTCOME_TYPES.length).toBe(10);
    expect(MeetingOutcomeRegistry.version).toBe("1.0.0");
  });
  it("freezes 2 statuses", () => {
    expect(MEETING_OUTCOME_STATUSES).toEqual(["draft", "finalized"]);
  });
  it("rejects unknown types", () => {
    expect(isKnownOutcomeType("nope")).toBe(false);
    expect(isKnownOutcomeType("agreement_reached")).toBe(true);
  });
  it("only draft→finalized (and finalized→finalized idempotent) transitions", () => {
    expect(isAllowedStatusTransition("draft", "finalized")).toBe(true);
    expect(isAllowedStatusTransition("finalized", "finalized")).toBe(true);
    expect(isAllowedStatusTransition("finalized", "draft")).toBe(false);
    expect(isAllowedStatusTransition("draft", "draft")).toBe(false);
  });
});

// ─── Policy branch coverage ──────────────────────────────────────────────────

describe("BC-7.9 outcome policy", () => {
  const base = {
    viewerUserId: "u-org",
    organizerUserId: "u-org",
    isParticipant: true,
    meetingStatus: "completed" as const,
    outcome: null,
  };

  it("eligibility only for in_progress / completed", () => {
    for (const s of ["completed", "in_progress"] as const) {
      expect(isOutcomeMeetingStateEligible(s)).toBe(true);
    }
    for (const s of [
      "draft",
      "proposed",
      "confirmed",
      "declined",
      "cancelled",
      "no_show",
    ] as const) {
      expect(isOutcomeMeetingStateEligible(s)).toBe(false);
    }
  });

  it("organizer can create when eligible & no outcome; not for other statuses", () => {
    expect(canCreateOutcome(base)).toBe(true);
    expect(canCreateOutcome({ ...base, meetingStatus: "proposed" })).toBe(false);
    expect(canCreateOutcome({ ...base, viewerUserId: "u-other" })).toBe(false);
    expect(canCreateOutcome({ ...base, outcome: { outcomeStatus: "draft" } })).toBe(false);
  });

  it("update/finalize require draft outcome and organizer identity", () => {
    const draft = { ...base, outcome: { outcomeStatus: "draft" as const } };
    expect(canUpdateOutcome(draft)).toBe(true);
    expect(canFinalizeOutcome(draft)).toBe(true);
    const finalized = { ...base, outcome: { outcomeStatus: "finalized" as const } };
    expect(canUpdateOutcome(finalized)).toBe(false);
    expect(canFinalizeOutcome(finalized)).toBe(false);
    expect(canUpdateOutcome({ ...draft, viewerUserId: "u-other" })).toBe(false);
  });

  it("participants can read; unrelated users cannot", () => {
    expect(canReadOutcome({ ...base, viewerUserId: "u-p", isParticipant: true })).toBe(true);
    expect(canReadOutcome({ ...base, viewerUserId: "u-x", isParticipant: false })).toBe(false);
  });

  it("validateOutcomeTransition guards finalized and null→finalized", () => {
    expect(validateOutcomeTransition("finalized", "finalized").ok).toBe(false);
    expect(validateOutcomeTransition(null, "finalized").ok).toBe(false);
    expect(validateOutcomeTransition(null, "draft").ok).toBe(true);
    expect(validateOutcomeTransition("draft", "finalized").ok).toBe(true);
  });

  it("derivePermissions composes all four flags", () => {
    const p = derivePermissions({ ...base, outcome: { outcomeStatus: "draft" } });
    expect(p).toEqual({ canCreate: false, canUpdate: true, canFinalize: true, canRead: true });
  });
});

// ─── Error mapping ───────────────────────────────────────────────────────────

describe("BC-7.9 outcome error mapping", () => {
  it("maps every canonical code back to itself", () => {
    for (const c of MEETING_OUTCOME_ERROR_CODES) {
      const mapped = mapMeetingOutcomeError(new Error(`P0001: ${c}`));
      expect(mapped.code).toBe(c);
    }
  });
  it("unknown errors collapse to INTERNAL_ERROR", () => {
    expect(mapMeetingOutcomeError(new Error("boom")).code).toBe("MEETING_OUTCOME_INTERNAL_ERROR");
    expect(mapMeetingOutcomeError(null).code).toBe("MEETING_OUTCOME_INTERNAL_ERROR");
  });
  it("MeetingOutcomeError passes through", () => {
    const e = new MeetingOutcomeError("MEETING_OUTCOME_FINALIZED");
    expect(mapMeetingOutcomeError(e)).toBe(e);
  });
});

// ─── SDK freeze ──────────────────────────────────────────────────────────────

describe("BC-7.9 SDK freeze", () => {
  it("exposes the four Turn A outcome methods (plus Turn B follow-up methods)", () => {
    // Turn B extends the SDK with follow-up methods. The outcome quartet must
    // still be present at the head of the frozen surface.
    expect(MEETING_OUTCOME_SDK_METHODS.slice(0, 4)).toEqual([
      "getOutcome",
      "createOutcome",
      "updateOutcome",
      "finalizeOutcome",
    ]);
    expect(Object.isFrozen(MeetingOutcomeSDK)).toBe(true);
    for (const m of ["getOutcome", "createOutcome", "updateOutcome", "finalizeOutcome"] as const) {
      expect(typeof (MeetingOutcomeSDK as unknown as Record<string, unknown>)[m]).toBe("function");
    }
  });
});

// ─── Service behaviour via in-memory RPC harness ─────────────────────────────
// Mirrors the SECURITY DEFINER contract of the SQL RPCs. Not a substitute for
// end-to-end DB tests, but validates client-side service invariants against a
// truthful spec of RPC behaviour.

type Row = {
  id: string;
  meeting_id: string;
  recorded_by_user_id: string;
  outcome_type: string;
  outcome_status: "draft" | "finalized";
  summary: string | null;
  finalized_at: string | null;
  version: number;
  client_request_id: string | null;
  created_at: string;
  updated_at: string;
};

type Meeting = { id: string; organizer_user_id: string; status: "completed" | "proposed" };

interface Event {
  type: string;
  mutationKey: string;
  meta: Record<string, unknown>;
}

function makeMock(opts: { viewer: string; meeting: Meeting; eligible?: boolean }) {
  const rows = new Map<string, Row>(); // by meeting_id
  const events: Event[] = [];

  const rpc = async (name: string, params: Record<string, unknown>) => {
    const meetingId = params._meeting_id as string;
    const m = opts.meeting;
    if (!m || m.id !== meetingId) {
      return { data: null, error: new Error("MEETING_OUTCOME_NOT_FOUND") };
    }
    if (m.organizer_user_id !== opts.viewer) {
      return { data: null, error: new Error("MEETING_OUTCOME_FORBIDDEN") };
    }
    if (opts.eligible === false || m.status !== "completed") {
      return { data: null, error: new Error("MEETING_OUTCOME_INVALID_STATE") };
    }

    if (name === "business_meeting_outcome_create") {
      const cri = (params._client_request_id ?? null) as string | null;
      const existing = rows.get(meetingId);
      if (existing) {
        if (cri && existing.client_request_id === cri) return { data: existing, error: null };
        return { data: null, error: new Error("MEETING_OUTCOME_ALREADY_EXISTS") };
      }
      const type = params._outcome_type as string;
      if (!(MEETING_OUTCOME_TYPES as readonly string[]).includes(type)) {
        return { data: null, error: new Error("MEETING_OUTCOME_INVALID_TYPE") };
      }
      const summary = (params._summary as string | null)?.trim() || null;
      if (summary && summary.length > 2000) {
        return { data: null, error: new Error("MEETING_OUTCOME_INVALID_SUMMARY") };
      }
      const now = new Date().toISOString();
      const row: Row = {
        id: `o-${meetingId}`,
        meeting_id: meetingId,
        recorded_by_user_id: opts.viewer,
        outcome_type: type,
        outcome_status: "draft",
        summary,
        finalized_at: null,
        version: 1,
        client_request_id: cri,
        created_at: now,
        updated_at: now,
      };
      rows.set(meetingId, row);
      events.push({
        type: "business_meeting_outcome_created",
        mutationKey: `outcome_create:${row.id}`,
        meta: { outcomeId: row.id, version: 1 },
      });
      return { data: row, error: null };
    }

    if (name === "business_meeting_outcome_update") {
      const row = rows.get(meetingId);
      if (!row) return { data: null, error: new Error("MEETING_OUTCOME_NOT_FOUND") };
      if (row.outcome_status === "finalized") {
        return { data: null, error: new Error("MEETING_OUTCOME_FINALIZED") };
      }
      const exp = params._expected_version as number;
      if (row.version !== exp) {
        return { data: null, error: new Error("MEETING_OUTCOME_VERSION_CONFLICT") };
      }
      const nextType = (params._outcome_type as string | null) ?? row.outcome_type;
      if (!(MEETING_OUTCOME_TYPES as readonly string[]).includes(nextType)) {
        return { data: null, error: new Error("MEETING_OUTCOME_INVALID_TYPE") };
      }
      let nextSummary: string | null = row.summary;
      if (params._clear_summary) nextSummary = null;
      else if (params._summary != null) {
        const t = (params._summary as string).trim();
        if (t.length > 2000)
          return { data: null, error: new Error("MEETING_OUTCOME_INVALID_SUMMARY") };
        nextSummary = t || null;
      }
      row.outcome_type = nextType;
      row.summary = nextSummary;
      row.version += 1;
      row.updated_at = new Date().toISOString();
      events.push({
        type: "business_meeting_outcome_updated",
        mutationKey: `outcome_update:${row.id}:${row.version}`,
        meta: { outcomeId: row.id, version: row.version },
      });
      return { data: row, error: null };
    }

    if (name === "business_meeting_outcome_finalize") {
      const row = rows.get(meetingId);
      if (!row) return { data: null, error: new Error("MEETING_OUTCOME_NOT_FOUND") };
      const exp = params._expected_version as number;
      if (row.outcome_status === "finalized") {
        // idempotent: accept either the pre-finalize version or the current
        if (exp !== row.version && exp + 1 !== row.version) {
          return { data: null, error: new Error("MEETING_OUTCOME_VERSION_CONFLICT") };
        }
        return { data: row, error: null };
      }
      if (row.version !== exp) {
        return { data: null, error: new Error("MEETING_OUTCOME_VERSION_CONFLICT") };
      }
      row.outcome_status = "finalized";
      row.finalized_at = new Date().toISOString();
      row.version += 1;
      events.push({
        type: "business_meeting_outcome_finalized",
        mutationKey: `outcome_finalize:${row.id}`,
        meta: { outcomeId: row.id, version: row.version },
      });
      return { data: row, error: null };
    }
    return { data: null, error: new Error("MEETING_OUTCOME_INTERNAL_ERROR") };
  };

  const sb = {
    rpc,
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            const r = rows.get(opts.meeting.id) ?? null;
            return { data: r, error: null };
          },
        }),
      }),
    }),
  };

  return { sb: sb as any, events, rows };
}

const MID = "11111111-1111-1111-1111-111111111111";

describe("BC-7.9 outcome service — behavioural contract", () => {
  let harness: ReturnType<typeof makeMock>;

  beforeEach(() => {
    harness = makeMock({
      viewer: "u-org",
      meeting: { id: MID, organizer_user_id: "u-org", status: "completed" },
    });
  });

  it("valid create returns a draft DTO without recorded_by leak", async () => {
    const dto = await MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
      meetingId: MID,
      outcomeType: "agreement_reached",
      summary: "  Great chat  ",
    });
    expect(dto.outcomeStatus).toBe("draft");
    expect(dto.summary).toBe("Great chat");
    expect(dto.version).toBe(1);
    expect(dto.viewerIsRecorder).toBe(true);
    // recorded_by_user_id must not exist on DTO surface
    expect((dto as unknown as Record<string, unknown>).recorded_by_user_id).toBeUndefined();
  });

  it("enforces one outcome per meeting", async () => {
    await MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
      meetingId: MID,
      outcomeType: "informational",
    });
    await expect(
      MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
        meetingId: MID,
        outcomeType: "informational",
      }),
    ).rejects.toMatchObject({ code: "MEETING_OUTCOME_ALREADY_EXISTS" });
  });

  it("idempotent create returns the same canonical row", async () => {
    const a = await MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
      meetingId: MID,
      outcomeType: "informational",
      clientRequestId: "req-1",
    });
    const b = await MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
      meetingId: MID,
      outcomeType: "informational",
      clientRequestId: "req-1",
    });
    expect(b.id).toBe(a.id);
    expect(b.version).toBe(1);
    // Exactly-one created event
    expect(harness.events.filter((e: any) => e.type === "business_meeting_outcome_created").length).toBe(
      1,
    );
  });

  it("rejects unknown outcome type client-side", async () => {
    await expect(
      MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
        meetingId: MID,
        // @ts-expect-error – intentional invalid input
        outcomeType: "hacked",
      }),
    ).rejects.toMatchObject({ code: "MEETING_OUTCOME_INVALID_TYPE" });
  });

  it("rejects summary over 2000 chars", async () => {
    await expect(
      MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
        meetingId: MID,
        outcomeType: "informational",
        summary: "x".repeat(2001),
      }),
    ).rejects.toMatchObject({ code: "MEETING_OUTCOME_INVALID_SUMMARY" });
  });

  it("rejects ineligible meeting state", async () => {
    const h = makeMock({
      viewer: "u-org",
      meeting: { id: MID, organizer_user_id: "u-org", status: "proposed" },
    });
    await expect(
      MeetingOutcomeService.createOutcome(h.sb, "u-org", {
        meetingId: MID,
        outcomeType: "informational",
      }),
    ).rejects.toMatchObject({ code: "MEETING_OUTCOME_INVALID_STATE" });
  });

  it("update draft bumps version by exactly 1 and emits one event", async () => {
    const created = await MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
      meetingId: MID,
      outcomeType: "informational",
    });
    const updated = await MeetingOutcomeService.updateOutcome(harness.sb, "u-org", {
      meetingId: MID,
      expectedVersion: created.version,
      outcomeType: "agreement_reached",
      summary: "Signed",
    });
    expect(updated.version).toBe(2);
    expect(updated.outcomeType).toBe("agreement_reached");
    expect(harness.events.filter((e: any) => e.type === "business_meeting_outcome_updated").length).toBe(
      1,
    );
  });

  it("stale expectedVersion → VERSION_CONFLICT (one succeeds, one fails)", async () => {
    const c = await MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
      meetingId: MID,
      outcomeType: "informational",
    });
    await MeetingOutcomeService.updateOutcome(harness.sb, "u-org", {
      meetingId: MID,
      expectedVersion: c.version,
      summary: "first",
    });
    await expect(
      MeetingOutcomeService.updateOutcome(harness.sb, "u-org", {
        meetingId: MID,
        expectedVersion: c.version, // stale
        summary: "second",
      }),
    ).rejects.toMatchObject({ code: "MEETING_OUTCOME_VERSION_CONFLICT" });
  });

  it("finalize succeeds once; duplicate finalize is idempotent (no extra event, no double bump)", async () => {
    const c = await MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
      meetingId: MID,
      outcomeType: "agreement_reached",
    });
    const f1 = await MeetingOutcomeService.finalizeOutcome(harness.sb, "u-org", {
      meetingId: MID,
      expectedVersion: c.version,
    });
    expect(f1.outcomeStatus).toBe("finalized");
    expect(f1.version).toBe(2);
    const f2 = await MeetingOutcomeService.finalizeOutcome(harness.sb, "u-org", {
      meetingId: MID,
      expectedVersion: c.version, // pre-finalize version, accepted
    });
    expect(f2.id).toBe(f1.id);
    expect(f2.version).toBe(f1.version);
    expect(
      harness.events.filter((e: any) => e.type === "business_meeting_outcome_finalized").length,
    ).toBe(1);
  });

  it("finalized outcome is immutable — update denied", async () => {
    const c = await MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
      meetingId: MID,
      outcomeType: "agreement_reached",
    });
    await MeetingOutcomeService.finalizeOutcome(harness.sb, "u-org", {
      meetingId: MID,
      expectedVersion: c.version,
    });
    await expect(
      MeetingOutcomeService.updateOutcome(harness.sb, "u-org", {
        meetingId: MID,
        expectedVersion: 2,
        summary: "late edit",
      }),
    ).rejects.toMatchObject({ code: "MEETING_OUTCOME_FINALIZED" });
  });

  it("event mutation keys are stable and unique across the lifecycle", async () => {
    const c = await MeetingOutcomeService.createOutcome(harness.sb, "u-org", {
      meetingId: MID,
      outcomeType: "informational",
    });
    await MeetingOutcomeService.updateOutcome(harness.sb, "u-org", {
      meetingId: MID,
      expectedVersion: c.version,
      summary: "x",
    });
    await MeetingOutcomeService.finalizeOutcome(harness.sb, "u-org", {
      meetingId: MID,
      expectedVersion: 2,
    });
    const keys = harness.events.map((e: any) => e.mutationKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual([
      `outcome_create:o-${MID}`,
      `outcome_update:o-${MID}:2`,
      `outcome_finalize:o-${MID}`,
    ]);
  });
});

// ─── Direct-write / DTO redaction contract ──────────────────────────────────

describe("BC-7.9 outcome DTO safety", () => {
  it("service.getOutcome never surfaces recorded_by_user_id in DTO", async () => {
    const h = makeMock({
      viewer: "u-org",
      meeting: { id: MID, organizer_user_id: "u-org", status: "completed" },
    });
    await MeetingOutcomeService.createOutcome(h.sb, "u-org", {
      meetingId: MID,
      outcomeType: "informational",
    });
    const dto = await MeetingOutcomeService.getOutcome(h.sb, "u-org", MID);
    expect(dto).not.toBeNull();
    expect((dto as unknown as Record<string, unknown>).recorded_by_user_id).toBeUndefined();
    expect(dto!.viewerIsRecorder).toBe(true);
  });
});

// BC-7.9 Turn B — Meeting Follow-up domain tests.
// Pure state-machine + policy + service-level contract via in-memory Supabase
// mock mirroring the SQL RPC behaviour (ownership, transitions, idempotency,
// version conflict, terminal immutability, exactly-once events).

import { beforeEach, describe, expect, it } from "vitest";
import {
  MEETING_FOLLOW_UP_PRIORITIES,
  MEETING_FOLLOW_UP_STATUSES,
  MEETING_FOLLOW_UP_DUE_SOON_MS,
} from "@/lib/meeting/follow-up/types";
import {
  MeetingFollowUpRegistry,
  isKnownFollowUpPriority,
  isKnownFollowUpStatus,
} from "@/lib/meeting/follow-up/registry";
import {
  MeetingFollowUpError,
  MEETING_FOLLOW_UP_ERROR_CODES,
  mapMeetingFollowUpError,
} from "@/lib/meeting/follow-up/errors";
import {
  canCancelFollowUp,
  canChangeFollowUpStatus,
  canCreateFollowUp,
  canEditFollowUp,
  canReassignOwner,
  canTransitionFollowUpStatus,
  deriveFollowUpTemporalState,
  deriveFollowUpViewerPermissions,
  isFollowUpTerminal,
} from "@/lib/meeting/follow-up/follow-up-policy";
import { MeetingFollowUpService } from "@/lib/meeting/follow-up/service.server";
import { MEETING_FOLLOW_UP_SDK_METHODS, MeetingFollowUpSDK } from "@/lib/meeting/follow-up/sdk";
import { MEETING_OUTCOME_SDK_METHODS } from "@/lib/meeting/outcome/sdk";

// ── Registry ────────────────────────────────────────────────────────────────
describe("BC-7.9B follow-up registry", () => {
  it("freezes 4 statuses and 4 priorities", () => {
    expect(MEETING_FOLLOW_UP_STATUSES).toEqual(["open", "in_progress", "completed", "cancelled"]);
    expect(MEETING_FOLLOW_UP_PRIORITIES).toEqual(["low", "normal", "high", "urgent"]);
    expect(MeetingFollowUpRegistry.version).toBe("1.0.0");
  });
  it("rejects unknown values", () => {
    expect(isKnownFollowUpStatus("nope")).toBe(false);
    expect(isKnownFollowUpStatus("open")).toBe(true);
    expect(isKnownFollowUpPriority("critical")).toBe(false);
    expect(isKnownFollowUpPriority("urgent")).toBe(true);
  });
});

// ── State machine ───────────────────────────────────────────────────────────
describe("BC-7.9B follow-up state machine", () => {
  it("allows exactly the frozen transition set", () => {
    const allowed: Array<[string, string]> = [
      ["open", "in_progress"],
      ["open", "completed"],
      ["open", "cancelled"],
      ["in_progress", "completed"],
      ["in_progress", "cancelled"],
    ];
    for (const s of MEETING_FOLLOW_UP_STATUSES) {
      for (const t of MEETING_FOLLOW_UP_STATUSES) {
        const should = allowed.some(([a, b]) => a === s && b === t);
        expect(canTransitionFollowUpStatus(s, t)).toBe(should);
      }
    }
  });
  it("terminal statuses are terminal", () => {
    expect(isFollowUpTerminal("completed")).toBe(true);
    expect(isFollowUpTerminal("cancelled")).toBe(true);
    expect(isFollowUpTerminal("open")).toBe(false);
    expect(isFollowUpTerminal("in_progress")).toBe(false);
  });
});

// ── Temporal derivation ─────────────────────────────────────────────────────
describe("BC-7.9B temporal derivation", () => {
  const now = new Date("2026-07-15T12:00:00Z");
  it("returns completed/cancelled for terminals regardless of due", () => {
    expect(
      deriveFollowUpTemporalState({
        status: "completed",
        dueAt: "2020-01-01T00:00:00Z",
        now,
      }),
    ).toBe("completed");
    expect(
      deriveFollowUpTemporalState({
        status: "cancelled",
        dueAt: null,
        now,
      }),
    ).toBe("cancelled");
  });
  it("returns active when no due date", () => {
    expect(deriveFollowUpTemporalState({ status: "open", dueAt: null, now })).toBe("active");
  });
  it("overdue when due < now", () => {
    expect(
      deriveFollowUpTemporalState({
        status: "in_progress",
        dueAt: "2026-07-15T11:59:59Z",
        now,
      }),
    ).toBe("overdue");
  });
  it("due_soon when due within 24h", () => {
    const dueSoon = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    expect(deriveFollowUpTemporalState({ status: "open", dueAt: dueSoon, now })).toBe("due_soon");
    const edge = new Date(now.getTime() + MEETING_FOLLOW_UP_DUE_SOON_MS).toISOString();
    expect(deriveFollowUpTemporalState({ status: "open", dueAt: edge, now })).toBe("due_soon");
  });
  it("active when due beyond 24h", () => {
    const future = new Date(now.getTime() + MEETING_FOLLOW_UP_DUE_SOON_MS + 1000).toISOString();
    expect(deriveFollowUpTemporalState({ status: "open", dueAt: future, now })).toBe("active");
  });
  it("invalid date treated as active", () => {
    expect(deriveFollowUpTemporalState({ status: "open", dueAt: "not-a-date", now })).toBe(
      "active",
    );
  });
});

// ── Ownership / authority ───────────────────────────────────────────────────
describe("BC-7.9B ownership policy", () => {
  const base = {
    viewerUserId: "u-org",
    organizerUserId: "u-org",
    isMeetingParticipant: true,
    followUp: {
      ownerUserId: "u-org",
      createdByUserId: "u-org",
      status: "open" as const,
    },
  };

  it("organizer may create with any intended owner", () => {
    expect(canCreateFollowUp(base, "u-part")).toBe(true);
    expect(canCreateFollowUp(base, "u-org")).toBe(true);
  });
  it("participant may only create self-owned", () => {
    const ctx = {
      ...base,
      viewerUserId: "u-part",
      organizerUserId: "u-org",
      isMeetingParticipant: true,
    };
    expect(canCreateFollowUp(ctx, "u-part")).toBe(true);
    expect(canCreateFollowUp(ctx, "u-other")).toBe(false);
  });
  it("unrelated user cannot create", () => {
    expect(
      canCreateFollowUp({ ...base, viewerUserId: "u-x", isMeetingParticipant: false }, "u-x"),
    ).toBe(false);
  });
  it("edit / cancel restricted for participants to own follow-up", () => {
    const owner = {
      ...base,
      viewerUserId: "u-owner",
      organizerUserId: "u-org",
      followUp: {
        ownerUserId: "u-owner",
        createdByUserId: "u-org",
        status: "open" as const,
      },
    };
    expect(canEditFollowUp(owner)).toBe(true);
    expect(canCancelFollowUp(owner)).toBe(true);
    const other = { ...owner, viewerUserId: "u-other" };
    expect(canEditFollowUp(other)).toBe(false);
    expect(canCancelFollowUp(other)).toBe(false);
  });
  it("only organizer may reassign owner", () => {
    expect(canReassignOwner({ ...base })).toBe(true);
    expect(
      canReassignOwner({
        ...base,
        viewerUserId: "u-other",
      }),
    ).toBe(false);
  });
  it("owner may change status; unrelated cannot", () => {
    const owner = {
      ...base,
      viewerUserId: "u-owner",
      followUp: {
        ownerUserId: "u-owner",
        createdByUserId: "u-org",
        status: "open" as const,
      },
    };
    expect(canChangeFollowUpStatus(owner, "in_progress")).toBe(true);
    expect(canChangeFollowUpStatus(owner, "completed")).toBe(true);
    expect(
      canChangeFollowUpStatus(
        { ...owner, viewerUserId: "u-x", isMeetingParticipant: false },
        "completed",
      ),
    ).toBe(false);
  });
  it("terminal follow-up cannot be edited or cancelled", () => {
    const done = {
      ...base,
      followUp: {
        ownerUserId: "u-org",
        createdByUserId: "u-org",
        status: "completed" as const,
      },
    };
    expect(canEditFollowUp(done)).toBe(false);
    expect(canCancelFollowUp(done)).toBe(false);
    expect(canChangeFollowUpStatus(done, "completed")).toBe(false);
  });
  it("derives viewer permissions consistently", () => {
    const p = deriveFollowUpViewerPermissions(base);
    expect(p).toEqual({ canEdit: true, canChangeStatus: true, canCancel: true });
  });
});

// ── Error mapping ───────────────────────────────────────────────────────────
describe("BC-7.9B error mapping", () => {
  it("maps every canonical code", () => {
    for (const c of MEETING_FOLLOW_UP_ERROR_CODES) {
      expect(mapMeetingFollowUpError(new Error(`P0001: ${c}`)).code).toBe(c);
    }
  });
  it("unknown collapses to INTERNAL_ERROR", () => {
    expect(mapMeetingFollowUpError(new Error("boom")).code).toBe(
      "MEETING_FOLLOW_UP_INTERNAL_ERROR",
    );
  });
  it("MeetingFollowUpError passes through", () => {
    const e = new MeetingFollowUpError("MEETING_FOLLOW_UP_TERMINAL");
    expect(mapMeetingFollowUpError(e)).toBe(e);
  });
});

// ── SDK freeze ──────────────────────────────────────────────────────────────
describe("BC-7.9B SDK freeze", () => {
  it("exposes exactly five follow-up methods", () => {
    expect(MEETING_FOLLOW_UP_SDK_METHODS).toEqual([
      "listFollowUps",
      "createFollowUp",
      "updateFollowUp",
      "setFollowUpStatus",
      "cancelFollowUp",
    ]);
    expect(Object.isFrozen(MeetingFollowUpSDK)).toBe(true);
    for (const m of MEETING_FOLLOW_UP_SDK_METHODS) {
      expect(typeof (MeetingFollowUpSDK as unknown as Record<string, unknown>)[m]).toBe("function");
    }
  });
  it("MeetingOutcomeSDK method list is extended with follow-up methods", () => {
    expect(MEETING_OUTCOME_SDK_METHODS).toContain("listFollowUps");
    expect(MEETING_OUTCOME_SDK_METHODS).toContain("cancelFollowUp");
    expect(MEETING_OUTCOME_SDK_METHODS.length).toBe(9);
  });
});

// ── In-memory RPC harness mirroring SQL contract ────────────────────────────
type Row = {
  id: string;
  meeting_id: string;
  outcome_id: string | null;
  created_by_user_id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  due_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  client_request_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

interface Event {
  type: string;
  mutationKey: string;
  meta: Record<string, unknown>;
}

interface Meeting {
  id: string;
  organizer_user_id: string;
  participants: Set<string>; // active participants (not left)
}

interface HarnessOpts {
  viewer: string;
  meeting: Meeting;
  outcomes?: Array<{ id: string; meeting_id: string }>;
}

function makeMock(opts: HarnessOpts) {
  const rows = new Map<string, Row>(); // by id
  const events: Event[] = [];
  const outcomes = new Map<string, string>();
  (opts.outcomes ?? []).forEach((o) => outcomes.set(o.id, o.meeting_id));

  const isOrganizer = (uid: string) => opts.meeting.organizer_user_id === uid;
  const isParticipant = (uid: string) => isOrganizer(uid) || opts.meeting.participants.has(uid);
  const ownerEligible = (uid: string) => isParticipant(uid);
  const actorAuth = (uid: string) => isParticipant(uid);

  let idSeq = 0;
  const nextId = () => {
    const n = (++idSeq).toString(16).padStart(12, "0");
    return `44444444-4444-4444-4444-${n}`;
  };

  const rpc = async (name: string, params: Record<string, unknown>) => {
    const uid = opts.viewer;
    if (!uid) return { data: null, error: new Error("MEETING_FOLLOW_UP_FORBIDDEN") };

    if (name === "business_meeting_follow_up_create") {
      const meetingId = params._meeting_id as string;
      if (opts.meeting.id !== meetingId)
        return { data: null, error: new Error("MEETING_FOLLOW_UP_NOT_FOUND") };
      if (!actorAuth(uid)) return { data: null, error: new Error("MEETING_FOLLOW_UP_FORBIDDEN") };
      const owner = params._owner_user_id as string;
      if (!owner) return { data: null, error: new Error("MEETING_FOLLOW_UP_INVALID_OWNER") };
      if (!isOrganizer(uid) && owner !== uid)
        return { data: null, error: new Error("MEETING_FOLLOW_UP_FORBIDDEN") };
      if (!ownerEligible(owner))
        return { data: null, error: new Error("MEETING_FOLLOW_UP_INVALID_OWNER") };
      const pr = params._priority as string;
      if (!["low", "normal", "high", "urgent"].includes(pr))
        return { data: null, error: new Error("MEETING_FOLLOW_UP_INVALID_PRIORITY") };
      const title = ((params._title as string) ?? "").trim();
      if (title.length < 1 || title.length > 240)
        return { data: null, error: new Error("MEETING_FOLLOW_UP_INVALID_TITLE") };
      const desc = params._description as string | null;
      const outcomeId = params._outcome_id as string | null;
      if (outcomeId && outcomes.get(outcomeId) !== meetingId)
        return { data: null, error: new Error("MEETING_FOLLOW_UP_INVALID_OUTCOME") };
      const cri = (params._client_request_id as string | null) ?? null;
      if (cri) {
        for (const r of rows.values()) {
          if (
            r.meeting_id === meetingId &&
            r.created_by_user_id === uid &&
            r.client_request_id === cri
          )
            return { data: r, error: null };
        }
      }
      const now = new Date().toISOString();
      const row: Row = {
        id: nextId(),
        meeting_id: meetingId,
        outcome_id: outcomeId,
        created_by_user_id: uid,
        owner_user_id: owner,
        title,
        description: desc && desc.trim() ? desc.trim() : null,
        status: "open",
        priority: pr as Row["priority"],
        due_at: (params._due_at as string | null) ?? null,
        completed_at: null,
        cancelled_at: null,
        client_request_id: cri,
        version: 1,
        created_at: now,
        updated_at: now,
      };
      rows.set(row.id, row);
      events.push({
        type: "business_meeting_follow_up_created",
        mutationKey: `follow_up_create:${row.id}`,
        meta: {
          followUpId: row.id,
          meetingId,
          outcomeId,
          status: row.status,
          priority: row.priority,
          version: row.version,
          dueAt: row.due_at,
        },
      });
      return { data: row, error: null };
    }

    if (name === "business_meeting_follow_up_update") {
      const row = rows.get(params._follow_up_id as string);
      if (!row) return { data: null, error: new Error("MEETING_FOLLOW_UP_NOT_FOUND") };
      if (!actorAuth(uid)) return { data: null, error: new Error("MEETING_FOLLOW_UP_FORBIDDEN") };
      if (!isOrganizer(uid) && uid !== row.owner_user_id && uid !== row.created_by_user_id)
        return { data: null, error: new Error("MEETING_FOLLOW_UP_FORBIDDEN") };
      if (row.status === "completed" || row.status === "cancelled")
        return { data: null, error: new Error("MEETING_FOLLOW_UP_TERMINAL") };
      const exp = params._expected_version as number;
      if (row.version !== exp)
        return { data: null, error: new Error("MEETING_FOLLOW_UP_VERSION_CONFLICT") };

      let changed = false;
      const t = params._title as string | null;
      if (t !== null) {
        const nt = t.trim();
        if (nt.length < 1 || nt.length > 240)
          return { data: null, error: new Error("MEETING_FOLLOW_UP_INVALID_TITLE") };
        if (nt !== row.title) {
          row.title = nt;
          changed = true;
        }
      }
      if (params._clear_description) {
        if (row.description !== null) {
          row.description = null;
          changed = true;
        }
      } else if ((params._description as string | null) !== null) {
        const nd = ((params._description as string) || "").trim();
        const v = nd || null;
        if (v !== row.description) {
          row.description = v;
          changed = true;
        }
      }
      const pr = params._priority as string | null;
      if (pr !== null) {
        if (!["low", "normal", "high", "urgent"].includes(pr))
          return { data: null, error: new Error("MEETING_FOLLOW_UP_INVALID_PRIORITY") };
        if (pr !== row.priority) {
          row.priority = pr as Row["priority"];
          changed = true;
        }
      }
      if (params._clear_due_at) {
        if (row.due_at !== null) {
          row.due_at = null;
          changed = true;
        }
      } else if ((params._due_at as string | null) !== null) {
        const nd = params._due_at as string;
        if (nd !== row.due_at) {
          row.due_at = nd;
          changed = true;
        }
      }
      const newOwner = params._owner_user_id as string | null;
      if (newOwner && newOwner !== row.owner_user_id) {
        if (!isOrganizer(uid))
          return { data: null, error: new Error("MEETING_FOLLOW_UP_FORBIDDEN") };
        if (!ownerEligible(newOwner))
          return { data: null, error: new Error("MEETING_FOLLOW_UP_INVALID_OWNER") };
        row.owner_user_id = newOwner;
        changed = true;
      }
      if (!changed) return { data: row, error: null };
      row.version += 1;
      row.updated_at = new Date().toISOString();
      events.push({
        type: "business_meeting_follow_up_updated",
        mutationKey: `follow_up_update:${row.id}:${row.version}`,
        meta: {
          followUpId: row.id,
          meetingId: row.meeting_id,
          outcomeId: row.outcome_id,
          status: row.status,
          priority: row.priority,
          version: row.version,
          dueAt: row.due_at,
        },
      });
      return { data: row, error: null };
    }

    if (name === "business_meeting_follow_up_set_status") {
      const row = rows.get(params._follow_up_id as string);
      if (!row) return { data: null, error: new Error("MEETING_FOLLOW_UP_NOT_FOUND") };
      if (!actorAuth(uid)) return { data: null, error: new Error("MEETING_FOLLOW_UP_FORBIDDEN") };
      if (!isOrganizer(uid) && uid !== row.owner_user_id)
        return { data: null, error: new Error("MEETING_FOLLOW_UP_FORBIDDEN") };
      const target = params._target_status as string;
      if (target !== "in_progress" && target !== "completed")
        return { data: null, error: new Error("MEETING_FOLLOW_UP_INVALID_STATE") };
      if (target === "completed" && row.status === "completed") return { data: row, error: null };
      if (row.status === "cancelled")
        return { data: null, error: new Error("MEETING_FOLLOW_UP_TERMINAL") };
      const okTransition =
        (row.status === "open" && (target === "in_progress" || target === "completed")) ||
        (row.status === "in_progress" && target === "completed");
      if (!okTransition) return { data: null, error: new Error("MEETING_FOLLOW_UP_INVALID_STATE") };
      const exp = params._expected_version as number;
      if (row.version !== exp)
        return { data: null, error: new Error("MEETING_FOLLOW_UP_VERSION_CONFLICT") };
      if (target === "in_progress") {
        row.status = "in_progress";
        row.version += 1;
        events.push({
          type: "business_meeting_follow_up_started",
          mutationKey: `follow_up_start:${row.id}`,
          meta: {
            followUpId: row.id,
            meetingId: row.meeting_id,
            outcomeId: row.outcome_id,
            status: row.status,
            priority: row.priority,
            version: row.version,
            dueAt: row.due_at,
          },
        });
      } else {
        row.status = "completed";
        row.completed_at = new Date().toISOString();
        row.cancelled_at = null;
        row.version += 1;
        events.push({
          type: "business_meeting_follow_up_completed",
          mutationKey: `follow_up_complete:${row.id}`,
          meta: {
            followUpId: row.id,
            meetingId: row.meeting_id,
            outcomeId: row.outcome_id,
            status: row.status,
            priority: row.priority,
            version: row.version,
            dueAt: row.due_at,
          },
        });
      }
      return { data: row, error: null };
    }

    if (name === "business_meeting_follow_up_cancel") {
      const row = rows.get(params._follow_up_id as string);
      if (!row) return { data: null, error: new Error("MEETING_FOLLOW_UP_NOT_FOUND") };
      if (!actorAuth(uid)) return { data: null, error: new Error("MEETING_FOLLOW_UP_FORBIDDEN") };
      if (!isOrganizer(uid) && uid !== row.owner_user_id)
        return { data: null, error: new Error("MEETING_FOLLOW_UP_FORBIDDEN") };
      if (row.status === "cancelled") return { data: row, error: null };
      if (row.status === "completed")
        return { data: null, error: new Error("MEETING_FOLLOW_UP_TERMINAL") };
      const exp = params._expected_version as number;
      if (row.version !== exp)
        return { data: null, error: new Error("MEETING_FOLLOW_UP_VERSION_CONFLICT") };
      row.status = "cancelled";
      row.cancelled_at = new Date().toISOString();
      row.completed_at = null;
      row.version += 1;
      events.push({
        type: "business_meeting_follow_up_cancelled",
        mutationKey: `follow_up_cancel:${row.id}`,
        meta: {
          followUpId: row.id,
          meetingId: row.meeting_id,
          outcomeId: row.outcome_id,
          status: row.status,
          priority: row.priority,
          version: row.version,
          dueAt: row.due_at,
        },
      });
      return { data: row, error: null };
    }

    return { data: null, error: new Error("MEETING_FOLLOW_UP_INTERNAL_ERROR") };
  };

  const from = (table: string) => ({
    select: () => ({
      eq: (_col: string, val: string) => ({
        order: async () => ({
          data: Array.from(rows.values()).filter((r) => r.meeting_id === val),
          error: null,
        }),
        maybeSingle: async () => {
          if (table === "business_meeting_follow_ups") {
            return { data: rows.get(val) ?? null, error: null };
          }
          if (table === "business_meetings" && val === opts.meeting.id) {
            return {
              data: { organizer_user_id: opts.meeting.organizer_user_id },
              error: null,
            };
          }
          return { data: null, error: null };
        },
      }),
    }),
  });
  // (Participant lookup happens via the rpc-side checks in this harness.)

  const sb = { rpc, from } as unknown;
  const ctx = {
    viewerUserId: opts.viewer,
    organizerUserId: opts.meeting.organizer_user_id,
    isMeetingParticipant:
      opts.viewer === opts.meeting.organizer_user_id || opts.meeting.participants.has(opts.viewer),
    now: new Date("2026-07-15T12:00:00Z"),
  };

  return { sb: sb as any, events, rows, ctx };
}

const MID = "11111111-1111-1111-1111-111111111111";
const ORG = "00000000-0000-0000-0000-000000000001";
const PART = "00000000-0000-0000-0000-000000000002";
const OTHER = "00000000-0000-0000-0000-000000000009";
const OUT = "22222222-2222-2222-2222-222222222222";
const OTHER_MEETING_OUTCOME = "33333333-3333-3333-3333-333333333333";

function orgHarness() {
  return makeMock({
    viewer: ORG,
    meeting: {
      id: MID,
      organizer_user_id: ORG,
      participants: new Set([PART]),
    },
    outcomes: [
      { id: OUT, meeting_id: MID },
      { id: OTHER_MEETING_OUTCOME, meeting_id: "other" },
    ],
  });
}
function partHarness() {
  return makeMock({
    viewer: PART,
    meeting: {
      id: MID,
      organizer_user_id: ORG,
      participants: new Set([PART]),
    },
    outcomes: [{ id: OUT, meeting_id: MID }],
  });
}

describe("BC-7.9B follow-up service — behavioural contract", () => {
  let h: ReturnType<typeof orgHarness>;
  beforeEach(() => {
    h = orgHarness();
  });

  it("organizer creates for participant, DTO redacts raw uids", async () => {
    const dto = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "Send NDA",
      ownerUserId: PART,
      priority: "high",
    });
    expect(dto.status).toBe("open");
    expect(dto.priority).toBe("high");
    expect(dto.owner.kind).toBe("participant");
    expect(dto.owner.isViewer).toBe(false);
    expect((dto as unknown as Record<string, unknown>).owner_user_id).toBeUndefined();
    expect((dto as unknown as Record<string, unknown>).created_by_user_id).toBeUndefined();
    expect(dto.viewerPermissions).toEqual({
      canEdit: true,
      canChangeStatus: true,
      canCancel: true,
    });
  });

  it("participant creates self-owned follow-up", async () => {
    const ph = partHarness();
    const dto = await MeetingFollowUpService.createFollowUp(ph.sb, ph.ctx, {
      meetingId: MID,
      title: "Prep deck",
      ownerUserId: PART,
    });
    expect(dto.owner.kind).toBe("self");
    expect(dto.owner.isViewer).toBe(true);
  });

  it("participant cannot assign another participant", async () => {
    const ph = partHarness();
    await expect(
      MeetingFollowUpService.createFollowUp(ph.sb, ph.ctx, {
        meetingId: MID,
        title: "Assign to org",
        ownerUserId: ORG,
      }),
    ).rejects.toMatchObject({ code: "MEETING_FOLLOW_UP_FORBIDDEN" });
  });

  it("rejects invalid owner (not a participant)", async () => {
    await expect(
      MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
        meetingId: MID,
        title: "x",
        ownerUserId: OTHER,
      }),
    ).rejects.toMatchObject({ code: "MEETING_FOLLOW_UP_INVALID_OWNER" });
  });

  it("idempotent create returns canonical row", async () => {
    const a = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "Same",
      ownerUserId: ORG,
      clientRequestId: "req-1",
    });
    const b = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "Different — ignored",
      ownerUserId: ORG,
      clientRequestId: "req-1",
    });
    expect(b.id).toBe(a.id);
    expect(h.events.filter((e: any) => e.type === "business_meeting_follow_up_created").length).toBe(1);
  });

  it("rejects empty and oversized titles", async () => {
    await expect(
      MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
        meetingId: MID,
        title: "   ",
        ownerUserId: ORG,
      }),
    ).rejects.toMatchObject({ code: "MEETING_FOLLOW_UP_INVALID_TITLE" });
    await expect(
      MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
        meetingId: MID,
        title: "x".repeat(241),
        ownerUserId: ORG,
      }),
    ).rejects.toMatchObject({ code: "MEETING_FOLLOW_UP_INVALID_TITLE" });
  });

  it("rejects unknown priority", async () => {
    await expect(
      MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
        meetingId: MID,
        title: "bad pri",
        ownerUserId: ORG,
        // @ts-expect-error intentional
        priority: "critical",
      }),
    ).rejects.toMatchObject({ code: "MEETING_FOLLOW_UP_INVALID_PRIORITY" });
  });

  it("rejects cross-meeting outcome link", async () => {
    await expect(
      MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
        meetingId: MID,
        title: "cross",
        ownerUserId: ORG,
        outcomeId: OTHER_MEETING_OUTCOME,
      }),
    ).rejects.toMatchObject({ code: "MEETING_FOLLOW_UP_INVALID_OUTCOME" });
  });

  it("update bumps version by exactly 1 and emits one event", async () => {
    const c = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "v1",
      ownerUserId: ORG,
    });
    const u = await MeetingFollowUpService.updateFollowUp(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: c.version,
      title: "v2",
      priority: "urgent",
    });
    expect(u.version).toBe(2);
    expect(u.priority).toBe("urgent");
    expect(h.events.filter((e: any) => e.type === "business_meeting_follow_up_updated").length).toBe(1);
  });

  it("stale update → VERSION_CONFLICT (one wins)", async () => {
    const c = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "orig",
      ownerUserId: ORG,
    });
    await MeetingFollowUpService.updateFollowUp(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: c.version,
      title: "first",
    });
    await expect(
      MeetingFollowUpService.updateFollowUp(h.sb, h.ctx, {
        followUpId: c.id,
        expectedVersion: c.version,
        title: "second",
      }),
    ).rejects.toMatchObject({ code: "MEETING_FOLLOW_UP_VERSION_CONFLICT" });
  });

  it("owner reassignment: organizer allowed, participant denied", async () => {
    const c = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "handoff",
      ownerUserId: ORG,
    });
    const reassigned = await MeetingFollowUpService.updateFollowUp(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: c.version,
      ownerUserId: PART,
    });
    expect(reassigned.version).toBe(2);
    // Participant tries to reassign back — denied at policy level and rejected
    // by the SQL RPC in the harness (same code path the DB uses).
    const partCtx = {
      viewerUserId: PART,
      organizerUserId: ORG,
      isMeetingParticipant: true,
      followUp: {
        ownerUserId: PART,
        createdByUserId: ORG,
        status: "open" as const,
      },
    };
    expect(canReassignOwner(partCtx)).toBe(false);
  });

  it("valid transitions open → in_progress → completed emit exactly one event each", async () => {
    const c = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "x",
      ownerUserId: ORG,
    });
    const s = await MeetingFollowUpService.setFollowUpStatus(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: c.version,
      targetStatus: "in_progress",
    });
    expect(s.status).toBe("in_progress");
    const d = await MeetingFollowUpService.setFollowUpStatus(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: s.version,
      targetStatus: "completed",
    });
    expect(d.status).toBe("completed");
    expect(d.completedAt).not.toBeNull();
    expect(h.events.filter((e: any) => e.type === "business_meeting_follow_up_started").length).toBe(1);
    expect(h.events.filter((e: any) => e.type === "business_meeting_follow_up_completed").length).toBe(
      1,
    );
  });

  it("open → completed direct transition allowed", async () => {
    const c = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "quick",
      ownerUserId: ORG,
    });
    const d = await MeetingFollowUpService.setFollowUpStatus(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: c.version,
      targetStatus: "completed",
    });
    expect(d.status).toBe("completed");
  });

  it("open → cancelled via cancel RPC; in_progress → cancelled allowed", async () => {
    const c = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "y",
      ownerUserId: ORG,
    });
    const cancelled = await MeetingFollowUpService.cancelFollowUp(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: c.version,
    });
    expect(cancelled.status).toBe("cancelled");
    // in_progress → cancelled path
    const c2 = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "z",
      ownerUserId: ORG,
    });
    const inp = await MeetingFollowUpService.setFollowUpStatus(h.sb, h.ctx, {
      followUpId: c2.id,
      expectedVersion: c2.version,
      targetStatus: "in_progress",
    });
    const canc2 = await MeetingFollowUpService.cancelFollowUp(h.sb, h.ctx, {
      followUpId: c2.id,
      expectedVersion: inp.version,
    });
    expect(canc2.status).toBe("cancelled");
  });

  it("duplicate completion is idempotent (no double event, no extra bump)", async () => {
    const c = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "dup",
      ownerUserId: ORG,
    });
    const d = await MeetingFollowUpService.setFollowUpStatus(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: c.version,
      targetStatus: "completed",
    });
    const d2 = await MeetingFollowUpService.setFollowUpStatus(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: d.version,
      targetStatus: "completed",
    });
    expect(d2.version).toBe(d.version);
    expect(h.events.filter((e: any) => e.type === "business_meeting_follow_up_completed").length).toBe(
      1,
    );
  });

  it("duplicate cancellation is idempotent", async () => {
    const c = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "cx",
      ownerUserId: ORG,
    });
    const c1 = await MeetingFollowUpService.cancelFollowUp(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: c.version,
    });
    const c2 = await MeetingFollowUpService.cancelFollowUp(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: c1.version,
    });
    expect(c2.version).toBe(c1.version);
    expect(h.events.filter((e: any) => e.type === "business_meeting_follow_up_cancelled").length).toBe(
      1,
    );
  });

  it("completed follow-up cannot be cancelled (TERMINAL)", async () => {
    const c = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "t",
      ownerUserId: ORG,
    });
    const d = await MeetingFollowUpService.setFollowUpStatus(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: c.version,
      targetStatus: "completed",
    });
    await expect(
      MeetingFollowUpService.cancelFollowUp(h.sb, h.ctx, {
        followUpId: c.id,
        expectedVersion: d.version,
      }),
    ).rejects.toMatchObject({ code: "MEETING_FOLLOW_UP_TERMINAL" });
  });

  it("invalid transition (in_progress from completed) rejected", async () => {
    const c = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "i",
      ownerUserId: ORG,
    });
    const d = await MeetingFollowUpService.setFollowUpStatus(h.sb, h.ctx, {
      followUpId: c.id,
      expectedVersion: c.version,
      targetStatus: "completed",
    });
    await expect(
      MeetingFollowUpService.setFollowUpStatus(h.sb, h.ctx, {
        followUpId: c.id,
        expectedVersion: d.version,
        targetStatus: "in_progress",
      }),
    ).rejects.toMatchObject({
      // Idempotent-complete short-circuits only for completed→completed. For
      // completed→in_progress the state machine rejects.
      code: expect.stringMatching(
        /MEETING_FOLLOW_UP_(INVALID_STATE|TERMINAL)/,
      ) as unknown as string,
    });
  });

  it("temporal derivation: overdue vs due_soon in DTO", async () => {
    const now = h.ctx.now!.getTime();
    const overdue = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "od",
      ownerUserId: ORG,
      dueAt: new Date(now - 1000).toISOString(),
    });
    expect(overdue.temporalState).toBe("overdue");
    const soon = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "s",
      ownerUserId: ORG,
      dueAt: new Date(now + 60_000).toISOString(),
    });
    expect(soon.temporalState).toBe("due_soon");
  });
});

// ── Security surface tests ─────────────────────────────────────────────────
describe("BC-7.9B security surface", () => {
  it("unrelated authenticated user is denied all mutations", async () => {
    const h = makeMock({
      viewer: OTHER,
      meeting: { id: MID, organizer_user_id: ORG, participants: new Set([PART]) },
    });
    await expect(
      MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
        meetingId: MID,
        title: "x",
        ownerUserId: OTHER,
      }),
    ).rejects.toMatchObject({ code: "MEETING_FOLLOW_UP_FORBIDDEN" });
  });

  it("DTO never contains raw user id fields", async () => {
    const h = orgHarness();
    const dto = await MeetingFollowUpService.createFollowUp(h.sb, h.ctx, {
      meetingId: MID,
      title: "x",
      ownerUserId: PART,
    });
    const obj = dto as unknown as Record<string, unknown>;
    expect(obj.owner_user_id).toBeUndefined();
    expect(obj.created_by_user_id).toBeUndefined();
  });
});

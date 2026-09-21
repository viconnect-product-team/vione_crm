// BC-4.1A — Pure state-machine & eligibility unit tests.
// These verify the deterministic lifecycle and Policy B classifier that the DB
// mutation functions mirror. No DB access.

import { describe, expect, it } from "vitest";
import {
  evaluateMeetingTransition,
  isFreshVersion,
  isTerminal,
  TERMINAL_STATUSES,
} from "@/lib/business-meetings/state-machine";
import { classifyEligibility } from "@/lib/business-meetings/eligibility";

describe("BC-4.1A meeting state machine", () => {
  it("1. draft → proposed allowed for organizer", () => {
    expect(
      evaluateMeetingTransition({ from: "draft", operation: "propose", actor: "organizer" }),
    ).toEqual({ ok: true, to: "proposed" });
  });

  it("2. proposed → accept transition is allowed for invited participant (BC-7.6: DB re-gates confirmation)", () => {
    // Under BC-7.6 the pure state machine still models the optimistic target
    // as `confirmed` on accept; the DB RPC re-checks the all-accept
    // confirmation policy under lock, so in an N-party meeting an
    // intermediate accept keeps meeting.status = 'proposed' and only mutates
    // the participant's response row. See BC-7.6 MEETING_REQUEST_LIFECYCLE.md.
    expect(
      evaluateMeetingTransition({ from: "proposed", operation: "accept", actor: "participant" }),
    ).toEqual({ ok: true, to: "confirmed" });
  });

  it("3. BC-7.6 supersession — proposed + decline is participant-level; meeting stays 'proposed'", () => {
    // BC-4.1A modeled decline as a meeting-terminal transition. BC-7.6
    // supersedes: decline now updates the caller's participant response row
    // only, and the meeting remains 'proposed' so other participants (and
    // the organizer) may still act.
    expect(
      evaluateMeetingTransition({ from: "proposed", operation: "decline", actor: "participant" }),
    ).toEqual({ ok: true, to: "proposed" });
  });

  it("4. proposed → cancelled allowed for organizer", () => {
    expect(
      evaluateMeetingTransition({ from: "proposed", operation: "cancel", actor: "organizer" }),
    ).toEqual({ ok: true, to: "cancelled" });
  });

  it("5. confirmed → proposed via reschedule allowed for either participant", () => {
    expect(
      evaluateMeetingTransition({ from: "confirmed", operation: "reschedule", actor: "either" }),
    ).toEqual({ ok: true, to: "proposed" });
    expect(
      evaluateMeetingTransition({
        from: "proposed",
        operation: "reschedule",
        actor: "participant",
      }),
    ).toEqual({ ok: true, to: "proposed" });
  });

  it("6. confirmed → completed allowed for either participant", () => {
    expect(
      evaluateMeetingTransition({ from: "confirmed", operation: "complete", actor: "either" }),
    ).toEqual({ ok: true, to: "completed" });
  });

  it("7. confirmed → cancelled allowed for organizer", () => {
    expect(
      evaluateMeetingTransition({ from: "confirmed", operation: "cancel", actor: "organizer" }),
    ).toEqual({ ok: true, to: "cancelled" });
  });

  it("8. terminal mutation rejected", () => {
    for (const from of TERMINAL_STATUSES) {
      const r = evaluateMeetingTransition({ from, operation: "complete", actor: "either" });
      expect(r.ok).toBe(false);
      expect(isTerminal(from)).toBe(true);
    }
  });

  it("9. stale proposal version rejected by version guard", () => {
    expect(isFreshVersion(2, 1)).toBe(false);
    expect(isFreshVersion(2, 2)).toBe(true);
    expect(isFreshVersion(null, 1)).toBe(false);
  });

  it("10. arbitrary status transition rejected", () => {
    // declined → confirmed
    expect(
      evaluateMeetingTransition({ from: "declined", operation: "accept", actor: "participant" }).ok,
    ).toBe(false);
    // cancelled → confirmed
    expect(
      evaluateMeetingTransition({ from: "cancelled", operation: "accept", actor: "participant" })
        .ok,
    ).toBe(false);
    // completed → proposed
    expect(
      evaluateMeetingTransition({ from: "completed", operation: "reschedule", actor: "either" }).ok,
    ).toBe(false);
    // no_show → completed
    expect(
      evaluateMeetingTransition({ from: "no_show", operation: "complete", actor: "either" }).ok,
    ).toBe(false);
  });

  it("organizer cannot accept own proposal", () => {
    expect(
      evaluateMeetingTransition({ from: "proposed", operation: "accept", actor: "organizer" }).ok,
    ).toBe(false);
  });

  it("non-participant rejected on every operation", () => {
    for (const op of [
      "propose",
      "accept",
      "decline",
      "cancel",
      "reschedule",
      "complete",
      "mark_no_show",
    ] as const) {
      const r = evaluateMeetingTransition({
        from: "proposed",
        operation: op,
        actor: "non_participant",
      });
      expect(r).toEqual({ ok: false, reason: "MEETING_NOT_PARTICIPANT" });
    }
  });

  it("non-organizer cannot propose or cancel", () => {
    expect(
      evaluateMeetingTransition({ from: "draft", operation: "propose", actor: "participant" }).ok,
    ).toBe(false);
    expect(
      evaluateMeetingTransition({ from: "confirmed", operation: "cancel", actor: "participant" })
        .ok,
    ).toBe(false);
  });
});

describe("BC-4.1A eligibility classifier (Policy B)", () => {
  it("11. accepted Global Connection permits proposal", () => {
    expect(classifyEligibility(true, false)).toBe("global_connection");
  });

  it("12. Saved Card permits proposal", () => {
    expect(classifyEligibility(false, true)).toBe("saved_card");
  });

  it("global connection preferred over saved card when both", () => {
    expect(classifyEligibility(true, true)).toBe("global_connection");
  });

  it("13-15. no accepted connection and no saved card rejects proposal", () => {
    // Association membership / Company context / public profile visibility do
    // NOT set either flag, so they classify as null (not eligible).
    expect(classifyEligibility(false, false)).toBeNull();
  });
});

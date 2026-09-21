// BC-7.6 — Meeting Request Lifecycle: pure confirmation-policy tests.
//
// This suite freezes the CANONICAL confirmation invariant that supersedes the
// BC-4.1A 1:1 accept-confirm semantic. The DB RPC, the application service,
// and the UI capability layer must all consume the SAME rule module
// (`confirmation-policy.ts`); this suite is the single source of truth for
// its behaviour.

import { describe, expect, it } from "vitest";
import {
  evaluateConfirmationEligibility,
  canParticipantRespond,
  type ConfirmationParticipant,
} from "@/lib/business-meetings/confirmation-policy";
import { evaluateMeetingTransition } from "@/lib/business-meetings/state-machine";
import { deriveMeetingViewerCapabilities } from "@/lib/business-meetings/capabilities";
import { BusinessMeetingSDK } from "@/lib/business-meetings/client-sdk";

const organizer: ConfirmationParticipant = { role: "organizer", responseStatus: "accepted" };
const p = (
  responseStatus: ConfirmationParticipant["responseStatus"],
  role: ConfirmationParticipant["role"] = "required",
  leftAt: string | null = null,
): ConfirmationParticipant => ({ role, responseStatus, leftAt });

describe("BC-7.6 confirmation policy — canonical invariant", () => {
  it("1. 1:1 degenerate case: organizer + single accepted required = eligible", () => {
    expect(evaluateConfirmationEligibility([organizer, p("accepted")])).toEqual({ eligible: true });
  });

  it("2. N-party: every required accepted = eligible", () => {
    expect(
      evaluateConfirmationEligibility([organizer, p("accepted"), p("accepted"), p("accepted")]),
    ).toEqual({ eligible: true });
  });

  it("3. any pending required blocks confirmation", () => {
    expect(evaluateConfirmationEligibility([organizer, p("accepted"), p("pending")])).toEqual({
      eligible: false,
      blockedBy: "PENDING_REQUIRED",
    });
  });

  it("4. any tentative required blocks confirmation (tentative ≠ accepted)", () => {
    expect(evaluateConfirmationEligibility([organizer, p("accepted"), p("tentative")])).toEqual({
      eligible: false,
      blockedBy: "TENTATIVE_REQUIRED",
    });
  });

  it("5. any declined required blocks confirmation (no auto-cancel)", () => {
    expect(evaluateConfirmationEligibility([organizer, p("accepted"), p("declined")])).toEqual({
      eligible: false,
      blockedBy: "DECLINED_REQUIRED",
    });
  });

  it("6. proposed_new_time (rescheduling) blocks confirmation", () => {
    expect(evaluateConfirmationEligibility([organizer, p("proposed_new_time")])).toEqual({
      eligible: false,
      blockedBy: "PROPOSED_NEW_TIME_REQUIRED",
    });
  });

  it("7. optional participants never gate confirmation", () => {
    expect(
      evaluateConfirmationEligibility([
        organizer,
        p("accepted"),
        p("pending", "optional"),
        p("declined", "optional"),
      ]),
    ).toEqual({ eligible: true });
  });

  it("8. left-set participants are excluded", () => {
    expect(
      evaluateConfirmationEligibility([
        organizer,
        p("accepted"),
        p("pending", "required", "2026-07-01T00:00:00Z"),
      ]),
    ).toEqual({ eligible: true });
  });

  it("9. zero non-organizer required participants: not confirmable", () => {
    expect(evaluateConfirmationEligibility([organizer])).toEqual({
      eligible: false,
      blockedBy: "NO_REQUIRED_PARTICIPANTS",
    });
  });

  it("10. idempotent re-evaluation: same input → same result", () => {
    const set = [organizer, p("accepted"), p("accepted")];
    const a = evaluateConfirmationEligibility(set);
    const b = evaluateConfirmationEligibility(set);
    expect(a).toEqual(b);
  });

  it("11. viewer response gating — pending participant may respond", () => {
    expect(canParticipantRespond(p("pending"))).toBe(true);
  });

  it("12. viewer response gating — tentative may still accept/decline/tentative", () => {
    expect(canParticipantRespond(p("tentative"))).toBe(true);
  });

  it("13. viewer response gating — accepted cannot re-respond (freeze policy)", () => {
    expect(canParticipantRespond(p("accepted"))).toBe(false);
  });

  it("14. viewer response gating — declined cannot re-respond (re-invite deferred)", () => {
    expect(canParticipantRespond(p("declined"))).toBe(false);
  });

  it("15. viewer response gating — organizer never responds", () => {
    expect(canParticipantRespond(organizer)).toBe(false);
  });

  it("16. viewer response gating — non-participant/null blocked", () => {
    expect(canParticipantRespond(null)).toBe(false);
  });

  it("17. viewer response gating — participant who left is inactive", () => {
    expect(canParticipantRespond(p("pending", "required", "2026-07-01T00:00:00Z"))).toBe(false);
  });
});

describe("BC-7.6 state-machine integration — participant-level operations", () => {
  it("18. BC-7.6 decline keeps meeting in 'proposed' (participant-level)", () => {
    expect(
      evaluateMeetingTransition({ from: "proposed", operation: "decline", actor: "participant" }),
    ).toEqual({ ok: true, to: "proposed" });
  });

  it("19. BC-7.6 tentative is a valid participant operation on 'proposed'", () => {
    expect(
      evaluateMeetingTransition({
        from: "proposed",
        operation: "tentative",
        actor: "participant",
      }),
    ).toEqual({ ok: true, to: "proposed" });
  });

  it("20. organizer cannot tentative", () => {
    expect(
      evaluateMeetingTransition({
        from: "proposed",
        operation: "tentative",
        actor: "organizer",
      }).ok,
    ).toBe(false);
  });

  it("21. tentative on non-proposed rejected", () => {
    for (const from of ["draft", "confirmed", "cancelled", "completed"] as const) {
      expect(
        evaluateMeetingTransition({
          from,
          operation: "tentative",
          actor: "participant",
        }).ok,
      ).toBe(false);
    }
  });
});

describe("BC-7.6 capability derivation — advisory UI gating", () => {
  it("22. pending participant on proposed meeting: accept/decline/tentative all enabled", () => {
    const c = deriveMeetingViewerCapabilities({
      status: "proposed",
      viewerRole: "required",
      viewerResponseStatus: "pending",
    });
    expect([c.canAccept, c.canDecline, c.canTentative]).toEqual([true, true, true]);
  });

  it("23. already-accepted participant cannot re-respond", () => {
    const c = deriveMeetingViewerCapabilities({
      status: "proposed",
      viewerRole: "required",
      viewerResponseStatus: "accepted",
    });
    expect([c.canAccept, c.canDecline, c.canTentative]).toEqual([false, false, false]);
  });

  it("24. organizer capabilities include cancel but never respond", () => {
    const c = deriveMeetingViewerCapabilities({
      status: "proposed",
      viewerRole: "organizer",
      viewerResponseStatus: "accepted",
    });
    expect(c.canCancel).toBe(true);
    expect(c.canAccept).toBe(false);
    expect(c.canTentative).toBe(false);
    expect(c.canDecline).toBe(false);
  });
});

describe("BC-7.6 SDK surface freeze", () => {
  it("25. SDK exposes the frozen participant response methods", () => {
    expect(typeof BusinessMeetingSDK.meetings.accept).toBe("function");
    expect(typeof BusinessMeetingSDK.meetings.decline).toBe("function");
    expect(typeof BusinessMeetingSDK.meetings.tentativelyAccept).toBe("function");
    expect(typeof BusinessMeetingSDK.meetings.cancel).toBe("function");
  });
});

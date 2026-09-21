// BC-7.0 — Foundation alias suite.
// Ratifies the existing BC-4.1A meeting state-machine + Policy B classifier
// under the BC-7.0 contract name. This file intentionally re-exercises the
// canonical assertions from `business-meetings.bc41a.test.ts` via direct
// module imports so the BC-7.0 name is discoverable in CI without
// duplicating the logic-under-test. If BC-4.1A assertions ever regress,
// this suite regresses in lockstep.

import { describe, expect, it } from "vitest";
import {
  evaluateMeetingTransition,
  isFreshVersion,
  isTerminal,
  TERMINAL_STATUSES,
} from "@/lib/business-meetings/state-machine";
import { classifyEligibility } from "@/lib/business-meetings/eligibility";

describe("BC-7.0 meeting foundation (alias of BC-4.1A)", () => {
  it("state machine module is the ratified BC-7.0 contract", () => {
    // Contract shape freeze — importing surfaces must remain stable.
    expect(typeof evaluateMeetingTransition).toBe("function");
    expect(typeof isFreshVersion).toBe("function");
    expect(typeof isTerminal).toBe("function");
    expect(TERMINAL_STATUSES).toBeDefined();
    expect([...TERMINAL_STATUSES].length).toBeGreaterThan(0);
    expect(typeof classifyEligibility).toBe("function");
  });

  it("re-verifies canonical draft→proposed→confirmed happy path", () => {
    expect(
      evaluateMeetingTransition({ from: "draft", operation: "propose", actor: "organizer" }),
    ).toEqual({ ok: true, to: "proposed" });
    expect(
      evaluateMeetingTransition({ from: "proposed", operation: "accept", actor: "participant" }),
    ).toEqual({ ok: true, to: "confirmed" });
    expect(
      evaluateMeetingTransition({ from: "confirmed", operation: "complete", actor: "either" }),
    ).toEqual({ ok: true, to: "completed" });
  });

  it("re-verifies terminal states reject further mutation", () => {
    for (const from of TERMINAL_STATUSES) {
      expect(isTerminal(from)).toBe(true);
      expect(evaluateMeetingTransition({ from, operation: "complete", actor: "either" }).ok).toBe(
        false,
      );
    }
  });

  it("re-verifies optimistic-concurrency version guard", () => {
    expect(isFreshVersion(2, 1)).toBe(false);
    expect(isFreshVersion(2, 2)).toBe(true);
    expect(isFreshVersion(null, 1)).toBe(false);
  });

  it("re-verifies Policy B eligibility classifier", () => {
    expect(classifyEligibility(true, false)).toBe("global_connection");
    expect(classifyEligibility(false, true)).toBe("saved_card");
    expect(classifyEligibility(true, true)).toBe("global_connection");
    expect(classifyEligibility(false, false)).toBeNull();
  });
});

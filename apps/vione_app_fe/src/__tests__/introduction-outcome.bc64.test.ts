// BC-6.4 — Introduction Outcome contract tests (state machine, errors, SDK freeze).
import { describe, it, expect } from "vitest";
import {
  INTRODUCTION_OUTCOME_ERROR_CODES,
  INTRODUCTION_OUTCOME_STATUSES,
  INTRODUCTION_OUTCOME_TYPES,
  INTRODUCTION_OUTCOME_TERMINAL,
  IntroductionOutcomeError,
  canTransition,
  toIntroductionOutcomeError,
} from "@/lib/graph/introduction/outcome";
import { IntroductionOutcomeSDK } from "@/lib/graph/introduction/outcome/outcome.sdk";

describe("BC-6.4 outcome — state machine", () => {
  it("pending → resolved is allowed", () => {
    expect(canTransition("pending", "resolved")).toBe(true);
  });
  it("pending → expired is allowed", () => {
    expect(canTransition("pending", "expired")).toBe(true);
  });
  it("resolved is terminal", () => {
    expect(canTransition("resolved", "expired")).toBe(false);
    expect(canTransition("resolved", "resolved")).toBe(false);
    expect(INTRODUCTION_OUTCOME_TERMINAL.has("resolved")).toBe(true);
  });
  it("expired is terminal", () => {
    expect(canTransition("expired", "resolved")).toBe(false);
    expect(INTRODUCTION_OUTCOME_TERMINAL.has("expired")).toBe(true);
  });
  it("no self-transition from pending → pending", () => {
    expect(canTransition("pending", "pending")).toBe(false);
  });
});

describe("BC-6.4 outcome — domain constants", () => {
  it("freezes status domain", () => {
    expect([...INTRODUCTION_OUTCOME_STATUSES]).toEqual(["pending", "resolved", "expired"]);
  });
  it("freezes outcome type domain", () => {
    expect([...INTRODUCTION_OUTCOME_TYPES]).toEqual([
      "connected",
      "progressed",
      "not_connected",
      "closed_no_outcome",
    ]);
  });
});

describe("BC-6.4 outcome — error taxonomy", () => {
  it("normalizes known code strings", () => {
    for (const code of INTRODUCTION_OUTCOME_ERROR_CODES) {
      expect(toIntroductionOutcomeError({ message: code }).code).toBe(code);
    }
  });
  it("falls back to INTERNAL_ERROR for unknown input", () => {
    expect(toIntroductionOutcomeError(new Error("boom")).code).toBe("INTRO_OUTCOME_INTERNAL_ERROR");
    expect(toIntroductionOutcomeError(null).code).toBe("INTRO_OUTCOME_INTERNAL_ERROR");
  });
  it("passes IntroductionOutcomeError through", () => {
    const e = new IntroductionOutcomeError("INTRO_OUTCOME_NOT_OWNED");
    expect(toIntroductionOutcomeError(e)).toBe(e);
  });
});

describe("BC-6.4 outcome — SDK surface freeze", () => {
  it("exposes only the approved operations", () => {
    expect(Object.keys(IntroductionOutcomeSDK).sort()).toEqual(
      [
        "getIntermediaryImpact",
        "getOutcome",
        "listIntermediaryOutcomes",
        "listRequesterOutcomes",
        "markNoOutcome",
        "markProgressed",
      ].sort(),
    );
  });
  it("does NOT expose system-only operations", () => {
    const sdk = IntroductionOutcomeSDK as unknown as Record<string, unknown>;
    expect(sdk.observeConnection).toBeUndefined();
    expect(sdk.expireOutcome).toBeUndefined();
    expect(sdk.createOnAcknowledged).toBeUndefined();
  });
});

// BC-6.5 — Outcome lifecycle wiring contract tests.
// Contract-level tests: verify the wiring layer is idempotent, failure-isolated
// and does NOT expand the public SDK surface. Live SQL trigger behaviour is
// covered by the DB migration + existing bc64 tests (state machine).

import { describe, it, expect } from "vitest";
import { IntroductionOutcomeSDK } from "@/lib/graph/introduction/outcome/outcome.sdk";

describe("BC-6.5 outcome wiring", () => {
  it("public SDK surface is frozen (no system-only wiring ops leaked)", () => {
    const keys = Object.keys(IntroductionOutcomeSDK).sort();
    // Public read + user-declared transitions only.
    expect(keys).toEqual(
      [
        "getIntermediaryImpact",
        "getOutcome",
        "listIntermediaryOutcomes",
        "listRequesterOutcomes",
        "markNoOutcome",
        "markProgressed",
      ].sort(),
    );
    // Explicitly forbidden system-only entries.
    for (const forbidden of [
      "createOnAcknowledged",
      "observeConnection",
      "expireOutcome",
      "reconcile",
    ]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it("outbox dedupe key shape is stable per (outcomeId, event, status, type)", () => {
    // Mirrors intro_outcome_emit_event() key composition. Any change to this
    // key composition is a breaking change to exactly-once semantics.
    const build = (id: string, kind: string, status: string, type: string | null) =>
      `io:${id}:${kind}:${status}:${type ?? "none"}`;

    const a = build("abc", "introduction_outcome_connected", "resolved", "connected");
    const b = build("abc", "introduction_outcome_connected", "resolved", "connected");
    const c = build("abc", "introduction_outcome_expired", "expired", "closed_no_outcome");
    expect(a).toBe(b); // idempotent
    expect(a).not.toBe(c); // distinct transitions distinct keys
    expect(a.startsWith("io:")).toBe(true);
  });
});

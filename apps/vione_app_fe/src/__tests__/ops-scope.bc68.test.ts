// BC-6.8R — SDK scope key isolation.
// Cache entries for platform vs association vs different associations MUST
// never collide, and mutations must invalidate the whole "intro-ops" tree.

import { describe, expect, it } from "vitest";
import { introductionOpsKeys } from "@/lib/graph/introduction/ops";

describe("BC-6.8R ops SDK scope isolation", () => {
  it("scope + association_id are part of every scoped key", () => {
    const a = { scope: "platform" as const, associationId: null };
    const b = {
      scope: "association" as const,
      associationId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    };
    const c = {
      scope: "association" as const,
      associationId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    };

    for (const factory of [
      introductionOpsKeys.health,
      introductionOpsKeys.outbox,
      introductionOpsKeys.scheduler,
      introductionOpsKeys.consumer,
    ]) {
      const kA = JSON.stringify(factory(a));
      const kB = JSON.stringify(factory(b));
      const kC = JSON.stringify(factory(c));
      expect(kA).not.toBe(kB);
      expect(kB).not.toBe(kC);
      expect(kA).not.toBe(kC);
    }
  });

  it("range-scoped keys separate by rangeHours", () => {
    const base = { scope: "platform" as const, associationId: null };
    expect(JSON.stringify(introductionOpsKeys.requests({ ...base, rangeHours: 24 }))).not.toBe(
      JSON.stringify(introductionOpsKeys.requests({ ...base, rangeHours: 72 })),
    );
  });

  it("alert keys separate by state filter", () => {
    const base = { scope: "platform" as const, associationId: null };
    expect(JSON.stringify(introductionOpsKeys.alerts(base, "open"))).not.toBe(
      JSON.stringify(introductionOpsKeys.alerts(base, "resolved")),
    );
  });

  it("every key is prefixed with the shared root so a single invalidate({['intro-ops']}) clears all", () => {
    const base = { scope: "platform" as const, associationId: null };
    const range = { ...base, rangeHours: 24 };
    for (const k of [
      introductionOpsKeys.access(),
      introductionOpsKeys.health(base),
      introductionOpsKeys.requests(range),
      introductionOpsKeys.deliveries(range),
      introductionOpsKeys.outcomes(range),
      introductionOpsKeys.outbox(base),
      introductionOpsKeys.adapters(range),
      introductionOpsKeys.scheduler(base),
      introductionOpsKeys.consumer(base),
      introductionOpsKeys.alerts(base, "open"),
    ]) {
      expect(k[0]).toBe("intro-ops");
    }
  });
});

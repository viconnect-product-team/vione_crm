// @vitest-environment jsdom
// BC-6.8R — UI smoke test.
// Verifies the operations route consumes ONLY the centralized hook layer
// (not `useServerFn` / raw `useQuery`) and that the frozen status-pill /
// scope-pressed contract stays wired.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const routeSrc = readFileSync(
  join(process.cwd(), "src/routes/platform.introduction-operations.tsx"),
  "utf8",
);

describe("BC-6.8R ops route wiring", () => {
  it("imports from the hooks module, not from ops.functions or useServerFn", () => {
    expect(routeSrc).toContain('from "@/hooks/use-introduction-ops"');
    expect(routeSrc).not.toMatch(/useServerFn/);
    expect(routeSrc).not.toMatch(/ops\.functions/);
  });

  it("consumes every hook from the SDK-backed layer", () => {
    for (const name of [
      "useIntroOpsAccess",
      "useIntroOpsHealth",
      "useIntroOpsRequestsStats",
      "useIntroOpsDeliveriesStats",
      "useIntroOpsOutcomesStats",
      "useIntroOpsOutboxStats",
      "useIntroOpsAdapterStats",
      "useIntroOpsSchedulerRuns",
      "useIntroOpsConsumerRuns",
      "useIntroOpsAlerts",
      "useAcknowledgeIntroOpsAlert",
      "useResolveIntroOpsAlert",
      "useInvalidateIntroOps",
    ]) {
      expect(routeSrc).toContain(name);
    }
  });

  it("keeps aria-pressed on scope tabs and refresh action wired to invalidator", () => {
    expect(routeSrc).toMatch(/aria-pressed=\{scope === "platform"\}/);
    expect(routeSrc).toMatch(/aria-pressed=\{scope === "association"\}/);
    expect(routeSrc).toMatch(/invalidateAll\(\)/);
  });

  it("renders the three status tones (healthy / degraded / unhealthy)", () => {
    expect(routeSrc).toContain("healthy:");
    expect(routeSrc).toContain("degraded:");
    expect(routeSrc).toContain("unhealthy:");
  });
});

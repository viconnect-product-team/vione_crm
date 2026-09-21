// BC-6.8R — Ops health frozen registry + DTO shape contract.
// Guards against silent drift in the frozen alert code registry, the frozen
// job-name registry, and the OpsHealthSummary subsystem shape.

import { describe, expect, it } from "vitest";
import {
  OPS_ALERT_CATEGORY_BY_CODE,
  OPS_ALERT_CODES,
  OPS_ALERT_SEVERITY_BY_CODE,
  OPS_JOB_NAMES,
} from "@/lib/graph/introduction/ops";
import type { OpsHealthSummary } from "@/lib/graph/introduction/ops";

describe("BC-6.8R ops health / frozen registries", () => {
  it("freezes the 10 alert codes", () => {
    expect(OPS_ALERT_CODES).toEqual([
      "outbox.pending.warn",
      "outbox.pending.critical",
      "outbox.lag.warn",
      "outbox.lag.critical",
      "consumer.failure_ratio.warn",
      "consumer.failure_ratio.critical",
      "consumer.dead_letter.critical",
      "scheduler.stale.warn",
      "scheduler.stale.critical",
      "requests.failure_ratio.critical",
    ]);
    expect(new Set(OPS_ALERT_CODES).size).toBe(OPS_ALERT_CODES.length);
  });

  it("every code has a severity and a category", () => {
    for (const code of OPS_ALERT_CODES) {
      expect(OPS_ALERT_SEVERITY_BY_CODE[code]).toMatch(/warning|critical/);
      expect(OPS_ALERT_CATEGORY_BY_CODE[code]).toMatch(/outbox|consumer|scheduler|requests/);
    }
  });

  it("freezes the job-name registry so scheduler dashboards can rely on it", () => {
    expect(OPS_JOB_NAMES).toEqual([
      "outcome_consumer_batch",
      "outcome_expire_sweep",
      "outcome_reconcile",
      "intro_ops_alerts_evaluate",
    ]);
  });

  it("OpsHealthSummary DTO enumerates exactly the 4 subsystems", () => {
    const sample: OpsHealthSummary = {
      scope: "platform",
      association_id: null,
      evaluated_at: new Date().toISOString(),
      overall: "healthy",
      subsystems: {
        outbox: { status: "healthy", pending: 0, oldest_lag_minutes: 0 },
        consumer: {
          status: "healthy",
          delivered_last_hour: 0,
          failed_last_hour: 0,
          dead_lettered_last_hour: 0,
          failure_ratio: 0,
        },
        scheduler: { status: "healthy", stale_minutes: 0 },
        requests: {
          status: "healthy",
          total_24h: 0,
          expired_or_cancelled_24h: 0,
          failure_ratio: 0,
        },
      },
      thresholds: {},
    };
    expect(Object.keys(sample.subsystems).sort()).toEqual([
      "consumer",
      "outbox",
      "requests",
      "scheduler",
    ]);
    for (const sub of Object.values(sample.subsystems)) {
      expect(["healthy", "degraded", "unhealthy"]).toContain(sub.status);
    }
  });
});

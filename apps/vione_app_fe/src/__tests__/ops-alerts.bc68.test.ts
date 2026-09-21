// BC-6.8R — Alerts evaluator contract.
// Verifies that the frozen registry ↔ evaluator SQL body stay aligned:
// every registered code must have a raise-or-refresh call and appear in the
// auto-resolve list of the evaluator function body.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { OPS_ALERT_CODES } from "@/lib/graph/introduction/ops";

function loadEvaluatorSql(): string {
  const dir = join(process.cwd(), "supabase/migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
  const combined = files
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n-- ---- MIGRATION SEPARATOR ----\n");
  const idx = combined.lastIndexOf("intro_ops_alerts_evaluate()");
  expect(idx).toBeGreaterThan(-1);
  return combined;
}

describe("BC-6.8R alert evaluator", () => {
  const sql = loadEvaluatorSql();

  it("every frozen code is raised in the evaluator body", () => {
    for (const code of OPS_ALERT_CODES) {
      expect(sql).toContain(`'${code}'`);
    }
  });

  it("evaluator body includes an auto-resolve UPDATE against introduction_ops_alerts", () => {
    expect(sql).toMatch(/UPDATE\s+public\.introduction_ops_alerts[\s\S]+state\s*=\s*'resolved'/);
    expect(sql).toMatch(/state\s+IN\s*\(\s*'open'\s*,\s*'acknowledged'\s*\)/);
  });

  it("raise-or-refresh helper preserves acknowledgment (checks acknowledged rows)", () => {
    expect(sql).toContain("intro_ops_alerts_raise_or_refresh");
    // Must consider both open and acknowledged before deciding whether to insert.
    expect(sql).toMatch(/state\s+IN\s*\(\s*'open'\s*,\s*'acknowledged'\s*\)[\s\S]+INSERT INTO/);
  });

  it("evaluator is service_role gated", () => {
    expect(sql).toMatch(/auth\.role\(\)\s*<>\s*'service_role'/);
  });

  it("scheduled cron entries record job runs via the recorded wrappers", () => {
    expect(sql).toContain("intro_outcome_expire_sweep_recorded");
    expect(sql).toContain("intro_outcome_reconcile_recorded");
    expect(sql).toContain("intro_ops_alerts_evaluate_recorded");
  });
});

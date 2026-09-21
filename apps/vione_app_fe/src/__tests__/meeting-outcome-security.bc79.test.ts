// BC-7.9 Turn A — Meeting Outcome security & module-boundary guardrails.
// Static assertions against the source tree — no DB required.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("BC-7.9 outcome module boundaries", () => {
  it("server functions run under requireSupabaseAuth (never admin client)", () => {
    const src = read("src/lib/meeting/outcome/functions.ts");
    expect(src.includes("requireSupabaseAuth")).toBe(true);
    expect(src.includes("client.server")).toBe(false);
    expect(src.includes("supabaseAdmin")).toBe(false);
  });

  it("service delegates every mutation to the three approved RPCs", () => {
    const svc = read("src/lib/meeting/outcome/service.server.ts");
    expect(svc.includes("MeetingOutcomeRepository")).toBe(true);
    const repo = read("src/lib/meeting/outcome/repository.server.ts");
    expect(repo.includes("business_meeting_outcome_create")).toBe(true);
    expect(repo.includes("business_meeting_outcome_update")).toBe(true);
    expect(repo.includes("business_meeting_outcome_finalize")).toBe(true);
    // No direct write paths from client code:
    expect(repo.includes(".insert(")).toBe(false);
    expect(repo.includes(".update(")).toBe(false);
    expect(repo.includes(".delete(")).toBe(false);
  });

  it("client SDK never accepts recorded_by_user_id (no uid smuggling)", () => {
    const sdk = read("src/lib/meeting/outcome/sdk.ts");
    // Only comments/prose may reference the raw column name; identifiers must not.
    expect(/recordedByUserId\s*[:=]/.test(sdk)).toBe(false);
    expect(/recorded_by_user_id\s*[:=]/.test(sdk)).toBe(false);
    const fns = read("src/lib/meeting/outcome/functions.ts");
    expect(/recordedByUserId\s*[:=]/.test(fns)).toBe(false);
    expect(/recorded_by_user_id\s*[:=]/.test(fns)).toBe(false);
  });

  it("DTO type does not expose raw audit fields", () => {
    const t = read("src/lib/meeting/outcome/types.ts");
    const m = t.match(/interface MeetingOutcomeDTO\s*\{[\s\S]*?\n\}/);
    expect(m).toBeTruthy();
    const body = m![0];
    expect(body.includes("recorded_by_user_id")).toBe(false);
    expect(body.includes("recordedByUserId")).toBe(false);
  });

  it("documentation exists (Turn A gate)", () => {
    for (const f of [
      "docs/business-connect/meeting/outcome/MEETING_OUTCOME_ARCHITECTURE.md",
      "docs/business-connect/meeting/outcome/MEETING_OUTCOME_MODEL.md",
      "docs/business-connect/meeting/outcome/MEETING_OUTCOME_POLICY.md",
      "docs/business-connect/meeting/outcome/MEETING_OUTCOME_SECURITY.md",
      "docs/business-connect/meeting/outcome/MEETING_OUTCOME_EVENTS.md",
      "docs/business-connect/meeting/outcome/MEETING_OUTCOME_TEST_MATRIX.md",
    ]) {
      expect(existsSync(resolve(process.cwd(), f)), `missing ${f}`).toBe(true);
    }
  });
});

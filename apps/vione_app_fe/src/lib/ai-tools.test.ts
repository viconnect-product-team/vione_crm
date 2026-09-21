import { describe, it, expect } from "vitest";
import {
  AI_TOOLS,
  getTool,
  getToolsForCapability,
  canExecuteTool,
  planActions,
} from "@/lib/ai-tools";

const ADMIN = { rank: 2, hasAssociation: true };
const MOD = { rank: 1, hasAssociation: true };
const MEMBER = { rank: 0, hasAssociation: true };

describe("ai tool registry", () => {
  it("every tool is read-only and has a real route + confirmation flag", () => {
    for (const t of AI_TOOLS) {
      expect(t.readOnly).toBe(true);
      expect(t.route.startsWith("/")).toBe(true);
      expect(typeof t.requiresConfirmation).toBe("boolean");
    }
  });

  it("no mutation tools exist (read-only MVP)", () => {
    const forbidden = /(delete|approve|reject|send|notify|markpaid|publish|xoá|xóa|duyệt|gửi)/i;
    for (const t of AI_TOOLS) {
      expect(forbidden.test(t.id)).toBe(false);
      expect(t.kind).not.toBe("mutate" as never);
    }
  });

  it("export and generate tools require confirmation", () => {
    for (const t of AI_TOOLS) {
      if (t.kind === "export" || t.kind === "generate") {
        expect(t.requiresConfirmation).toBe(true);
      }
    }
  });

  it("pure navigation tools do not require confirmation", () => {
    for (const t of AI_TOOLS) {
      if (t.kind === "navigate") expect(t.requiresConfirmation).toBe(false);
    }
  });

  it("getTool and getToolsForCapability resolve correctly", () => {
    expect(getTool("OpenMarketplace")?.capability).toBe("marketplace");
    expect(getTool("nope")).toBeUndefined();
    expect(getToolsForCapability("member").length).toBeGreaterThan(0);
  });
});

describe("permission checks", () => {
  it("blocks tools above the user's role with an explanation", () => {
    const exportFee = getTool("ExportFeeReport")!; // admin
    const res = canExecuteTool(exportFee, MEMBER);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("quản trị");
  });

  it("allows tools at or below the user's role", () => {
    const search = getTool("SearchMembers")!; // member
    expect(canExecuteTool(search, MEMBER).allowed).toBe(true);
    const feeCenter = getTool("OpenFeeCenter")!; // moderator
    expect(canExecuteTool(feeCenter, MOD).allowed).toBe(true);
    expect(canExecuteTool(feeCenter, MEMBER).allowed).toBe(false);
  });

  it("blocks all tools when no association is selected", () => {
    const search = getTool("SearchMembers")!;
    expect(canExecuteTool(search, { rank: 2, hasAssociation: false }).allowed).toBe(false);
  });
});

describe("action planning", () => {
  it("puts export first only when the user asks to export", () => {
    const withExport = planActions("fee", "Xuất báo cáo hội phí quý này", ADMIN);
    expect(withExport.steps.some((s) => /xuất/i.test(s.label))).toBe(true);

    const noExport = planActions("member", "Tìm hội viên ngành Logistics", MEMBER);
    const firstTool = getTool(noExport.steps[0].toolId!);
    expect(firstTool?.kind).not.toBe("export");
  });

  it("always returns at least one step and only capability tools", () => {
    const plan = planActions("event", "sự kiện sắp tới", MEMBER);
    expect(plan.steps.length).toBeGreaterThan(0);
    for (const t of plan.tools) expect(t.capability).toBe("event");
  });
});

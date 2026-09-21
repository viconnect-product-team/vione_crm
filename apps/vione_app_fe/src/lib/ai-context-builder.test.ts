import { describe, it, expect } from "vitest";
import {
  detectCapability,
  toRegistryCapability,
  fromRegistryCapability,
} from "@/lib/ai-capability-router";
import { buildContextBundle, derivePermissionLevel, isKnownRoute } from "@/lib/ai-context-builder";
import { generateMockAnswer } from "@/lib/ai-mock-answer-engine";
import { documentProvider, feeProvider, memberProvider } from "@/lib/ai-context-providers";
import { emptyMemory } from "@/lib/ai-session-memory";

describe("ai-capability-router", () => {
  it("routes documents / members / fees by keyword", () => {
    expect(detectCapability("Tóm tắt tài liệu quyết định mới").capability).toBe("document_qa");
    expect(detectCapability("Tìm hội viên ngành logistics").capability).toBe("member_search");
    expect(detectCapability("Hội phí quá hạn còn bao nhiêu?").capability).toBe("fee_analysis");
    expect(detectCapability("Viết thông báo mời họp").capability).toBe("announcement_draft");
  });

  it("flags low confidence with clarification for vague input", () => {
    const d = detectCapability("cái này thế nào?", emptyMemory());
    expect(d.capability).toBe("general");
    expect(d.clarificationNeeded).toBe(true);
  });

  it("maps to/from registry capabilities symmetrically", () => {
    for (const c of ["document", "member", "fee", "event", "marketplace"] as const) {
      expect(toRegistryCapability(fromRegistryCapability(c))).toBe(c);
    }
  });
});

describe("ai-context-providers redaction & permissions", () => {
  it("member provider hides private contacts for non-admin", () => {
    const res = memberProvider(
      [{ id: "m1", name: "Nguyễn A", company: "ABC", industry: "Logistics" }],
      "member",
    );
    expect(res.limitations.some((l: any) => l.includes("liên hệ riêng tư"))).toBe(true);
    // Only safe display fields are surfaced.
    expect(JSON.stringify(res)).not.toMatch(/phone|email|tax/i);
  });

  it("fee provider gives aggregates to admin and blocks non-admin", () => {
    const admin = feeProvider(
      { outstanding: 42, overdue: 11, collectionRate: 78 },
      undefined,
      "admin",
    );
    expect(admin.metrics.outstanding).toBe(42);
    const member = feeProvider(undefined, undefined, "member");
    expect(member.metrics.outstanding).toBeUndefined();
    expect(member.limitations.length).toBeGreaterThan(0);
  });

  it("document provider does not hallucinate full text", () => {
    const res = documentProvider([{ id: "d1", title: "Quy chế", hasFullText: false }]);
    expect(res.limitations.some((l: any) => l.includes("metadata"))).toBe(true);
  });
});

describe("ai-context-builder", () => {
  it("derives permission level from roles", () => {
    expect(derivePermissionLevel({ isAdmin: true, isModerator: true })).toBe("admin");
    expect(
      derivePermissionLevel({ isPlatformAdmin: true, isAdmin: false, isModerator: false }),
    ).toBe("platform");
    expect(derivePermissionLevel({ isAdmin: false, isModerator: false })).toBe("member");
  });

  it("blocks restricted capability for members", () => {
    const bundle = buildContextBundle({
      message: "Báo cáo điều hành tuần này",
      capability: "executive_report",
      permissionLevel: "member",
    });
    expect(bundle.limitations.some((l: any) => l.includes("chưa có quyền"))).toBe(true);
    expect(bundle.sources.length).toBe(0);
  });

  it("only attaches known valid routes to actions", () => {
    const bundle = buildContextBundle({
      message: "Tìm hội viên ngành logistics",
      capability: "member_search",
      permissionLevel: "admin",
      data: { members: [{ id: "m1", name: "A", industry: "Logistics" }] },
    });
    for (const a of bundle.suggestedActions) {
      if (a.route) expect(isKnownRoute(a.route)).toBe(true);
    }
  });
});

describe("ai-mock-answer-engine", () => {
  it("returns a no-data answer when context is empty", () => {
    const bundle = buildContextBundle({
      message: "Tìm hội viên ngành logistics",
      capability: "member_search",
      permissionLevel: "admin",
    });
    const ans = generateMockAnswer("Tìm hội viên", "member_search", bundle);
    expect(ans.answer).toContain("chưa tìm thấy dữ liệu");
  });

  it("is deterministic for identical input", () => {
    const bundle = buildContextBundle({
      message: "Hội phí quá hạn",
      capability: "fee_analysis",
      permissionLevel: "admin",
      data: { fees: { outstanding: 42, overdue: 11, collectionRate: 78 } },
    });
    const a = generateMockAnswer("Hội phí quá hạn", "fee_analysis", bundle);
    const b = generateMockAnswer("Hội phí quá hạn", "fee_analysis", bundle);
    expect(a.answer).toBe(b.answer);
    expect(a.answer).toContain("42");
    expect(a.answer).toContain("78%");
  });

  it("marks announcement drafts as needing review", () => {
    const bundle = buildContextBundle({
      message: "Viết thông báo mời họp",
      capability: "announcement_draft",
      permissionLevel: "admin",
    });
    const ans = generateMockAnswer("Viết thông báo mời họp", "announcement_draft", bundle);
    expect(ans.answer).toContain("cần được kiểm tra trước khi gửi");
  });
});

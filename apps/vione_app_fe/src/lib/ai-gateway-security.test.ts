import { describe, it, expect, beforeEach } from "vitest";
import {
  parseStructuredOutput,
  safeParseStructuredOutput,
  sanitizeStructuredOutput,
  type AiStructuredOutput,
} from "@/lib/ai-output-schema";
import { getAllowedRoutes } from "@/lib/ai-context-builder";
import { mockAiProvider } from "@/lib/ai-provider";
import { checkAiRateLimit, __resetAiRateLimit } from "@/lib/ai-rate-limit";
import { buildContextBundle } from "@/lib/ai-context-builder";
import { guardProviderOutput, safeFallbackOutput } from "@/lib/ai-output-guard";

const base: AiStructuredOutput = {
  answer: "Nội dung",
  reasoningSummary: "Lý do",
  evidenceIds: [],
  limitations: [],
  suggestedActions: [],
  confidence: "medium",
};

describe("ai-output-schema guards", () => {
  it("rejects evidence ids outside the provided context", () => {
    const out = sanitizeStructuredOutput(
      { ...base, evidenceIds: ["doc-1", "hacked-999"] },
      { allowedSourceIds: ["doc-1"], allowedRoutes: [] },
    );
    expect(out.evidenceIds).toEqual(["doc-1"]);
  });

  it("drops suggested routes outside the allow-list", () => {
    const out = sanitizeStructuredOutput(
      {
        ...base,
        suggestedActions: [
          { label: "ok", route: "/documents" },
          { label: "evil", route: "/secret-admin" },
          { label: "intent-only", intent: "new-topic" },
        ],
      },
      { allowedSourceIds: [], allowedRoutes: ["/documents"] },
    );
    expect(out.suggestedActions.map((a: any) => a.label)).toEqual(["ok", "intent-only"]);
  });

  it("strips raw HTML but keeps markdown", () => {
    const out = sanitizeStructuredOutput(
      { ...base, answer: "**bold** <script>alert(1)</script> text" },
      { allowedSourceIds: [], allowedRoutes: [] },
    );
    expect(out.answer).not.toContain("<script>");
    expect(out.answer).toContain("**bold**");
  });

  it("handles invalid LLM JSON safely", () => {
    expect(() => parseStructuredOutput("{ not json")).toThrow();
    expect(safeParseStructuredOutput("{ not json")).toBeNull();
    expect(safeParseStructuredOutput('{"answer":1}')).toBeNull();
  });

  it("only allows known application routes", () => {
    const routes = getAllowedRoutes();
    expect(routes).toContain("/documents");
    expect(routes).not.toContain("/secret-admin");
  });
});

describe("mock provider fallback", () => {
  it("produces low confidence with a clarification when no data", async () => {
    const bundle = buildContextBundle({
      message: "câu hỏi mơ hồ",
      capability: "general",
      permissionLevel: "member",
    });
    const out = await mockAiProvider.generate({
      message: "câu hỏi mơ hồ",
      capability: "general",
      permissionLevel: "member",
      bundle,
      allowedRoutes: getAllowedRoutes(),
    });
    expect(out.providerName).toBe("mock");
    expect(out.confidence).toBe("low");
    expect(out.clarificationQuestion).toBeTruthy();
  });
});

describe("ai-output-guard", () => {
  it("removes invalid evidence/actions and reports removals with a limitation", () => {
    const res = guardProviderOutput(
      {
        ...base,
        evidenceIds: ["ok", "bad"],
        suggestedActions: [
          { label: "ok", route: "/documents" },
          { label: "bad", route: "/secret-admin" },
        ],
      },
      { allowedSourceIds: ["ok"], allowedRoutes: ["/documents"] },
    );
    expect(res.removedEvidence).toBe(1);
    expect(res.removedActions).toBe(1);
    expect(res.output.evidenceIds).toEqual(["ok"]);
    expect(res.output.limitations.length).toBeGreaterThan(0);
  });

  it("safeFallbackOutput never throws and is low confidence", () => {
    const fb = safeFallbackOutput("máy chủ lỗi");
    expect(fb.confidence).toBe("low");
    expect(fb.limitations).toContain("máy chủ lỗi");
    expect(fb.clarificationQuestion).toBeTruthy();
  });

  it("context bundle for non-admin fee query exposes no sensitive fields", () => {
    const bundle = buildContextBundle({
      message: "hội phí quá hạn",
      capability: "fee_analysis",
      permissionLevel: "member",
    });
    const serialized = JSON.stringify(bundle);
    expect(serialized).not.toMatch(/tax_code/i);
    // Non-admin gets no raw fee rows (empty snapshot / permission-limited).
    expect(bundle.sources.every((s) => !("amount" in s))).toBe(true);
  });
});

describe("ai rate limit", () => {
  beforeEach(() => __resetAiRateLimit());

  it("returns a safe error when the per-user limit is exceeded", () => {
    let last = checkAiRateLimit({ userId: "u1", associationId: "a1", role: "member" });
    for (let i = 0; i < 20; i++) {
      last = checkAiRateLimit({ userId: "u1", associationId: "a1", role: "member" });
    }
    expect(last.allowed).toBe(false);
    expect(last.message).toBeTruthy();
    expect(last.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates buckets per user", () => {
    for (let i = 0; i < 20; i++)
      checkAiRateLimit({ userId: "u1", associationId: "a1", role: "member" });
    const other = checkAiRateLimit({ userId: "u2", associationId: "a1", role: "member" });
    expect(other.allowed).toBe(true);
  });
});

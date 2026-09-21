// BC-9.0 Turn A — Policy tests (§87, §98).
// These tests are pure and prove the frozen invariants of the intelligence
// registry, risk model, source allowlists, model routing, prompt versions and
// SDK surface. They must never depend on runtime.

import { describe, expect, it, vi } from "vitest";

// BC-RC1C: the SDK lazily imports the real server function, which cannot run
// under jsdom (no TanStack Start async context). Stub it so this stays a pure
// error-mapping test, matching the frozen provider-unavailable contract.
vi.mock("@/lib/business-connect-ai.functions", () => ({
  bcAiGenerate: async () => {
    const { BusinessConnectAIError } = await import("@/lib/business-connect/intelligence/errors");
    throw new BusinessConnectAIError("BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE");
  },
  bcAiGetResult: async () => {
    throw new Error("BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE");
  },
  bcAiAcceptResult: async () => {
    throw new Error("BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE");
  },
  bcAiRejectResult: async () => {
    throw new Error("BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE");
  },
}));
import {
  BUSINESS_CONNECT_AI_CAPABILITIES,
  BUSINESS_CONNECT_AI_CAPABILITY_RISK,
  BUSINESS_CONNECT_AI_CAPABILITY_SOURCES,
  BUSINESS_CONNECT_AI_EXCLUDED_DOMAINS,
  BUSINESS_CONNECT_AI_RESULT_STATUS,
  BUSINESS_CONNECT_AI_REQUEST_STATUS,
  BUSINESS_CONNECT_AI_SOURCE_DOMAINS,
  BUSINESS_CONNECT_AI_VERSION,
  isBusinessConnectAICapability,
  riskFor,
  allowedSourcesFor,
} from "@/lib/business-connect/intelligence/registry";
import {
  BUSINESS_CONNECT_AI_ERROR_CODES,
  BusinessConnectAIError,
  toBusinessConnectAIErrorCode,
} from "@/lib/business-connect/intelligence/errors";
import {
  assertPrivateNotesExcluded,
  isScopeCompatible,
  isSourceGloballyExcluded,
} from "@/lib/business-connect/intelligence/eligibility";
import {
  assertPrivateBeforePublic,
  BUSINESS_CONNECT_AI_MODEL_POLICY,
  selectModelPolicyClass,
} from "@/lib/business-connect/intelligence/model-routing";
import {
  getPromptEntry,
  listPromptEntries,
} from "@/lib/business-connect/intelligence/prompt-registry";
import { BUSINESS_CONNECT_AI_RESPONSE_SCHEMAS } from "@/lib/business-connect/intelligence/response-schemas";
import {
  BUSINESS_CONNECT_AI_SDK_METHODS,
  BusinessConnectIntelligenceSDK,
} from "@/lib/business-connect/intelligence/sdk";
import {
  DEFAULT_DAILY_RATE_LIMITS,
  RESULT_EXPIRY_SECONDS,
  TOOL_LOOP_LIMITS,
} from "@/lib/business-connect/intelligence/context-policy";

describe("BC-9.0 capability registry (freeze)", () => {
  it("exposes exactly 8 capabilities and a v1.0.0 version", () => {
    expect(BUSINESS_CONNECT_AI_VERSION).toBe("1.0.0");
    expect(BUSINESS_CONNECT_AI_CAPABILITIES).toHaveLength(8);
  });

  it("registry constants are frozen", () => {
    expect(Object.isFrozen(BUSINESS_CONNECT_AI_CAPABILITY_RISK)).toBe(true);
    expect(Object.isFrozen(BUSINESS_CONNECT_AI_CAPABILITY_SOURCES)).toBe(true);
  });

  it("no capability maps to prohibited_autonomous_action", () => {
    for (const cap of BUSINESS_CONNECT_AI_CAPABILITIES) {
      expect(riskFor(cap)).not.toBe("prohibited_autonomous_action");
    }
  });

  it("isBusinessConnectAICapability guards unknown values", () => {
    expect(isBusinessConnectAICapability("relationship_briefing")).toBe(true);
    expect(isBusinessConnectAICapability("send_message")).toBe(false);
    expect(isBusinessConnectAICapability(42)).toBe(false);
  });
});

describe("BC-9.0 source allowlists", () => {
  it("every capability allowlist references only known safe source domains", () => {
    const known = new Set(BUSINESS_CONNECT_AI_SOURCE_DOMAINS);
    for (const cap of BUSINESS_CONNECT_AI_CAPABILITIES) {
      for (const src of allowedSourcesFor(cap)) {
        expect(known.has(src)).toBe(true);
      }
    }
  });

  it("no capability allowlist includes any explicitly excluded domain", () => {
    for (const cap of BUSINESS_CONNECT_AI_CAPABILITIES) {
      for (const src of allowedSourcesFor(cap)) {
        expect(isSourceGloballyExcluded(src)).toBe(false);
      }
    }
  });

  it("private_meeting_notes is excluded from every capability (hard gate)", () => {
    expect(() => assertPrivateNotesExcluded()).not.toThrow();
    for (const excluded of BUSINESS_CONNECT_AI_EXCLUDED_DOMAINS) {
      expect(isSourceGloballyExcluded(excluded)).toBe(true);
    }
  });
});

describe("BC-9.0 scope compatibility", () => {
  it("meeting_preparation requires a meeting scope", () => {
    expect(
      isScopeCompatible("meeting_preparation", {
        type: "meeting",
        meetingRef: { id: "m1", label: "M" },
      }),
    ).toBe(true);
    expect(isScopeCompatible("meeting_preparation", { type: "work_hub" })).toBe(false);
  });

  it("next_action_suggestion accepts work_hub or global scope", () => {
    expect(isScopeCompatible("next_action_suggestion", { type: "work_hub" })).toBe(true);
    expect(isScopeCompatible("next_action_suggestion", { type: "global_business_connect" })).toBe(
      true,
    );
    expect(
      isScopeCompatible("next_action_suggestion", {
        type: "meeting",
        meetingRef: { id: "m1", label: "M" },
      }),
    ).toBe(false);
  });
});

describe("BC-9.0 model routing (§16, §18)", () => {
  it("never routes public model before a private option", () => {
    expect(() => assertPrivateBeforePublic()).not.toThrow();
  });

  it("selectModelPolicyClass falls back to unavailable when none up", () => {
    const availability = {
      cloud_general: false,
      cloud_private: false,
      local_private: false,
      unavailable: false,
    };
    expect(selectModelPolicyClass("relationship_briefing", availability)).toBe("unavailable");
  });

  it("prefers cloud_private for sensitive capabilities", () => {
    const availability = {
      cloud_general: true,
      cloud_private: true,
      local_private: true,
      unavailable: false,
    };
    expect(selectModelPolicyClass("relationship_briefing", availability)).toBe("cloud_private");
    expect(selectModelPolicyClass("meeting_preparation", availability)).toBe("cloud_private");
  });

  it("relationship_briefing and meeting_preparation NEVER route to cloud_general", () => {
    for (const cap of ["relationship_briefing", "meeting_preparation"] as const) {
      expect(BUSINESS_CONNECT_AI_MODEL_POLICY[cap]).not.toContain("cloud_general");
    }
  });
});

describe("BC-9.0 prompt registry (immutable)", () => {
  it("has one entry per capability, all @1.0.0", () => {
    for (const cap of BUSINESS_CONNECT_AI_CAPABILITIES) {
      const p = getPromptEntry(cap);
      expect(p.version).toBe("1.0.0");
      expect(p.id).toContain(cap.replace(/_/g, "-"));
      expect(p.systemInstruction).toMatch(/KHÔNG bao giờ dùng ghi chú riêng/);
      expect(p.systemInstruction).toMatch(/KHÔNG bao giờ tuyên bố đã gửi/);
    }
    expect(listPromptEntries()).toHaveLength(BUSINESS_CONNECT_AI_CAPABILITIES.length);
  });

  it("prompt entries are frozen", () => {
    for (const entry of listPromptEntries()) {
      expect(Object.isFrozen(entry)).toBe(true);
    }
  });
});

describe("BC-9.0 response schemas", () => {
  it("has a schema for every capability", () => {
    for (const cap of BUSINESS_CONNECT_AI_CAPABILITIES) {
      expect(BUSINESS_CONNECT_AI_RESPONSE_SCHEMAS[cap]).toBeDefined();
    }
  });

  it("next_action requires requiresHumanDecision === true on every suggestion", () => {
    const schema = BUSINESS_CONNECT_AI_RESPONSE_SCHEMAS.next_action_suggestion;
    const bad = schema.safeParse({
      suggestions: [
        {
          rank: 1,
          actionKind: "reply",
          rationale: "x",
          targetRoute: "/x",
          urgency: "low",
          evidence: [],
          confidence: "low",
          requiresHumanDecision: false,
        },
      ],
      omittedReasons: [],
      confidence: "low",
      citations: [],
      limitations: [],
    });
    expect(bad.success).toBe(false);
  });
});

describe("BC-9.0 SDK contract (no mutation)", () => {
  it("SDK is frozen and exposes exactly the whitelisted methods", () => {
    expect(Object.isFrozen(BusinessConnectIntelligenceSDK)).toBe(true);
    for (const name of BUSINESS_CONNECT_AI_SDK_METHODS) {
      expect(
        typeof (BusinessConnectIntelligenceSDK as unknown as Record<string, unknown>)[name],
      ).toBe("function");
    }
  });

  it("SDK never exposes canonical mutation verbs", () => {
    const forbidden = [
      "send",
      "submit",
      "createConnection",
      "acceptRequest",
      "scheduleMeeting",
      "completeFollowUp",
      "finalizeOutcome",
    ];
    for (const verb of forbidden) {
      expect(BUSINESS_CONNECT_AI_SDK_METHODS as readonly string[]).not.toContain(verb);
    }
  });

  it("Turn A runtime returns PROVIDER_UNAVAILABLE, not fabricated output", async () => {
    await expect(
      BusinessConnectIntelligenceSDK.generateRelationshipBriefing({
        scope: { type: "person", personRef: { id: "p1", label: "P" } },
      }),
    ).rejects.toMatchObject({ code: "BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE" });
  });
});

describe("BC-9.0 error contract", () => {
  it("code list is frozen and covers §64", () => {
    expect(BUSINESS_CONNECT_AI_ERROR_CODES).toContain("BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE");
    expect(BUSINESS_CONNECT_AI_ERROR_CODES).toContain("BUSINESS_CONNECT_AI_RESULT_STALE");
    expect(BUSINESS_CONNECT_AI_ERROR_CODES).toContain("BUSINESS_CONNECT_AI_INVALID_RESPONSE");
  });

  it("unknown errors collapse to INTERNAL_ERROR", () => {
    expect(toBusinessConnectAIErrorCode(new Error("random"))).toBe(
      "BUSINESS_CONNECT_AI_INTERNAL_ERROR",
    );
    expect(
      toBusinessConnectAIErrorCode(new BusinessConnectAIError("BUSINESS_CONNECT_AI_RATE_LIMITED")),
    ).toBe("BUSINESS_CONNECT_AI_RATE_LIMITED");
  });
});

describe("BC-9.0 policy constants", () => {
  it("every capability has a rate limit and result expiry", () => {
    for (const cap of BUSINESS_CONNECT_AI_CAPABILITIES) {
      expect(DEFAULT_DAILY_RATE_LIMITS[cap]).toBeGreaterThan(0);
      expect(RESULT_EXPIRY_SECONDS[cap]).toBeGreaterThan(0);
    }
  });

  it("tool-loop limits are bounded (§44)", () => {
    expect(TOOL_LOOP_LIMITS.maxToolCallsPerRequest).toBeLessThanOrEqual(8);
    expect(TOOL_LOOP_LIMITS.maxIterations).toBeLessThanOrEqual(6);
    expect(TOOL_LOOP_LIMITS.maxTotalFacts).toBeLessThanOrEqual(100);
  });

  it("status enums are frozen (§4, §36)", () => {
    expect(BUSINESS_CONNECT_AI_RESULT_STATUS).toEqual([
      "generated",
      "reviewed",
      "accepted",
      "rejected",
      "expired",
    ]);
    expect(BUSINESS_CONNECT_AI_REQUEST_STATUS).toEqual([
      "pending",
      "running",
      "completed",
      "failed",
      "cancelled",
      "expired",
    ]);
  });
});

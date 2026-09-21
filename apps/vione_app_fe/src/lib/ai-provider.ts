import type { AiCapability } from "@/lib/ai-capability-router";
import type { ContextBundle } from "@/lib/ai-context-builder";
import type { PermissionLevel } from "@/lib/ai-context-providers";
import type { AiStructuredOutput } from "@/lib/ai-output-schema";
import { generateMockAnswer } from "@/lib/ai-mock-answer-engine";

/**
 * AI Provider Abstraction — Phase 10, Step 5 (client-safe types + mock).
 *
 * The interface both the mock and the real (server-only) providers implement.
 * This module is client-safe: it contains NO secrets and reads NO env. The
 * real provider that reads OPENAI_API_KEY / LOVABLE_API_KEY lives in
 * `ai-provider.server.ts` and is only ever imported inside server handlers.
 */

export type AiProviderInput = {
  message: string;
  capability: AiCapability;
  permissionLevel: PermissionLevel;
  bundle: ContextBundle;
  memorySummary?: string;
  /** Route allow-list the provider output must respect. */
  allowedRoutes: string[];
};

export type AiProviderOutput = AiStructuredOutput & {
  /** Which provider produced this (for logging). */
  providerName: string;
  model?: string;
};

export interface AiProvider {
  readonly name: string;
  generate(input: AiProviderInput): Promise<AiProviderOutput>;
}

/** Error type real providers throw so the caller can fall back to mock. */
export class AiProviderError extends Error {
  code:
    | "timeout"
    | "rate_limited"
    | "invalid_key"
    | "invalid_json"
    | "unavailable"
    | "too_large"
    | "unknown";
  constructor(code: AiProviderError["code"], message: string) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
  }
}

/**
 * Deterministic mock provider — the default and the fallback. Wraps the
 * Step 4 mock answer engine and maps it to the structured output contract.
 */
export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  async generate(input: AiProviderInput): Promise<AiProviderOutput> {
    const mock = generateMockAnswer(input.message, input.capability, input.bundle);
    const hasData = input.bundle.sources.length > 0 || Object.keys(input.bundle.metrics).length > 0;
    const confidence = hasData ? "medium" : "low";
    return {
      providerName: this.name,
      model: "mock",
      answer: mock.answer,
      reasoningSummary: mock.reasoningSummary,
      evidenceIds: mock.evidence.map((e: any) => e.id),
      limitations: mock.limitations,
      suggestedActions: mock.suggestedActions,
      confidence,
      clarificationQuestion:
        confidence === "low" ? "Anh/chị có thể nói rõ hơn về yêu cầu không?" : undefined,
    };
  }
}

export const mockAiProvider = new MockAiProvider();

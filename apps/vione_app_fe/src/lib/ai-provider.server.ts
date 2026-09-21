import {
  AiProviderError,
  mockAiProvider,
  type AiProvider,
  type AiProviderInput,
  type AiProviderOutput,
} from "@/lib/ai-provider";
import { SYSTEM_INSTRUCTION, buildUserContextMessage } from "@/lib/ai-prompt-contract";
import { parseStructuredOutput, sanitizeStructuredOutput } from "@/lib/ai-output-schema";

/**
 * AI Provider — SERVER ONLY — Phase 10, Step 5.
 *
 * Reads server-only env (never VITE_) and selects a provider. The real
 * provider calls the LLM through the Lovable AI Gateway (OpenAI-compatible)
 * server-side; the API key never reaches the client. The default stays `mock`
 * until AI_REAL_PROVIDER_ENABLED=true AND AI_PROVIDER is set to a real value.
 *
 * Do NOT import this file at the module scope of a `*.functions.ts` route
 * module — import it dynamically inside the handler so it stays server-only.
 */

export type AiProviderName = "mock" | "openai" | "local";

export type AiConfig = {
  provider: AiProviderName;
  realEnabled: boolean;
  model: string;
  maxContextItems: number;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
};

const DEFAULTS = {
  model: "google/gemini-3-flash-preview",
  maxContextItems: 12,
  maxTokens: 1024,
  temperature: 0.2,
  timeoutMs: 20000,
};

function numEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function readAiConfig(): AiConfig {
  const provider = (process.env.AI_PROVIDER as AiProviderName) || "mock";
  // Real provider requires BOTH the flag and a non-mock provider.
  const realEnabled = process.env.AI_REAL_PROVIDER_ENABLED === "true" && provider !== "mock";
  return {
    provider,
    realEnabled,
    model: process.env.OPENAI_MODEL || DEFAULTS.model,
    maxContextItems: numEnv("AI_MAX_CONTEXT_ITEMS", DEFAULTS.maxContextItems),
    maxTokens: numEnv("AI_MAX_TOKENS", DEFAULTS.maxTokens),
    temperature: numEnv("AI_TEMPERATURE", DEFAULTS.temperature),
    timeoutMs: DEFAULTS.timeoutMs,
  };
}

/** Real provider: calls the Lovable AI Gateway server-side and returns JSON. */
class GatewayAiProvider implements AiProvider {
  readonly name = "openai";
  constructor(private config: AiConfig) {}

  async generate(input: AiProviderInput): Promise<AiProviderOutput> {
    const apiKey = process.env.LOVABLE_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new AiProviderError("invalid_key", "Missing AI provider key");

    const userMsg = buildUserContextMessage({
      capability: input.capability,
      permissionLevel: input.permissionLevel,
      bundle: input.bundle,
      message: input.message,
      allowedRoutes: input.allowedRoutes,
      memorySummary: input.memorySummary,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            {
              role: "system",
              content:
                'Trả về JSON đúng schema: { "answer": string, "reasoningSummary": string, "evidenceIds": string[], "limitations": string[], "suggestedActions": {label,route?,intent?,disabled?,reason?}[], "confidence": "low"|"medium"|"high", "clarificationQuestion"?: string }',
            },
            { role: "user", content: userMsg },
          ],
        }),
      });
    } catch (e) {
      throw new AiProviderError(
        (e as Error)?.name === "AbortError" ? "timeout" : "unavailable",
        "AI provider request failed",
      );
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 401 || res.status === 403) {
      throw new AiProviderError("invalid_key", "AI provider rejected the key");
    }
    if (res.status === 429) {
      throw new AiProviderError("rate_limited", "AI provider rate limited (429)");
    }
    if (res.status === 413) {
      throw new AiProviderError("too_large", "Context too large");
    }
    if (res.status >= 500) {
      throw new AiProviderError("unavailable", `AI provider status ${res.status}`);
    }
    if (!res.ok) {
      throw new AiProviderError("unavailable", `AI provider status ${res.status}`);
    }

    const json = (await res.json().catch(() => null)) as {
      choices?: { message?: { content?: string } }[];
    } | null;
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new AiProviderError("invalid_json", "Empty provider content");

    let parsed;
    try {
      parsed = parseStructuredOutput(content);
    } catch {
      throw new AiProviderError("invalid_json", "Provider returned invalid JSON");
    }

    // Enforce evidence-id and route allow-lists on the model output.
    const safe = sanitizeStructuredOutput(parsed, {
      allowedSourceIds: input.bundle.sources.map((s) => s.id),
      allowedRoutes: input.allowedRoutes,
    });

    return { ...safe, providerName: this.name, model: this.config.model };
  }
}

/** Choose a provider from config. Defaults to the deterministic mock. */
export function selectAiProvider(config: AiConfig): AiProvider {
  if (!config.realEnabled) return mockAiProvider;
  switch (config.provider) {
    case "openai":
      return new GatewayAiProvider(config);
    case "local":
      // Placeholder for a future on-prem provider; safe default until built.
      return mockAiProvider;
    case "mock":
    default:
      return mockAiProvider;
  }
}

// BC-Mobile-6A — AI wording (server-only). Wording ONLY — never ranking.
//
// Input contract: exactly { daysSinceLastInteraction, locale } — a number
// and a language code. NO name, NO person id, NO free text ever enters the
// prompt, so prompt injection via input is structurally impossible.
// Output contract: strict zod JSON; grounding validates that every number
// in the text equals the supplied value and that the text contains no
// URL/HTML/markdown. ANY failure (timeout, schema, grounding, gateway)
// silently falls back to the deterministic template — the caller never
// sees an error.

import { z } from "zod";
import { trackRelationshipIntel } from "./relationship-intelligence.telemetry";
import {
  RELATIONSHIP_INTELLIGENCE_CONFIG,
  type RelationshipWordingLocale,
} from "./relationship-intelligence.types";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const SIGNAL_KEYS = ["daysSinceLastInteraction"] as const;

const WordingSchema = z
  .object({
    suggestionText: z.string().min(1).max(140),
    referencedSignalKeys: z.array(z.enum(SIGNAL_KEYS)).max(4),
  })
  .strict();

const GatewayResponseSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

export type RelationshipWordingInput = {
  locale: RelationshipWordingLocale;
  daysSinceLastInteraction: number;
};

/** Injectable gateway port (tests inject; production hits Lovable AI). */
export type RelationshipWordingGateway = (
  payload: Record<string, unknown>,
  timeoutMs: number,
) => Promise<unknown>;

const defaultGateway: RelationshipWordingGateway = async (payload, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"] ?? ""}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/** Prompt builder — exported so tests can assert the payload contains NO PII. */
export function buildWordingPrompt(input: RelationshipWordingInput): Record<string, unknown> {
  const system = [
    "You write ONE short, warm, professional reconnection suggestion for a business-networking app.",
    "Output STRICT JSON with exactly the keys suggestionText and referencedSignalKeys.",
    "suggestionText: at most 120 characters, plain text, no URLs, no markdown, no HTML, no emojis.",
    "Never invent facts, names, places, dates or numbers. The only number you may reference is daysSinceLastInteraction.",
    "referencedSignalKeys: every input key your sentence relies on (subset of [daysSinceLastInteraction]).",
    input.locale === "vi"
      ? "Write suggestionText in Vietnamese."
      : "Write suggestionText in English.",
  ].join(" ");
  const user = JSON.stringify({
    promptVersion: RELATIONSHIP_INTELLIGENCE_CONFIG.AI_PROMPT_VERSION,
    locale: input.locale,
    signals: { daysSinceLastInteraction: input.daysSinceLastInteraction },
  });
  return {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
    max_tokens: 160,
    response_format: { type: "json_object" },
  };
}

/** URLs, HTML tags, markdown structure — all forbidden in wording. */
const FORBIDDEN_TEXT = /(https?:|www\.|<[^>]*>|[`*#|[\]]|!\[)/;

export function extractNumbers(text: string): number[] {
  return (text.match(/\d+/g) ?? []).map((n: any) => Number.parseInt(n, 10));
}

/** Grounding: every number must equal the supplied value; no structure chars. */
export function passesGrounding(text: string, input: RelationshipWordingInput): boolean {
  if (FORBIDDEN_TEXT.test(text)) return false;
  return extractNumbers(text).every((n) => n === input.daysSinceLastInteraction);
}

/** Strict JSON parse + schema; unknown keys, wrong types ⇒ null. */
export function parseWordingOutput(raw: string): { suggestionText: string } | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = WordingSchema.safeParse(json);
  return parsed.success ? { suggestionText: parsed.data.suggestionText.trim() } : null;
}

/**
 * Generate reconnection wording. NEVER throws — returns null on any failure
 * (caller falls back to the deterministic i18n template).
 */
export async function generateRelationshipWording(
  input: RelationshipWordingInput,
  deps?: { gateway?: RelationshipWordingGateway },
): Promise<string | null> {
  if (!RELATIONSHIP_INTELLIGENCE_CONFIG.AI_WORDING_ENABLED) {
    trackRelationshipIntel("RELATIONSHIP_AI_FALLBACK_USED", { reason: "disabled" });
    return null;
  }
  if (!Number.isFinite(input.daysSinceLastInteraction) || input.daysSinceLastInteraction < 0) {
    trackRelationshipIntel("RELATIONSHIP_AI_FALLBACK_USED", { reason: "gateway" });
    return null;
  }
  const gateway = deps?.gateway ?? defaultGateway;
  let raw: unknown;
  try {
    raw = await gateway(
      buildWordingPrompt(input),
      RELATIONSHIP_INTELLIGENCE_CONFIG.AI_WORDING_TIMEOUT_MS,
    );
  } catch {
    trackRelationshipIntel("RELATIONSHIP_AI_FALLBACK_USED", { reason: "gateway" });
    return null;
  }
  if (!raw) {
    trackRelationshipIntel("RELATIONSHIP_AI_FALLBACK_USED", { reason: "gateway" });
    return null;
  }
  const envelope = GatewayResponseSchema.safeParse(raw);
  if (!envelope.success) {
    trackRelationshipIntel("RELATIONSHIP_AI_FALLBACK_USED", { reason: "schema" });
    return null;
  }
  const parsed = parseWordingOutput(envelope.data.choices[0].message.content);
  if (!parsed) {
    trackRelationshipIntel("RELATIONSHIP_AI_FALLBACK_USED", { reason: "schema" });
    return null;
  }
  if (!passesGrounding(parsed.suggestionText, input)) {
    trackRelationshipIntel("RELATIONSHIP_AI_GROUNDING_REJECTED", { reason: "grounding" });
    return null;
  }
  return parsed.suggestionText;
}

import { z } from "zod";

/**
 * AI Structured Output Schema & Guards — Phase 10, Step 5.
 *
 * The LLM MUST return JSON matching this schema. These helpers parse and
 * SANITIZE the model output so untrusted generations can never:
 *  - cite evidence ids that were not in the provided context,
 *  - link to routes outside the allow-list,
 *  - inject raw HTML (markdown is allowed; HTML tags are stripped).
 *
 * Keep the schema flat and constraint-free (no min/max/format) so the gateway
 * accepts it; enforce limits in prompt text + code, not in the schema.
 */

export type AiConfidence = "low" | "medium" | "high";

export type AiSuggestedAction = {
  label: string;
  route?: string;
  intent?: string;
  disabled?: boolean;
  reason?: string;
};

export type AiStructuredOutput = {
  answer: string;
  reasoningSummary: string;
  evidenceIds: string[];
  limitations: string[];
  suggestedActions: AiSuggestedAction[];
  confidence: AiConfidence;
  clarificationQuestion?: string;
};

export const aiSuggestedActionSchema = z.object({
  label: z.string(),
  route: z.string().optional(),
  intent: z.string().optional(),
  disabled: z.boolean().optional(),
  reason: z.string().optional(),
});

export const aiStructuredOutputSchema = z.object({
  answer: z.string(),
  reasoningSummary: z.string(),
  evidenceIds: z.array(z.string()),
  limitations: z.array(z.string()),
  suggestedActions: z.array(aiSuggestedActionSchema),
  confidence: z.enum(["low", "medium", "high"]),
  clarificationQuestion: z.string().optional(),
});

/** Remove HTML tags — markdown stays, arbitrary HTML is rejected. */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

/**
 * Parse raw model output (string or object). Throws on malformed JSON or a
 * schema mismatch — the caller must catch and fall back safely.
 */
export function parseStructuredOutput(raw: unknown): AiStructuredOutput {
  const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
  return aiStructuredOutputSchema.parse(obj);
}

/** Like parseStructuredOutput but returns null instead of throwing. */
export function safeParseStructuredOutput(raw: unknown): AiStructuredOutput | null {
  try {
    return parseStructuredOutput(raw);
  } catch {
    return null;
  }
}

/**
 * Sanitize a parsed output against the context that was actually provided.
 * Drops any evidence id or route the server did not authorize, and strips HTML.
 */
export function sanitizeStructuredOutput(
  out: AiStructuredOutput,
  opts: { allowedSourceIds: string[]; allowedRoutes: string[] },
): AiStructuredOutput {
  const idSet = new Set(opts.allowedSourceIds);
  const routeSet = new Set(opts.allowedRoutes);
  return {
    answer: stripHtml(out.answer),
    reasoningSummary: stripHtml(out.reasoningSummary),
    evidenceIds: out.evidenceIds.filter((id) => idSet.has(id)),
    limitations: out.limitations.map(stripHtml),
    suggestedActions: out.suggestedActions
      .filter((a: any) => !a.route || routeSet.has(a.route))
      .map((a: any) => ({ ...a, label: stripHtml(a.label) })),
    confidence: out.confidence,
    clarificationQuestion: out.clarificationQuestion
      ? stripHtml(out.clarificationQuestion)
      : undefined,
  };
}

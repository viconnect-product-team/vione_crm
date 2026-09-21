import { sanitizeStructuredOutput, type AiStructuredOutput } from "@/lib/ai-output-schema";

/**
 * AI Output Guard — Phase 10, Step 6.
 *
 * Defense-in-depth validation of provider output before it reaches the client.
 * Wraps the schema sanitizer and reports what was removed so the caller can
 * surface an honest limitation instead of silently dropping data. Never throws
 * — always returns a safe, renderable result.
 */

export type GuardResult = {
  output: AiStructuredOutput;
  removedEvidence: number;
  removedActions: number;
};

export function guardProviderOutput(
  raw: AiStructuredOutput,
  opts: { allowedSourceIds: string[]; allowedRoutes: string[] },
): GuardResult {
  const beforeEvidence = raw.evidenceIds.length;
  const beforeActions = raw.suggestedActions.length;

  const safe = sanitizeStructuredOutput(raw, opts);

  const removedEvidence = beforeEvidence - safe.evidenceIds.length;
  const removedActions = beforeActions - safe.suggestedActions.length;

  const limitations = [...safe.limitations];
  if (removedEvidence > 0 || removedActions > 0) {
    limitations.push(
      "Một số dẫn chứng hoặc hành động không hợp lệ đã bị loại bỏ để đảm bảo an toàn.",
    );
  }

  return {
    output: { ...safe, limitations },
    removedEvidence,
    removedActions,
  };
}

/** A minimal, always-safe answer for when provider output cannot be used. */
export function safeFallbackOutput(reason: string): AiStructuredOutput {
  return {
    answer: "Em chưa thể tạo câu trả lời an toàn cho yêu cầu này.",
    reasoningSummary: "",
    evidenceIds: [],
    limitations: [reason],
    suggestedActions: [],
    confidence: "low",
    clarificationQuestion: "Anh/chị có thể diễn đạt lại yêu cầu không?",
  };
}

// BC-Mobile-4A — scan orchestration (server-only).
//
// Wires the vision runtime to the strict validator + candidate builder.
// NO persistence: nothing here touches guest_contacts, user_connections,
// saved cards, the relationship graph, Journey, or Meeting Moments. A scan
// produces an in-memory candidate and is gone.

import { buildCandidateFromModel } from "./card-scan.extract";
import { runCardOcrVision } from "./card-scan.server";
import { ocrModelOutputSchema, type CardScanResponse } from "./card-scan.types";
import { safeRandomUUID } from "@/lib/utils";

/** Validates raw model JSON and builds the candidate — pure given `raw`. */
export function candidateFromRawModelOutput(raw: unknown, scanId: string): CardScanResponse {
  const parsed = ocrModelOutputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_output" };
  const built = buildCandidateFromModel(parsed.data, scanId);
  if (!built.ok) return { ok: false, code: "unusable" };
  return { ok: true, candidate: built.candidate };
}

/** Full OCR pass: image in → candidate (or truthful failure code) out. */
export async function scanBusinessCardImage(imageDataUrl: string): Promise<CardScanResponse> {
  const raw = await runCardOcrVision(imageDataUrl);
  return candidateFromRawModelOutput(raw, safeRandomUUID());
}

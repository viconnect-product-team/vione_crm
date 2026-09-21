// BC-9.1 Turn B2b-i — Extraction Pipeline (candidate eligibility + validation).
//
// SERVER-ONLY. This module composes the frozen B2b-i building blocks:
//
//   claimed receipt
//     → source loader (authorization-safe DTO)
//     → deterministic extractor (candidates)
//     → per-candidate validation (Zod)
//     → visibility/sensitivity gate
//     → entity resolution (RLS-scoped)
//     → returns a ProcessedCandidate[] (resolved + rejected)
//
// PERSISTENCE IS INTENTIONALLY EXCLUDED IN THIS SUB-TURN.
// The pipeline never writes to memory tables, never mutates lifecycle, never
// calls model providers, and never accepts a merge outcome from the caller.
// Turn B2b-ii wires the persistence RPC that consumes ProcessedCandidate[]
// under a claim-token guarded transaction.

import type { SupabaseClient } from "@supabase/supabase-js";
import { validateCandidate, type RelationshipMemoryCandidate } from "./candidate";
import { assertSourceDomainEligible, assertSourceRefNotBlocked } from "./eligibility";
import { RelationshipMemoryError } from "./errors";
import { RELATIONSHIP_MEMORY_EXTRACTION_LIMITS, getExtractor } from "./extractor-registry";
import { runDeterministicExtractor } from "./extractors";
import type { ExtractionReceiptDTO } from "./receipts.server";
import { loadSourceForReceipt } from "./source-loaders.server";
import { resolveSubject } from "./entity-resolution.server";
import type { SafeSourceDTO } from "./source-dtos";

type Sb = SupabaseClient<any, any, any>;

const SENS_ORDER: Record<string, number> = {
  public_ok: 0,
  standard: 1,
  sensitive: 2,
  restricted: 3,
};

function isWithinCeiling(candidateSensitivity: string, ceiling: string): boolean {
  return (SENS_ORDER[candidateSensitivity] ?? 99) <= (SENS_ORDER[ceiling] ?? -1);
}

export interface ProcessedCandidate {
  candidate: RelationshipMemoryCandidate;
  /** After entity resolution, subjectRef is guaranteed canonical. */
  resolvedSubjectRef: string;
}

export interface RejectedCandidate {
  reason: string;
  code: string;
  subjectHint: string;
}

export interface PipelineResult {
  source: SafeSourceDTO;
  processed: ProcessedCandidate[];
  rejected: RejectedCandidate[];
  /** Whether any candidate was dropped for a candidate-level reason.
   *  Consumed by the worker to decide completed vs. partial. */
  hadPartialFailure: boolean;
}

export interface PipelineOptions {
  /** Cap emitted candidates for this run. Defaults to per-source limit. */
  maxCandidates?: number;
  /** Max sensitivity a candidate may claim after ceiling enforcement.
   *  Defaults to the extractor's declared visibility ceiling. */
  maxSensitivity?: "public_ok" | "standard" | "sensitive" | "restricted";
}

/**
 * Run the full candidate pipeline for a single claimed receipt.
 * DOES NOT PERSIST. Callers (worker / persistence RPC in B2b-ii) receive
 * a validated, resolved candidate list ready for merge classification.
 */
export async function runExtractionPipeline(
  sb: Sb,
  receipt: ExtractionReceiptDTO,
  opts: PipelineOptions = {},
): Promise<PipelineResult> {
  assertSourceDomainEligible(receipt.sourceDomain);
  assertSourceRefNotBlocked(`${receipt.sourceDomain}/${receipt.sourceRecordId}`);

  const def = getExtractor(receipt.extractorId);
  if (!def) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EXTRACTOR_NOT_FOUND",
      `Unknown extractor '${receipt.extractorId}'`,
    );
  }

  const source = await loadSourceForReceipt(sb, receipt);

  const rawCandidates = runDeterministicExtractor(receipt.extractorId, source);
  const perSourceCap = Math.min(
    opts.maxCandidates ?? def.maxCandidates,
    def.maxCandidates,
    RELATIONSHIP_MEMORY_EXTRACTION_LIMITS.MAX_CANDIDATES_PER_SOURCE,
  );
  const ceiling = opts.maxSensitivity ?? def.sourceVisibilityCeiling;

  const bounded = rawCandidates.slice(0, perSourceCap);
  const processed: ProcessedCandidate[] = [];
  const rejected: RejectedCandidate[] = [];

  for (const raw of bounded) {
    // 1. Candidate contract validation (Zod, deterministic).
    let candidate: RelationshipMemoryCandidate;
    try {
      candidate = validateCandidate(raw);
    } catch (err) {
      rejected.push(rejectFrom(err, raw.subjectRef, "candidate_invalid"));
      continue;
    }

    // 2. Extractor id/version integrity (defense-in-depth).
    if (
      candidate.extractorId !== def.extractorId ||
      candidate.extractorVersion !== def.extractorVersion
    ) {
      rejected.push({
        code: "RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID",
        reason: "extractor identity mismatch",
        subjectHint: candidate.subjectRef,
      });
      continue;
    }

    // 3. Memory kind must be on the extractor's allowlist.
    if (!def.allowedMemoryKinds.includes(candidate.memoryKind)) {
      rejected.push({
        code: "RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID",
        reason: `memory kind '${candidate.memoryKind}' not allowed for extractor`,
        subjectHint: candidate.subjectRef,
      });
      continue;
    }

    // 4. Source domain identity: candidate must match source.
    if (candidate.sourceDomain !== source.sourceDomain) {
      rejected.push({
        code: "RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID",
        reason: "source domain mismatch",
        subjectHint: candidate.subjectRef,
      });
      continue;
    }

    // 5. Visibility ceiling gate — never broaden past extractor declaration.
    if (!isWithinCeiling(candidate.visibilityClass, ceiling)) {
      rejected.push({
        code: "RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID",
        reason: `visibility '${candidate.visibilityClass}' exceeds ceiling '${ceiling}'`,
        subjectHint: candidate.subjectRef,
      });
      continue;
    }

    // 6. Entity resolution — unresolved subject cannot activate memory.
    let resolvedRef: string;
    try {
      const res = await resolveSubject(sb, receipt.ownerUserId, {
        subjectType: candidate.subjectType,
        candidateRef: candidate.subjectRef,
        scopeType: candidate.scopeType,
        scopeRecordId: candidate.scopeRecordId,
      });
      resolvedRef = res.subjectRef;
    } catch (err) {
      rejected.push(rejectFrom(err, candidate.subjectRef, "entity_unresolved"));
      continue;
    }

    processed.push({
      candidate: Object.freeze({ ...candidate, subjectResolved: true }),
      resolvedSubjectRef: resolvedRef,
    });
  }

  return {
    source,
    processed,
    rejected,
    hadPartialFailure: rejected.length > 0 && processed.length > 0,
  };
}

function rejectFrom(err: unknown, subject: string, reasonHint: string): RejectedCandidate {
  if (err instanceof RelationshipMemoryError) {
    return { code: err.code, reason: err.message, subjectHint: subject };
  }
  return {
    code: "RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID",
    reason: `${reasonHint}: ${(err as Error)?.message ?? "unknown"}`,
    subjectHint: subject,
  };
}

// BC-9.1 Turn B2b-iii — End-to-end deterministic extraction worker.
//
// SERVER-ONLY. Not exported from the client-safe barrel. Composes the frozen
// B2b building blocks:
//
//   1. claim receipts via B2a claim-token RPC (SKIP LOCKED)
//   2. per receipt: load safe source (RLS/authority) → deterministic extractor
//      → validate + resolve candidates (pipeline)
//   3. per validated+resolved candidate: applyRelationshipMemoryCandidate (RPC)
//   4. aggregate deterministic outcome counters
//   5. classify final receipt status (completed | partial | failed | skipped)
//   6. finalize with claim-token guarded RPC
//   7. emit safe metrics/events/audit; continue with the next receipt
//
// The worker NEVER opens its own DB transaction, NEVER calls model providers,
// NEVER mutates canonical business tables, and NEVER trusts caller-supplied
// counters or ownership. All authority derives from the receipt row inside
// the persistence RPC.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RELATIONSHIP_MEMORY_EXTRACTION_LIMITS,
  getExtractor,
  isKnownExtractor,
} from "./extractor-registry";
import { assertSourceDomainEligible, assertSourceRefNotBlocked } from "./eligibility";
import { ExtractionReceiptRepository, type ClaimedExtractionReceipt } from "./receipts.server";
import { RelationshipMemoryError } from "./errors";
import { runExtractionPipeline, type PipelineResult } from "./extraction-pipeline.server";
import { applyRelationshipMemoryCandidate } from "./apply-candidate.server";
import type { RelationshipMemoryApplyResultDTO } from "./apply-result-dto";

type Sb = SupabaseClient<any, any, any>;

// ---------------------------------------------------------------------------
// Counters + outcomes
// ---------------------------------------------------------------------------

export interface WorkerCounters {
  extractedCount: number;
  validatedCount: number;
  createdCount: number;
  duplicateCount: number;
  supportedCount: number;
  enrichedCount: number;
  conflictCount: number;
  supersededCount: number;
  rejectedCount: number;
  skippedCount: number;
  failedCount: number;
}

export type WorkerReceiptStatus = "completed" | "partial" | "failed" | "skipped";

export interface WorkerReceiptOutcome {
  receiptId: string;
  sourceDomain: string;
  extractorId: string;
  extractorVersion: string;
  status: WorkerReceiptStatus;
  attempt: number;
  errorCode: string | null;
  retryable: boolean;
  durationBucketMs: number;
  counters: WorkerCounters;
}

export interface WorkerRunResult {
  claimed: number;
  completed: number;
  partial: number;
  failed: number;
  skipped: number;
  totalCandidates: number;
  budgetExhausted: boolean;
  durationMs: number;
  outcomes: WorkerReceiptOutcome[];
}

// ---------------------------------------------------------------------------
// Retry/status classification (frozen error → outcome mapping)
// ---------------------------------------------------------------------------

/** Deterministic source-condition errors → receipt.status = 'skipped'. */
const NON_RETRYABLE_SKIP = new Set<string>([
  "RELATIONSHIP_MEMORY_EXCLUDED_SOURCE",
  "RELATIONSHIP_MEMORY_SOURCE_NOT_FOUND",
  "RELATIONSHIP_MEMORY_SOURCE_FORBIDDEN",
  "RELATIONSHIP_MEMORY_SOURCE_STALE",
  "RELATIONSHIP_MEMORY_EXTRACTOR_NOT_FOUND",
]);

/** Deterministic content errors → non-retryable, receipt = failed w/o retry. */
const NON_RETRYABLE_FAIL = new Set<string>([
  "RELATIONSHIP_MEMORY_CANDIDATE_INVALID",
  "RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID",
  "RELATIONSHIP_MEMORY_INVALID_MERGE",
  "RELATIONSHIP_MEMORY_UNKNOWN_KIND",
  "RELATIONSHIP_MEMORY_UNKNOWN_SUBJECT",
  "RELATIONSHIP_MEMORY_VISIBILITY_ESCALATION",
  "RELATIONSHIP_MEMORY_SENSITIVITY_DOWNGRADE",
  "RELATIONSHIP_MEMORY_SUPERSESSION_NOT_ALLOWED",
]);

/** Transient/infra errors → retryable. */
const RETRYABLE = new Set<string>([
  "RELATIONSHIP_MEMORY_INTERNAL_ERROR",
  "RELATIONSHIP_MEMORY_RECEIPT_CLAIM_CONFLICT",
  "RELATIONSHIP_MEMORY_VERSION_CONFLICT",
  "RELATIONSHIP_MEMORY_PERSISTENCE_CONFLICT",
  "RELATIONSHIP_MEMORY_PROVENANCE_CONFLICT",
  "RELATIONSHIP_MEMORY_LINK_CONFLICT",
]);

/** Special: stale claim — do NOT overwrite; leave lease to expire. */
const STALE_CLAIM = "RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM";

export function classifyReceiptFailure(code: string): {
  status: WorkerReceiptStatus;
  retryable: boolean;
} {
  if (NON_RETRYABLE_SKIP.has(code)) return { status: "skipped", retryable: false };
  if (NON_RETRYABLE_FAIL.has(code)) return { status: "failed", retryable: false };
  if (RETRYABLE.has(code)) return { status: "failed", retryable: true };
  // Unknown → conservative retryable failure so infra hiccups aren't permanent.
  return { status: "failed", retryable: true };
}

// ---------------------------------------------------------------------------
// Safe events
// ---------------------------------------------------------------------------

export type WorkerEventKind =
  | "relationship_memory_extraction_started"
  | "relationship_memory_extraction_completed"
  | "relationship_memory_extraction_partial"
  | "relationship_memory_extraction_failed"
  | "relationship_memory_extraction_skipped";

export interface WorkerEvent {
  kind: WorkerEventKind;
  receiptRef: { id: string };
  sourceDomain: string;
  extractorId: string;
  extractorVersion: string;
  attempt: number;
  errorCode: string | null;
  durationBucketMs: number;
  counters?: WorkerCounters;
}

export type WorkerEventEmitter = (evt: WorkerEvent) => void | Promise<void>;

const FORBIDDEN_EVENT_KEYS = new Set([
  "ownerUserId",
  "owner_user_id",
  "tenantId",
  "claimToken",
  "claim_token",
  "canonicalText",
  "structuredValue",
  "snippet",
  "sourceRecordId",
  "source_record_id",
]);

/** Runtime guard: prevents PII/authority from ever entering an emitted event. */
export function assertSafeWorkerEvent(evt: Record<string, unknown>): void {
  for (const k of Object.keys(evt)) {
    if (FORBIDDEN_EVENT_KEYS.has(k)) {
      throw new Error(`assertSafeWorkerEvent: forbidden key '${k}'`);
    }
  }
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface WorkerRunOptions {
  extractorId: string;
  batchLimit?: number;
  /** Fixed wall-clock budget per tick (default 25s). */
  wallClockBudgetMs?: number;
  /** Optional structural test/audit hook — receives privacy-safe events only. */
  emit?: WorkerEventEmitter;

  // Test/DI seams — production callers omit these.
  __pipeline?: typeof runExtractionPipeline;
  __apply?: typeof applyRelationshipMemoryCandidate;
  __repo?: typeof ExtractionReceiptRepository;
}

const DEFAULT_BUDGET_MS = 25_000;

function bucket(ms: number): number {
  // Coarse buckets to keep metrics low-cardinality.
  if (ms < 250) return 250;
  if (ms < 1_000) return 1_000;
  if (ms < 5_000) return 5_000;
  if (ms < 15_000) return 15_000;
  return 60_000;
}

function emptyCounters(): WorkerCounters {
  return {
    extractedCount: 0,
    validatedCount: 0,
    createdCount: 0,
    duplicateCount: 0,
    supportedCount: 0,
    enrichedCount: 0,
    conflictCount: 0,
    supersededCount: 0,
    rejectedCount: 0,
    skippedCount: 0,
    failedCount: 0,
  };
}

function tallyApplyOutcome(
  counters: WorkerCounters,
  outcome: RelationshipMemoryApplyResultDTO["outcome"],
): void {
  switch (outcome) {
    case "creates_new":
      counters.createdCount += 1;
      break;
    case "duplicate":
      counters.duplicateCount += 1;
      break;
    case "supports_existing":
      counters.supportedCount += 1;
      break;
    case "enriches_existing":
      counters.enrichedCount += 1;
      break;
    case "conflicts_existing":
      counters.conflictCount += 1;
      break;
    case "superseded":
      counters.supersededCount += 1;
      break;
  }
}

// ---------------------------------------------------------------------------
// Main entrypoint
// ---------------------------------------------------------------------------

export async function runExtractionWorkerOnce(
  sb: Sb,
  opts: WorkerRunOptions,
): Promise<WorkerRunResult> {
  if (!isKnownExtractor(opts.extractorId)) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_UNKNOWN_EXTRACTOR",
      `Unknown extractor: ${opts.extractorId}`,
    );
  }
  const def = getExtractor(opts.extractorId)!;
  assertSourceDomainEligible(def.sourceDomain);

  const pipeline = opts.__pipeline ?? runExtractionPipeline;
  const apply = opts.__apply ?? applyRelationshipMemoryCandidate;
  const repo = opts.__repo ?? ExtractionReceiptRepository;
  const emit = opts.emit;
  const budgetMs = opts.wallClockBudgetMs ?? DEFAULT_BUDGET_MS;
  const startedAt = Date.now();
  const deadline = startedAt + budgetMs;

  const limit = Math.min(
    opts.batchLimit ?? RELATIONSHIP_MEMORY_EXTRACTION_LIMITS.MAX_SOURCES_PER_CLAIM,
    RELATIONSHIP_MEMORY_EXTRACTION_LIMITS.MAX_SOURCES_PER_CLAIM,
  );

  const claims = await repo.claimBatch(sb, opts.extractorId, limit);

  const result: WorkerRunResult = {
    claimed: claims.length,
    completed: 0,
    partial: 0,
    failed: 0,
    skipped: 0,
    totalCandidates: 0,
    budgetExhausted: false,
    durationMs: 0,
    outcomes: [],
  };

  let batchCandidateBudget: number = RELATIONSHIP_MEMORY_EXTRACTION_LIMITS.MAX_CANDIDATES_PER_BATCH;

  for (const receipt of claims) {
    if (Date.now() >= deadline) {
      // Budget exhausted — leave remaining claims to lease-expire safely.
      // A stale worker's finalize would be rejected by the claim-token RPC.
      result.budgetExhausted = true;
      break;
    }
    const outcome = await processOneReceipt({
      sb,
      receipt,
      def,
      pipeline,
      apply,
      repo,
      emit,
      batchCandidateBudget,
    });
    // Update remaining batch budget from actual validated count.
    batchCandidateBudget = Math.max(0, batchCandidateBudget - outcome.counters.validatedCount);
    result.outcomes.push(outcome);
    result.totalCandidates += outcome.counters.validatedCount;
    switch (outcome.status) {
      case "completed":
        result.completed += 1;
        break;
      case "partial":
        result.partial += 1;
        break;
      case "failed":
        result.failed += 1;
        break;
      case "skipped":
        result.skipped += 1;
        break;
    }
  }

  result.durationMs = Date.now() - startedAt;
  return result;
}

interface ProcessArgs {
  sb: Sb;
  receipt: ClaimedExtractionReceipt;
  def: ReturnType<typeof getExtractor> & object;
  pipeline: typeof runExtractionPipeline;
  apply: typeof applyRelationshipMemoryCandidate;
  repo: typeof ExtractionReceiptRepository;
  emit?: WorkerEventEmitter;
  batchCandidateBudget: number;
}

async function processOneReceipt(args: ProcessArgs): Promise<WorkerReceiptOutcome> {
  const { sb, receipt, def, pipeline, apply, repo, emit, batchCandidateBudget } = args;
  const startedAt = Date.now();
  const counters = emptyCounters();
  const outcomeBase = {
    receiptId: receipt.id,
    sourceDomain: receipt.sourceDomain,
    extractorId: receipt.extractorId,
    extractorVersion: receipt.extractorVersion,
    attempt: receipt.attemptCount + 1,
  };

  const safeEmit = async (
    kind: WorkerEventKind,
    errorCode: string | null,
    durationBucketMs: number,
  ) => {
    if (!emit) return;
    const evt: WorkerEvent = {
      kind,
      receiptRef: { id: receipt.id },
      sourceDomain: receipt.sourceDomain,
      extractorId: receipt.extractorId,
      extractorVersion: receipt.extractorVersion,
      attempt: outcomeBase.attempt,
      errorCode,
      durationBucketMs,
      counters: { ...counters },
    };
    assertSafeWorkerEvent(evt as unknown as Record<string, unknown>);
    await emit(evt);
  };

  try {
    // Defense-in-depth (RPC already enforces these).
    assertSourceDomainEligible(receipt.sourceDomain);
    assertSourceRefNotBlocked(`${receipt.sourceDomain}/${receipt.sourceRecordId}`);

    await safeEmit("relationship_memory_extraction_started", null, bucket(0));

    // 1. Source + extractor + validation + resolution (no persistence).
    const pipelineResult: PipelineResult = await withTimeout(
      () =>
        pipeline(sb, receipt, {
          maxCandidates: Math.min(def.maxCandidates, batchCandidateBudget),
          maxSensitivity: def.sourceVisibilityCeiling,
        }),
      def.timeoutMs,
    );

    counters.extractedCount = pipelineResult.processed.length + pipelineResult.rejected.length;
    counters.validatedCount = pipelineResult.processed.length;
    counters.rejectedCount = pipelineResult.rejected.length;

    // 2. Per-candidate persistence — independent per candidate.
    for (const p of pipelineResult.processed) {
      try {
        const applyResult = await apply(sb, {
          receiptId: receipt.id,
          claimToken: receipt.claimToken,
          extractorId: def.extractorId,
          extractorVersion: def.extractorVersion,
          candidate: p.candidate,
        });
        tallyApplyOutcome(counters, applyResult.outcome);
      } catch (err) {
        const code =
          err instanceof RelationshipMemoryError ? err.code : "RELATIONSHIP_MEMORY_INTERNAL_ERROR";
        if (code === STALE_CLAIM) {
          // Stale claim — a newer worker owns the receipt. Do NOT finalize.
          const dur = bucket(Date.now() - startedAt);
          await safeEmit("relationship_memory_extraction_failed", STALE_CLAIM, dur);
          return {
            ...outcomeBase,
            status: "failed",
            errorCode: STALE_CLAIM,
            retryable: false,
            durationBucketMs: dur,
            counters,
          };
        }
        counters.failedCount += 1;
      }
    }

    // 3. Deterministic status classification.
    const anyMaterialSuccess =
      counters.createdCount +
        counters.duplicateCount +
        counters.supportedCount +
        counters.enrichedCount +
        counters.conflictCount +
        counters.supersededCount >
      0;
    const anyCandidateFailure = counters.failedCount > 0 || counters.rejectedCount > 0;

    if (counters.validatedCount === 0 && counters.rejectedCount === 0) {
      // Extractor had nothing eligible to emit for this source.
      const dur = bucket(Date.now() - startedAt);
      await repo.markSkipped(sb, receipt.id, receipt.claimToken, "no eligible candidates");
      await safeEmit("relationship_memory_extraction_skipped", null, dur);
      return {
        ...outcomeBase,
        status: "skipped",
        errorCode: null,
        retryable: false,
        durationBucketMs: dur,
        counters,
      };
    }

    if (anyMaterialSuccess && anyCandidateFailure) {
      const dur = bucket(Date.now() - startedAt);
      await repo.markCompleted(sb, receipt.id, receipt.claimToken, counters.validatedCount, true);
      await safeEmit("relationship_memory_extraction_partial", null, dur);
      return {
        ...outcomeBase,
        status: "partial",
        errorCode: null,
        retryable: false,
        durationBucketMs: dur,
        counters,
      };
    }

    if (!anyMaterialSuccess) {
      // Every candidate failed → treat as failure, retryable (worker candidate
      // failures were transient/unclassified).
      const dur = bucket(Date.now() - startedAt);
      await repo.markFailed(sb, receipt.id, receipt.claimToken, "all candidates failed");
      await safeEmit(
        "relationship_memory_extraction_failed",
        "RELATIONSHIP_MEMORY_INTERNAL_ERROR",
        dur,
      );
      return {
        ...outcomeBase,
        status: "failed",
        errorCode: "RELATIONSHIP_MEMORY_INTERNAL_ERROR",
        retryable: true,
        durationBucketMs: dur,
        counters,
      };
    }

    const dur = bucket(Date.now() - startedAt);
    await repo.markCompleted(sb, receipt.id, receipt.claimToken, counters.validatedCount, false);
    await safeEmit("relationship_memory_extraction_completed", null, dur);
    return {
      ...outcomeBase,
      status: "completed",
      errorCode: null,
      retryable: false,
      durationBucketMs: dur,
      counters,
    };
  } catch (err) {
    const code =
      err instanceof RelationshipMemoryError ? err.code : "RELATIONSHIP_MEMORY_INTERNAL_ERROR";
    const dur = bucket(Date.now() - startedAt);

    if (code === STALE_CLAIM) {
      await safeEmit("relationship_memory_extraction_failed", STALE_CLAIM, dur);
      return {
        ...outcomeBase,
        status: "failed",
        errorCode: STALE_CLAIM,
        retryable: false,
        durationBucketMs: dur,
        counters,
      };
    }

    const cls = classifyReceiptFailure(code);
    try {
      if (cls.status === "skipped") {
        await repo.markSkipped(sb, receipt.id, receipt.claimToken, code);
        await safeEmit("relationship_memory_extraction_skipped", code, dur);
      } else {
        await repo.markFailed(sb, receipt.id, receipt.claimToken, code);
        await safeEmit("relationship_memory_extraction_failed", code, dur);
      }
    } catch {
      // Finalization itself failed — leave lease to expire; do not throw
      // out of the worker for a single receipt.
    }
    return {
      ...outcomeBase,
      status: cls.status,
      errorCode: code,
      retryable: cls.retryable,
      durationBucketMs: dur,
      counters,
    };
  }
}

async function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Extractor timed out after ${ms}ms`)), ms),
    ),
  ]);
}

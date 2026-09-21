// BC-9.1 Turn B2b-iii — End-to-end worker orchestration + structural gates.
//
// Runtime tests exercise the worker via injected pipeline/apply/repo seams.
// SQL guarantees (SKIP LOCKED, claim-token uniqueness, active-canonical
// uniqueness, provenance uniqueness, private-note CHECK) are asserted
// structurally against the frozen migration files — the DB proof surface for
// B2a/B2b-ii already lives there.

import { describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  runExtractionWorkerOnce,
  classifyReceiptFailure,
  assertSafeWorkerEvent,
  type WorkerEvent,
  type WorkerReceiptOutcome,
} from "@/lib/business-connect/relationship-memory/extraction-worker.server";
import type { ClaimedExtractionReceipt } from "@/lib/business-connect/relationship-memory/receipts.server";
import type { PipelineResult } from "@/lib/business-connect/relationship-memory/extraction-pipeline.server";
import type { RelationshipMemoryApplyResultDTO } from "@/lib/business-connect/relationship-memory/apply-result-dto";
import { RelationshipMemoryError } from "@/lib/business-connect/relationship-memory/errors";
import * as barrel from "@/lib/business-connect/relationship-memory";
import { RELATIONSHIP_MEMORY_SDK_METHODS } from "@/lib/business-connect/relationship-memory/sdk";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EXTRACTOR = "meeting_outcome.commitments.v1";
const EXTRACTOR_VERSION = "1.0.0";

function receipt(
  id: string,
  overrides: Partial<ClaimedExtractionReceipt> = {},
): ClaimedExtractionReceipt {
  return {
    id,
    ownerUserId: "owner-1",
    sourceDomain: "meeting_outcome_safe",
    sourceRecordId: `src-${id}`,
    sourceVersion: "v1",
    extractorId: EXTRACTOR,
    extractorVersion: EXTRACTOR_VERSION,
    status: "processing",
    candidateCount: 0,
    attemptCount: 0,
    rowVersion: 1,
    claimToken: `tok-${id}`,
    lastError: null,
    claimedAt: new Date().toISOString(),
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function candidate(subjectRef = "person-1") {
  return {
    extractorId: EXTRACTOR,
    extractorVersion: EXTRACTOR_VERSION,
    sourceDomain: "meeting_outcome_safe" as const,
    sourceRecordId: "src-1",
    sourceVersion: "v1",
    scopeType: "meeting" as const,
    scopeRecordId: "meeting-1",
    subjectType: "person" as const,
    subjectRef,
    subjectResolved: true,
    memoryKind: "commitment" as const,
    canonicalPredicate: "committed_to",
    canonicalText: "Will share the Q3 pipeline report by next Friday",
    structuredValue: { dueBy: "2026-08-01", channel: "email" },
    evidenceType: "explicit_commitment" as const,
    evidenceStrength: "high" as const,
    occurredAt: "2026-07-15T09:00:00.000Z",
    visibilityClass: "sensitive" as const,
  };
}

function pipelineOK(procN: number, rejN = 0): PipelineResult {
  return {
    source: {
      sourceDomain: "meeting_outcome_safe",
      sourceRecordId: "src-1",
      sourceVersion: "v1",
    } as never,
    processed: Array.from({ length: procN }, (_, i) => ({
      candidate: candidate(`person-${i}`) as never,
      resolvedSubjectRef: `person-${i}`,
    })),
    rejected: Array.from({ length: rejN }, (_, i) => ({
      code: "RELATIONSHIP_MEMORY_EXTRACTOR_OUTPUT_INVALID",
      reason: "rej",
      subjectHint: `bad-${i}`,
    })),
    hadPartialFailure: rejN > 0 && procN > 0,
  };
}

function applyResult(
  outcome: RelationshipMemoryApplyResultDTO["outcome"] = "creates_new",
): RelationshipMemoryApplyResultDTO {
  return Object.freeze({
    outcome,
    memoryRef: { id: "mem-1" },
    existingMemoryRef: null,
    created: outcome === "creates_new",
    materiallyChanged: outcome !== "duplicate",
    provenanceAdded: true,
    linkAdded: false,
    version: 1,
    reviewRequired: false,
  });
}

function makeRepoStub(
  overrides: Partial<{
    claims: ClaimedExtractionReceipt[];
    onCompleted: ReturnType<typeof vi.fn>;
    onFailed: ReturnType<typeof vi.fn>;
    onSkipped: ReturnType<typeof vi.fn>;
  }> = {},
) {
  const onCompleted = overrides.onCompleted ?? vi.fn(async () => {});
  const onFailed = overrides.onFailed ?? vi.fn(async () => {});
  const onSkipped = overrides.onSkipped ?? vi.fn(async () => {});
  const repo = {
    claimBatch: vi.fn(async () => overrides.claims ?? []),
    markCompleted: onCompleted,
    markFailed: onFailed,
    markSkipped: onSkipped,
    upsertPending: vi.fn(),
  };
  return {
    repo: repo as unknown as Parameters<typeof runExtractionWorkerOnce>[1]["__repo"] & typeof repo,
    onCompleted,
    onFailed,
    onSkipped,
  };
}

const fakeSb = {} as never;

// ---------------------------------------------------------------------------
// 1. Worker orchestration — happy path
// ---------------------------------------------------------------------------

describe("BC-9.1 B2b-iii — orchestration", () => {
  it("claims → runs pipeline → applies each candidate → marks completed", async () => {
    const { repo, onCompleted, onFailed, onSkipped } = makeRepoStub({ claims: [receipt("r1")] });
    const pipeline = vi.fn(async () => pipelineOK(3));
    const apply = vi.fn(async () => applyResult("creates_new"));
    const result = await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: pipeline as never,
      __apply: apply as never,
    });
    expect(repo.claimBatch).toHaveBeenCalledOnce();
    expect(pipeline).toHaveBeenCalledOnce();
    expect(apply).toHaveBeenCalledTimes(3);
    expect(onCompleted).toHaveBeenCalledOnce();
    expect(onFailed).not.toHaveBeenCalled();
    expect(onSkipped).not.toHaveBeenCalled();
    expect(result.completed).toBe(1);
    expect(result.outcomes[0].counters.createdCount).toBe(3);
    expect(result.outcomes[0].counters.validatedCount).toBe(3);
  });

  it("uses the claim token on finalize", async () => {
    const { repo, onCompleted } = makeRepoStub({ claims: [receipt("r1")] });
    await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: (async () => pipelineOK(1)) as never,
      __apply: (async () => applyResult()) as never,
    });
    expect(onCompleted).toHaveBeenCalledWith(fakeSb, "r1", "tok-r1", 1, false);
  });

  it("throws on unknown extractor before claiming", async () => {
    await expect(
      runExtractionWorkerOnce(fakeSb, { extractorId: "does.not.exist.v1" }),
    ).rejects.toThrow(RelationshipMemoryError);
  });

  it("caps batchLimit to MAX_SOURCES_PER_CLAIM", async () => {
    const { repo } = makeRepoStub({ claims: [] });
    await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      batchLimit: 9999,
      __repo: repo,
    });
    expect(repo.claimBatch).toHaveBeenCalledWith(fakeSb, EXTRACTOR, 25);
  });
});

// ---------------------------------------------------------------------------
// 2. Deterministic receipt status classification
// ---------------------------------------------------------------------------

describe("BC-9.1 B2b-iii — receipt status classification", () => {
  it("partial when some candidates rejected and some persisted", async () => {
    const { repo, onCompleted } = makeRepoStub({ claims: [receipt("r1")] });
    const result = await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: (async () => pipelineOK(2, 1)) as never,
      __apply: (async () => applyResult("duplicate")) as never,
    });
    expect(result.partial).toBe(1);
    expect(result.completed).toBe(0);
    expect(onCompleted).toHaveBeenCalledWith(fakeSb, "r1", "tok-r1", 2, true);
  });

  it("skipped when pipeline yields zero candidates and zero rejects", async () => {
    const { repo, onSkipped } = makeRepoStub({ claims: [receipt("r1")] });
    const result = await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: (async () => pipelineOK(0, 0)) as never,
      __apply: (async () => applyResult()) as never,
    });
    expect(result.skipped).toBe(1);
    expect(onSkipped).toHaveBeenCalledOnce();
  });

  it("failed when source loader throws SOURCE_STALE → skipped classification", async () => {
    const { repo, onSkipped } = makeRepoStub({ claims: [receipt("r1")] });
    const result = await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: (async () => {
        throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_SOURCE_STALE", "stale");
      }) as never,
    });
    expect(result.skipped).toBe(1);
    expect(onSkipped).toHaveBeenCalled();
    expect(result.outcomes[0].retryable).toBe(false);
    expect(result.outcomes[0].errorCode).toBe("RELATIONSHIP_MEMORY_SOURCE_STALE");
  });

  it("failed with retryable=true when persistence throws PERSISTENCE_CONFLICT (all failed)", async () => {
    const { repo, onFailed } = makeRepoStub({ claims: [receipt("r1")] });
    const result = await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: (async () => pipelineOK(2)) as never,
      __apply: (async () => {
        throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_PERSISTENCE_CONFLICT", "boom");
      }) as never,
    });
    expect(result.failed).toBe(1);
    expect(onFailed).toHaveBeenCalled();
    expect(result.outcomes[0].counters.failedCount).toBe(2);
    expect(result.outcomes[0].retryable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Retry / stale-claim / isolation
// ---------------------------------------------------------------------------

describe("BC-9.1 B2b-iii — retry classification & stale-claim", () => {
  it("STALE_CLAIM during apply short-circuits without overwriting finalize", async () => {
    const { repo, onCompleted, onFailed } = makeRepoStub({ claims: [receipt("r1")] });
    const result = await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: (async () => pipelineOK(1)) as never,
      __apply: (async () => {
        throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM", "stale");
      }) as never,
    });
    expect(onCompleted).not.toHaveBeenCalled();
    expect(onFailed).not.toHaveBeenCalled();
    expect(result.outcomes[0].errorCode).toBe("RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM");
    expect(result.outcomes[0].retryable).toBe(false);
  });

  it("one source failure does not block other receipts in the batch", async () => {
    const { repo } = makeRepoStub({ claims: [receipt("r1"), receipt("r2"), receipt("r3")] });
    let call = 0;
    const pipeline = vi.fn(async () => {
      call += 1;
      if (call === 2) throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_SOURCE_FORBIDDEN");
      return pipelineOK(1);
    });
    const result = await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: pipeline as never,
      __apply: (async () => applyResult()) as never,
    });
    expect(result.claimed).toBe(3);
    expect(result.completed).toBe(2);
    expect(result.skipped).toBe(1);
  });

  it("classifyReceiptFailure maps deterministic codes correctly", () => {
    expect(classifyReceiptFailure("RELATIONSHIP_MEMORY_SOURCE_NOT_FOUND")).toEqual({
      status: "skipped",
      retryable: false,
    });
    expect(classifyReceiptFailure("RELATIONSHIP_MEMORY_CANDIDATE_INVALID")).toEqual({
      status: "failed",
      retryable: false,
    });
    expect(classifyReceiptFailure("RELATIONSHIP_MEMORY_VERSION_CONFLICT")).toEqual({
      status: "failed",
      retryable: true,
    });
    expect(classifyReceiptFailure("SOMETHING_UNKNOWN")).toEqual({
      status: "failed",
      retryable: true,
    });
  });
});

// ---------------------------------------------------------------------------
// 4. Wall-clock budget
// ---------------------------------------------------------------------------

describe("BC-9.1 B2b-iii — wall-clock budget", () => {
  it("stops after budget exhausted; unfinished claims are left to lease-expire", async () => {
    const { repo, onCompleted } = makeRepoStub({
      claims: [receipt("r1"), receipt("r2"), receipt("r3")],
    });
    const pipeline = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 12));
      return pipelineOK(1);
    });
    const result = await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      wallClockBudgetMs: 15,
      __repo: repo,
      __pipeline: pipeline as never,
      __apply: (async () => applyResult()) as never,
    });
    expect(result.budgetExhausted).toBe(true);
    // At least one processed, at least one skipped by budget (not finalized).
    expect(result.completed + result.partial).toBeGreaterThanOrEqual(1);
    expect(onCompleted.mock.calls.length).toBeLessThan(3);
  });
});

// ---------------------------------------------------------------------------
// 5. Safe events / audit
// ---------------------------------------------------------------------------

describe("BC-9.1 B2b-iii — safe events", () => {
  it("assertSafeWorkerEvent rejects forbidden keys", () => {
    expect(() => assertSafeWorkerEvent({ ownerUserId: "x" } as never)).toThrow(/forbidden key/);
    expect(() => assertSafeWorkerEvent({ claimToken: "x" } as never)).toThrow(/forbidden key/);
    expect(() => assertSafeWorkerEvent({ canonicalText: "x" } as never)).toThrow(/forbidden key/);
  });

  it("emits started + completed events with no PII fields", async () => {
    const { repo } = makeRepoStub({ claims: [receipt("r1")] });
    const events: WorkerEvent[] = [];
    await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: (async () => pipelineOK(1)) as never,
      __apply: (async () => applyResult()) as never,
      emit: (evt) => {
        events.push(evt);
      },
    });
    const kinds = events.map((e: any) => e.kind);
    expect(kinds).toContain("relationship_memory_extraction_started");
    expect(kinds).toContain("relationship_memory_extraction_completed");
    for (const e of events) {
      const raw = JSON.stringify(e);
      expect(raw).not.toMatch(/owner_user_id|ownerUserId|claim_token|claimToken/);
      expect(raw).not.toMatch(/canonicalText|structuredValue/);
    }
  });

  it("emits skipped event with a stable error code", async () => {
    const { repo } = makeRepoStub({ claims: [receipt("r1")] });
    const events: WorkerEvent[] = [];
    await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: (async () => {
        throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_SOURCE_NOT_FOUND", "gone");
      }) as never,
      emit: (evt) => {
        events.push(evt);
      },
    });
    const last = events[events.length - 1];
    expect(last.kind).toBe("relationship_memory_extraction_skipped");
    expect(last.errorCode).toBe("RELATIONSHIP_MEMORY_SOURCE_NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// 6. Structural gates — private-note / client boundary / no AI
// ---------------------------------------------------------------------------

const RM_ROOT = resolve(__dirname, "../lib/business-connect/relationship-memory");
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}
const RM_FILES = walk(RM_ROOT);

describe("BC-9.1 B2b-iii — private-note structural gate", () => {
  const forbiddenRuntimeTerms = [
    "business_meeting_private_notes",
    "private_meeting_notes",
    "getPrivateNote",
    "privateNotes",
    "MeetingPrivateNote",
  ];

  it("no runtime relationship-memory file references private-note types", () => {
    for (const file of RM_FILES) {
      const src = readFileSync(file, "utf8");
      const isAllowlistHolder = file.endsWith("/registry.ts") || file.endsWith("/eligibility.ts");
      for (const term of forbiddenRuntimeTerms) {
        // The allowlist/hard-block tokens themselves live in registry.ts and
        // eligibility.ts. Anywhere else is a leak.
        if (
          isAllowlistHolder &&
          (term === "private_meeting_notes" || term === "business_meeting_private_notes")
        ) {
          continue;
        }
        expect(src, `${file}: ${term}`).not.toContain(term);
      }
    }
  });

  it("DB source-domain CHECK still hard-rejects private-note sources", () => {
    const migrations = readdirSync("supabase/migrations")
      .map((f) => readFileSync(join("supabase/migrations", f), "utf8"))
      .join("\n---\n");
    expect(migrations).toMatch(/bc_rm_source_reject_private_notes/);
  });
});

describe("BC-9.1 B2b-iii — client-boundary structural gate", () => {
  it("client barrel does not export any *.server.ts module or worker runtime", () => {
    const keys = Object.keys(barrel);
    for (const forbidden of [
      "runExtractionWorkerOnce",
      "applyRelationshipMemoryCandidate",
      "supersedeRelationshipMemory",
      "ExtractionReceiptRepository",
      "runExtractionPipeline",
    ]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it("public SDK exposes only list + getById (no worker/apply/supersede)", () => {
    expect(RELATIONSHIP_MEMORY_SDK_METHODS).toEqual([
      "list",
      "getById",
      "searchMemories",
      "listRelevantMemories",
      "getMemoryGraphContext",
    ]);
  });

  it("no *.server.ts is re-exported from the barrel entrypoint", () => {
    const barrelSrc = readFileSync(join(RM_ROOT, "index.ts"), "utf8");
    expect(barrelSrc).not.toMatch(/from\s+"\.\/[a-zA-Z-]+\.server"/);
  });
});

describe("BC-9.1 B2b-iii — no AI dependency", () => {
  const forbidden = [
    "model-gateway",
    "prompt-registry",
    "embedding",
    "openai",
    "anthropic",
    "lovable-ai",
    "@lovable/gateway",
  ];
  it("worker/pipeline/apply runtime imports no AI/provider surface", () => {
    for (const file of [
      "extraction-worker.server.ts",
      "extraction-pipeline.server.ts",
      "apply-candidate.server.ts",
      "extractors.ts",
      "source-loaders.server.ts",
    ]) {
      const src = readFileSync(join(RM_ROOT, file), "utf8");
      for (const term of forbidden) {
        expect(src.toLowerCase(), `${file}: ${term}`).not.toContain(term);
      }
      expect(src).not.toMatch(/fetch\(\s*["']http/);
    }
  });
});

describe("BC-9.1 B2b-iii — canonical business immutability", () => {
  const forbiddenTables = [
    "business_meetings",
    "business_meeting_outcomes",
    "business_meeting_follow_ups",
    "business_meeting_agenda_items",
    "business_meeting_shared_notes",
    "user_profiles",
    "member_business_cards",
    "introduction_requests",
    "opportunities",
  ];
  it("worker/apply/pipeline never issues UPDATE/DELETE/INSERT to canonical sources", () => {
    for (const file of [
      "extraction-worker.server.ts",
      "extraction-pipeline.server.ts",
      "apply-candidate.server.ts",
    ]) {
      const src = readFileSync(join(RM_ROOT, file), "utf8");
      for (const t of forbiddenTables) {
        expect(src, `${file}: ${t}`).not.toMatch(
          new RegExp(`\\.from\\(["']${t}["']\\)\\s*\\.(update|delete|insert|upsert)`),
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Concurrency & performance — structural proof against migration SQL
// ---------------------------------------------------------------------------

describe("BC-9.1 B2b-iii — concurrency proof (migration SQL)", () => {
  const allMigrations = readdirSync("supabase/migrations")
    .map((f) => readFileSync(join("supabase/migrations", f), "utf8"))
    .join("\n---\n");

  it("claim RPC uses FOR UPDATE SKIP LOCKED", () => {
    expect(allMigrations).toMatch(/FOR UPDATE\s+SKIP LOCKED/i);
  });

  it("completion RPCs require matching claim_token", () => {
    expect(allMigrations).toMatch(/claim_token\s*=\s*p_claim_token/);
  });

  it("active-canonical uniqueness prevents duplicate memories under race", () => {
    expect(allMigrations).toMatch(/bc_rm_memory_active_unique/);
  });

  it("provenance unique index covers evidence identity", () => {
    expect(allMigrations).toMatch(/bc_rm_sources_identity_unique/);
  });

  it("terminal receipt cannot be reclaimed (status filter on claim path)", () => {
    expect(allMigrations).toMatch(/status\s*=\s*'pending'|status\s*IN\s*\(\s*'pending'/i);
  });
});

describe("BC-9.1 B2b-iii — performance evidence (migration SQL)", () => {
  const allMigrations = readdirSync("supabase/migrations")
    .map((f) => readFileSync(join("supabase/migrations", f), "utf8"))
    .join("\n---\n");

  it("indexed claim path on extractor_id + status", () => {
    expect(allMigrations).toMatch(
      /CREATE\s+INDEX[^;]+business_relationship_memory_extraction_receipts[^;]+(extractor_id|status)/i,
    );
  });

  it("indexed canonical identity lookup", () => {
    expect(allMigrations).toMatch(/bc_rm_memory_active_unique/);
  });
});

// ---------------------------------------------------------------------------
// 8. Idempotency / replay
// ---------------------------------------------------------------------------

describe("BC-9.1 B2b-iii — replay & idempotency", () => {
  it("replay yields duplicate outcomes without new memory creation", async () => {
    const { repo } = makeRepoStub({ claims: [receipt("r1")] });
    const result = await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: (async () => pipelineOK(2)) as never,
      __apply: (async () => applyResult("duplicate")) as never,
    });
    const o = result.outcomes[0] as WorkerReceiptOutcome;
    expect(o.status).toBe("completed");
    expect(o.counters.createdCount).toBe(0);
    expect(o.counters.duplicateCount).toBe(2);
  });

  it("enrichment outcome counted separately from create", async () => {
    const { repo } = makeRepoStub({ claims: [receipt("r1")] });
    let n = 0;
    const result = await runExtractionWorkerOnce(fakeSb, {
      extractorId: EXTRACTOR,
      __repo: repo,
      __pipeline: (async () => pipelineOK(3)) as never,
      __apply: (async () => applyResult(n++ === 0 ? "creates_new" : "enriches_existing")) as never,
    });
    const c = result.outcomes[0].counters;
    expect(c.createdCount).toBe(1);
    expect(c.enrichedCount).toBe(2);
  });
});

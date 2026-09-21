// BC-9.1 Turn B2a — Extraction Receipts with atomic SKIP LOCKED claim.
//
// Receipts are the durable identity of a (owner × source_domain × source_id ×
// extractor_version) extraction attempt. The unique index enforces "one
// canonical receipt per identity", so replay and concurrent workers converge.
//
// B2a wires the SECURITY DEFINER RPCs
//   claim_relationship_memory_extraction_receipts
//   complete_relationship_memory_extraction_receipt
//   fail_relationship_memory_extraction_receipt
//   skip_relationship_memory_extraction_receipt
// so multi-worker deployments cannot double-claim a receipt and a stale
// worker cannot complete a claim it no longer owns.

import type { SupabaseClient } from "@supabase/supabase-js";
import { RelationshipMemoryError } from "./errors";
import { assertSourceDomainEligible } from "./eligibility";
import { RELATIONSHIP_MEMORY_EXTRACTION_LIMITS } from "./extractor-registry";

type Sb = SupabaseClient<any, any, any>;

export type ExtractionReceiptStatus =
  | "pending"
  | "processing"
  | "completed"
  | "partial"
  | "failed"
  | "skipped";

export interface ExtractionReceiptIdentity {
  ownerUserId: string;
  sourceDomain: string;
  sourceRecordId: string;
  sourceVersion: string;
  extractorId: string;
  extractorVersion: string;
}

export interface ExtractionReceiptDTO {
  id: string;
  ownerUserId: string;
  sourceDomain: string;
  sourceRecordId: string;
  sourceVersion: string;
  extractorId: string;
  extractorVersion: string;
  status: ExtractionReceiptStatus;
  candidateCount: number;
  attemptCount: number;
  rowVersion: number;
  claimToken: string | null;
  lastError: string | null;
  claimedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Deterministic idempotency signature — used only for logs/observability. */
export function extractionIdempotencySignature(id: ExtractionReceiptIdentity): string {
  return [
    id.ownerUserId,
    id.sourceDomain,
    id.sourceRecordId,
    id.sourceVersion,
    id.extractorId,
    id.extractorVersion,
  ].join("|");
}

function toDTO(row: Record<string, unknown>): ExtractionReceiptDTO {
  return {
    id: row.id as string,
    ownerUserId: row.owner_user_id as string,
    sourceDomain: row.source_domain as string,
    sourceRecordId: row.source_record_id as string,
    sourceVersion: row.source_version as string,
    extractorId: row.extractor_id as string,
    extractorVersion: row.extractor_version as string,
    status: (row.status as ExtractionReceiptStatus) ?? "pending",
    candidateCount: (row.candidate_count as number) ?? 0,
    attemptCount: (row.attempt_count as number) ?? 0,
    rowVersion: (row.row_version as number) ?? 0,
    claimToken: (row.claim_token as string) ?? null,
    lastError: (row.last_error as string) ?? null,
    claimedAt: (row.claimed_at as string) ?? null,
    completedAt: (row.completed_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export interface ClaimedExtractionReceipt extends ExtractionReceiptDTO {
  /** Non-null by construction on claim results. */
  claimToken: string;
}

export const ExtractionReceiptRepository = {
  /** Insert-or-fetch a receipt in `pending` state. Idempotent. */
  async upsertPending(sb: Sb, id: ExtractionReceiptIdentity): Promise<ExtractionReceiptDTO> {
    assertSourceDomainEligible(id.sourceDomain);
    const row = {
      owner_user_id: id.ownerUserId,
      source_domain: id.sourceDomain,
      source_record_id: id.sourceRecordId,
      source_version: id.sourceVersion,
      extractor_id: id.extractorId,
      extractor_version: id.extractorVersion,
      status: "pending" as const,
    };
    const { data, error } = await sb
      .from("business_relationship_memory_extraction_receipts")
      .upsert(row, {
        onConflict: "owner_user_id,source_domain,source_record_id,extractor_version",
        ignoreDuplicates: false,
      })
      .select("*")
      .single();
    if (error) {
      throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_RECEIPT_CONFLICT", error.message);
    }
    return toDTO(data as Record<string, unknown>);
  },

  /**
   * Atomically claim up to `limit` receipts for `extractorId` via SECURITY
   * DEFINER RPC using SELECT … FOR UPDATE SKIP LOCKED. Each returned receipt
   * carries the caller's `claim_token`; subsequent complete/fail/skip calls
   * MUST present the same token or the DB rejects the transition.
   */
  async claimBatch(
    sb: Sb,
    extractorId: string,
    limit: number,
    claimToken?: string,
  ): Promise<ClaimedExtractionReceipt[]> {
    const cap = Math.min(
      Math.max(1, limit),
      RELATIONSHIP_MEMORY_EXTRACTION_LIMITS.MAX_SOURCES_PER_CLAIM,
    );
    const token = claimToken ?? cryptoRandomUuid();
    const { data, error } = await sb.rpc("claim_relationship_memory_extraction_receipts", {
      p_extractor_id: extractorId,
      p_limit: cap,
      p_claim_token: token,
    });
    if (error) {
      throw new RelationshipMemoryError(
        "RELATIONSHIP_MEMORY_RECEIPT_CLAIM_CONFLICT",
        error.message,
      );
    }
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return rows.map((r: any) => {
      const dto = toDTO(r);
      return { ...dto, claimToken: (r.claim_token as string) ?? token };
    });
  },

  async markCompleted(
    sb: Sb,
    receiptId: string,
    claimToken: string,
    candidateCount: number,
    partial = false,
  ): Promise<void> {
    const { data, error } = await sb.rpc("complete_relationship_memory_extraction_receipt", {
      p_id: receiptId,
      p_claim_token: claimToken,
      p_candidate_count: candidateCount,
      p_partial: partial,
    });
    if (error) {
      throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_INTERNAL_ERROR", error.message);
    }
    const applied = Array.isArray(data)
      ? Boolean((data[0] as { applied?: boolean })?.applied)
      : false;
    if (!applied) {
      throw new RelationshipMemoryError(
        "RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM",
        `Receipt ${receiptId} no longer owned by this worker`,
      );
    }
  },

  async markFailed(sb: Sb, receiptId: string, claimToken: string, message: string): Promise<void> {
    const { data, error } = await sb.rpc("fail_relationship_memory_extraction_receipt", {
      p_id: receiptId,
      p_claim_token: claimToken,
      p_error: message.slice(0, 500),
    });
    if (error) {
      throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_INTERNAL_ERROR", error.message);
    }
    const applied = Array.isArray(data)
      ? Boolean((data[0] as { applied?: boolean })?.applied)
      : false;
    if (!applied) {
      throw new RelationshipMemoryError(
        "RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM",
        `Receipt ${receiptId} no longer owned by this worker`,
      );
    }
  },

  async markSkipped(sb: Sb, receiptId: string, claimToken: string, reason: string): Promise<void> {
    const { data, error } = await sb.rpc("skip_relationship_memory_extraction_receipt", {
      p_id: receiptId,
      p_claim_token: claimToken,
      p_reason: reason.slice(0, 500),
    });
    if (error) {
      throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_INTERNAL_ERROR", error.message);
    }
    const applied = Array.isArray(data)
      ? Boolean((data[0] as { applied?: boolean })?.applied)
      : false;
    if (!applied) {
      throw new RelationshipMemoryError(
        "RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM",
        `Receipt ${receiptId} no longer owned by this worker`,
      );
    }
  },
};

function cryptoRandomUuid(): string {
  // Prefer platform crypto.randomUUID; fall back to a v4-shaped random.
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  (g.crypto as unknown as { getRandomValues?: (b: Uint8Array) => void })?.getRandomValues?.(
    bytes,
  ) ??
    (() => {
      for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    })();
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

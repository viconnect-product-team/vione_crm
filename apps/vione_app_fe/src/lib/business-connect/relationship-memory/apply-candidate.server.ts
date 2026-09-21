// BC-9.1 Turn B2b-ii — Server-only candidate application service.
//
// This is the SOLE entrypoint for persisting a validated candidate. It calls
// the SECURITY DEFINER RPC `business_relationship_memory_apply_candidate`
// which is granted to `service_role` only. RLS/anon/authenticated CANNOT
// invoke it directly.
//
// Ownership derives from the receipt row inside the RPC — this module never
// accepts an owner argument and never trusts one from the candidate payload.

import type { SupabaseClient } from "@supabase/supabase-js";
import { RelationshipMemoryError } from "./errors";
import type { RelationshipMemoryCandidate } from "./candidate";
import { validateCandidate } from "./candidate";
import { candidateCanonicalKey } from "./normalizers";
import {
  toSafeApplyResult,
  type RelationshipMemoryApplyResultDTO,
  type RelationshipMemoryApplyRpcRow,
} from "./apply-result-dto";

type Sb = SupabaseClient<any, any, any>;

export interface ApplyCandidateInput {
  readonly receiptId: string;
  readonly claimToken: string;
  readonly extractorId: string;
  readonly extractorVersion: string;
  readonly candidate: RelationshipMemoryCandidate;
  /** Required when the outcome is enrichment or supersession. Ignored otherwise. */
  readonly expectedVersion?: number;
}

/**
 * Apply a candidate through the RPC. All merge classification, ownership
 * derivation, provenance persistence and link creation happen inside a single
 * DB transaction. This function does not open a transaction of its own and
 * does not call any external provider.
 */
export async function applyRelationshipMemoryCandidate(
  sb: Sb,
  input: ApplyCandidateInput,
): Promise<RelationshipMemoryApplyResultDTO> {
  const candidate = validateCandidate(input.candidate);
  const canonicalKey = candidateCanonicalKey(
    candidate.memoryKind,
    candidate.canonicalPredicate,
    candidate.canonicalText,
  );
  const payload: Record<string, unknown> = { ...candidate, canonicalKey };
  const { data, error } = await sb.rpc("business_relationship_memory_apply_candidate", {
    p_receipt_id: input.receiptId,
    p_claim_token: input.claimToken,
    p_extractor_id: input.extractorId,
    p_extractor_version: input.extractorVersion,
    p_candidate: payload,
    p_expected_version: input.expectedVersion ?? null,
  });
  if (error) {
    const raw = error.message ?? "";
    if (raw.includes("RELATIONSHIP_MEMORY_")) {
      const code =
        raw.match(/RELATIONSHIP_MEMORY_[A-Z_]+/)?.[0] ?? "RELATIONSHIP_MEMORY_INTERNAL_ERROR";
      throw new RelationshipMemoryError(code as never, raw);
    }
    throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_INTERNAL_ERROR", raw);
  }
  const row = (data ?? {}) as RelationshipMemoryApplyRpcRow;
  return toSafeApplyResult(row);
}

export interface SupersedeInput {
  readonly receiptId: string;
  readonly claimToken: string;
  readonly oldMemoryId: string;
  readonly expectedVersion: number;
  readonly candidate: RelationshipMemoryCandidate;
}

export async function supersedeRelationshipMemory(
  sb: Sb,
  input: SupersedeInput,
): Promise<RelationshipMemoryApplyResultDTO> {
  const candidate = validateCandidate(input.candidate);
  const { data, error } = await sb.rpc("business_relationship_memory_supersede", {
    p_receipt_id: input.receiptId,
    p_claim_token: input.claimToken,
    p_old_memory_id: input.oldMemoryId,
    p_expected_version: input.expectedVersion,
    p_candidate: candidate,
  });
  if (error) {
    const raw = error.message ?? "";
    const code =
      raw.match(/RELATIONSHIP_MEMORY_[A-Z_]+/)?.[0] ?? "RELATIONSHIP_MEMORY_INTERNAL_ERROR";
    throw new RelationshipMemoryError(code as never, raw);
  }
  return toSafeApplyResult((data ?? {}) as RelationshipMemoryApplyRpcRow);
}

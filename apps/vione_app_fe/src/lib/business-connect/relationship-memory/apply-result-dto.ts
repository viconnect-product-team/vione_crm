// BC-9.1 Turn B2b-ii — Safe result DTO for candidate application.
//
// The DTO is safe to emit in events, audit logs and (future) UI. It never
// carries owner IDs, tenant IDs, raw source content, hashed evidence, or the
// receipt claim token.

import type { RelationshipMemoryMergeOutcome } from "./merge-classifier";

export interface RelationshipMemoryApplyResultDTO {
  readonly outcome: RelationshipMemoryMergeOutcome | "superseded";
  readonly memoryRef: { readonly id: string };
  readonly existingMemoryRef: { readonly id: string } | null;
  readonly created: boolean;
  readonly materiallyChanged: boolean;
  readonly provenanceAdded: boolean;
  readonly linkAdded: boolean;
  readonly version: number;
  readonly reviewRequired: boolean;
}

/** Minimal shape returned by the SECURITY DEFINER RPC. */
export interface RelationshipMemoryApplyRpcRow {
  outcome: string;
  memoryId: string;
  existingMemoryId: string | null;
  created: boolean;
  materiallyChanged: boolean;
  provenanceAdded: boolean;
  linkAdded: boolean;
  version: number;
  reviewRequired: boolean;
}

const FORBIDDEN_KEYS = new Set([
  "ownerUserId",
  "owner_user_id",
  "tenantId",
  "claimToken",
  "canonicalValue",
  "structuredValue",
  "snippet",
  "snippet_safe",
]);

/** Assert no forbidden field slipped into an outbound event/audit payload. */
export function assertSafeApplyPayload(payload: Record<string, unknown>): void {
  for (const k of Object.keys(payload)) {
    if (FORBIDDEN_KEYS.has(k)) {
      throw new Error(`assertSafeApplyPayload: forbidden key '${k}'`);
    }
  }
}

export function toSafeApplyResult(
  row: RelationshipMemoryApplyRpcRow,
): RelationshipMemoryApplyResultDTO {
  const dto: RelationshipMemoryApplyResultDTO = Object.freeze({
    outcome: row.outcome as RelationshipMemoryApplyResultDTO["outcome"],
    memoryRef: Object.freeze({ id: row.memoryId }),
    existingMemoryRef: row.existingMemoryId ? Object.freeze({ id: row.existingMemoryId }) : null,
    created: Boolean(row.created),
    materiallyChanged: Boolean(row.materiallyChanged),
    provenanceAdded: Boolean(row.provenanceAdded),
    linkAdded: Boolean(row.linkAdded),
    version: Number(row.version ?? 1),
    reviewRequired: Boolean(row.reviewRequired),
  });
  return dto;
}

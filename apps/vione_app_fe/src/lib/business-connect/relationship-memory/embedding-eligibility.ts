// BC-9.1 Turn B2c — Embedding eligibility (client-safe pure policy).

import type { RelationshipMemoryStatus, RelationshipMemorySensitivity } from "./registry";

/** Currently retrievable in AI context. */
export const RETRIEVAL_CURRENT_STATUSES: ReadonlyArray<RelationshipMemoryStatus> = Object.freeze([
  "active",
]);

/** Statuses that must be excluded from current truth. */
export const RETRIEVAL_NON_CURRENT_STATUSES: ReadonlyArray<RelationshipMemoryStatus> =
  Object.freeze(["superseded", "expired", "dismissed"]);

export function isEmbeddingEligible(
  status: RelationshipMemoryStatus,
  opts: { allowCandidate?: boolean } = {},
): boolean {
  if (status === "active") return true;
  if (status === "candidate" && opts.allowCandidate === true) return true;
  return false;
}

/** Should an existing embedding be marked stale? */
export function shouldMarkEmbeddingStale(input: {
  status: RelationshipMemoryStatus;
  currentContentHash: string;
  storedContentHash: string;
  currentInputVersion: string;
  storedInputVersion: string;
  currentModelVersion: string;
  storedModelVersion: string;
  visibilityRevoked?: boolean;
  subjectAccessible?: boolean;
  scopeAccessible?: boolean;
}): boolean {
  if (input.visibilityRevoked) return true;
  if (input.subjectAccessible === false) return true;
  if (input.scopeAccessible === false) return true;
  if (input.currentContentHash !== input.storedContentHash) return true;
  if (input.currentInputVersion !== input.storedInputVersion) return true;
  if (input.currentModelVersion !== input.storedModelVersion) return true;
  if (RETRIEVAL_NON_CURRENT_STATUSES.includes(input.status)) return true;
  return false;
}

/** Cap the sensitivity a caller is allowed to include in current context. */
export function allowedForSensitivityCeiling(
  sensitivity: RelationshipMemorySensitivity,
  ceiling: RelationshipMemorySensitivity,
): boolean {
  const rank: Record<RelationshipMemorySensitivity, number> = {
    public_ok: 0,
    standard: 1,
    sensitive: 2,
    restricted: 3,
  };
  return rank[sensitivity] <= rank[ceiling];
}

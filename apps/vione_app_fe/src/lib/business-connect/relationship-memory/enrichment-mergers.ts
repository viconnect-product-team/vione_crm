// BC-9.1 Turn B2b-ii — Enrichment mergers (per-memory-kind allowlists).
//
// Generic recursive JSON merge is REJECTED. Every enrichment must go through
// an explicit allowlist of fields declared for its memory kind, so no
// extractor can silently smuggle unexpected data into an existing memory.

import type { RelationshipMemoryKind } from "./registry";
import { RelationshipMemoryError } from "./errors";

/** Fields allowed to be added by enrichment, per memory kind. */
export const RELATIONSHIP_MEMORY_ENRICHMENT_ALLOWLIST: Readonly<
  Record<RelationshipMemoryKind, ReadonlyArray<string>>
> = Object.freeze({
  preference: ["channel", "topic", "strength", "context"],
  interest: ["topic", "category", "context"],
  role_context: ["title", "org", "team", "seniority"],
  communication_style: ["tone", "channel", "cadence"],
  goal: ["headline", "horizon", "success_metric", "context"],
  constraint: ["headline", "kind", "expires_at", "context"],
  shared_history: ["event", "when", "where", "context"],
  commitment: ["headline", "due", "owner", "context"],
  milestone: ["headline", "when", "context"],
  risk_flag: ["headline", "severity", "context"],
  opportunity_signal: ["headline", "domain", "horizon", "context"],
  personal_context: ["topic", "context"],
});

/**
 * Merge `candidate` into `existing` for the given memory `kind`.
 * - Only keys in the allowlist may be added.
 * - Existing keys are NEVER overwritten (that path is a conflict, not
 *   enrichment; the classifier routes that case away).
 * - Non-allowlisted keys are rejected with `RELATIONSHIP_MEMORY_INVALID_MERGE`.
 */
export function mergeForEnrichment(
  kind: RelationshipMemoryKind,
  existing: Readonly<Record<string, unknown>>,
  candidate: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const allow = new Set(RELATIONSHIP_MEMORY_ENRICHMENT_ALLOWLIST[kind] ?? []);
  const out: Record<string, unknown> = { ...existing };
  for (const [k, v] of Object.entries(candidate)) {
    if (k in existing) continue; // enrichment never overwrites
    if (!allow.has(k)) {
      throw new RelationshipMemoryError(
        "RELATIONSHIP_MEMORY_INVALID_MERGE",
        `Field '${k}' is not in the enrichment allowlist for '${kind}'`,
        { kind, field: k },
      );
    }
    out[k] = v;
  }
  return out;
}

// BC-9.1 Turn A — Runtime eligibility gate for memory source ingestion.
//
// Structural allowlist + hard reject on excluded domains. This module is pure
// and deterministic; it is imported by both client policy tests and (Turn B)
// server-side extractors so the rule cannot be bypassed by a new call site.

import {
  RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS,
  RELATIONSHIP_MEMORY_EXCLUDED_SOURCE_DOMAINS,
  type RelationshipMemoryAllowedSourceDomain,
} from "./registry";
import { RelationshipMemoryError } from "./errors";

const ALLOWED: ReadonlySet<string> = new Set(RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS);
const EXCLUDED: ReadonlySet<string> = new Set(RELATIONSHIP_MEMORY_EXCLUDED_SOURCE_DOMAINS);

/** Extra hard-blocked identifiers that are HARD invariants regardless of allowlist drift. */
export const RELATIONSHIP_MEMORY_HARD_BLOCKED_TABLES: ReadonlyArray<string> = Object.freeze([
  "business_meeting_private_notes",
]);

export function isAllowedSourceDomain(
  domain: string,
): domain is RelationshipMemoryAllowedSourceDomain {
  return ALLOWED.has(domain) && !EXCLUDED.has(domain);
}

/**
 * Throws when the given source domain must not enter the memory pipeline.
 * Called by extractors, ingestion RPCs, and the source-insertion server fn.
 */
export function assertSourceDomainEligible(domain: string): void {
  if (EXCLUDED.has(domain)) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EXCLUDED_SOURCE",
      `Source domain '${domain}' is structurally excluded from Relationship Memory.`,
      { domain },
    );
  }
  if (!ALLOWED.has(domain)) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_EXCLUDED_SOURCE",
      `Source domain '${domain}' is not in the allowlist.`,
      { domain },
    );
  }
}

/** Verify a raw source reference does not point at a hard-blocked table. */
export function assertSourceRefNotBlocked(sourceRef: string): void {
  for (const blocked of RELATIONSHIP_MEMORY_HARD_BLOCKED_TABLES) {
    if (sourceRef.includes(blocked)) {
      throw new RelationshipMemoryError(
        "RELATIONSHIP_MEMORY_EXCLUDED_SOURCE",
        `Source reference targets a hard-blocked table: ${blocked}`,
        { sourceRef },
      );
    }
  }
}

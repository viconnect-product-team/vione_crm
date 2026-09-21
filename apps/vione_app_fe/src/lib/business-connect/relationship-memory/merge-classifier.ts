// BC-9.1 Turn B2b-ii — Deterministic merge classifier (pure).
//
// The classifier is the ONLY authority allowed to name the merge outcome.
// It is intentionally pure so any caller (unit tests, RPC, worker) derives
// the same outcome given the same canonical inputs.
//
// Outcomes:
//   - creates_new         : no existing memory on canonical identity
//   - duplicate           : same identity + materially equivalent structured value
//   - supports_existing   : same identity + non-contradictory value + no new keys
//   - enriches_existing   : same identity + candidate strictly adds new keys
//   - conflicts_existing  : same identity + at least one shared key with a
//                           different value (semantic contradiction)
//
// The classifier never mutates inputs and never reads IO.

export type RelationshipMemoryMergeOutcome =
  | "creates_new"
  | "duplicate"
  | "supports_existing"
  | "enriches_existing"
  | "conflicts_existing";

export interface MergeClassificationInput {
  /** The already-locked existing memory row on the same canonical identity,
   *  or null when the canonical lookup returned no row. */
  readonly existing: {
    readonly canonicalValue: Readonly<Record<string, unknown>>;
  } | null;
  /** Candidate structured value (already normalized upstream). */
  readonly candidate: Readonly<Record<string, unknown>>;
}

export interface MergeClassification {
  readonly outcome: RelationshipMemoryMergeOutcome;
  /** Keys shared between existing and candidate that carry incompatible values. */
  readonly conflictingKeys: ReadonlyArray<string>;
  /** Keys the candidate would add on top of existing (empty when duplicate). */
  readonly enrichingKeys: ReadonlyArray<string>;
}

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(",")}}`;
}

/** Pure, deterministic classifier. Never throws. */
export function classifyMerge(input: MergeClassificationInput): MergeClassification {
  const { existing, candidate } = input;
  if (!existing) {
    return { outcome: "creates_new", conflictingKeys: [], enrichingKeys: Object.keys(candidate) };
  }
  const conflicts: string[] = [];
  const enriches: string[] = [];
  const existingKeys = new Set(Object.keys(existing.canonicalValue));
  for (const [k, v] of Object.entries(candidate)) {
    if (!existingKeys.has(k)) {
      enriches.push(k);
      continue;
    }
    if (stableStringify(existing.canonicalValue[k]) !== stableStringify(v)) {
      conflicts.push(k);
    }
  }
  if (conflicts.length > 0) {
    return { outcome: "conflicts_existing", conflictingKeys: conflicts, enrichingKeys: enriches };
  }
  if (enriches.length > 0) {
    return { outcome: "enriches_existing", conflictingKeys: [], enrichingKeys: enriches };
  }
  return { outcome: "duplicate", conflictingKeys: [], enrichingKeys: [] };
}

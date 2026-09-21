// BC-9.1 Turn B1 — Deterministic normalizers.
//
// Pure, timezone-safe, dependency-free. Equivalent facts must produce the same
// canonical key output. Used by extractors before candidate emission.

import { canonicalKey } from "./memory-policy";
import type { RelationshipMemoryKind } from "./registry";

/** Collapse whitespace, strip zero-width chars, trim. */
export function normalizeWhitespace(input: string): string {
  return input
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lowercase with NFKD accent stripping. Stable across locales. */
export function normalizeCasing(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Normalize a channel/handle to lowercase, no leading @, no punctuation runs. */
export function normalizeChannel(input: string): string {
  return normalizeCasing(input)
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_.-]+/g, "")
    .slice(0, 80);
}

/** Normalize an organization name: strip common suffixes and diacritics. */
export function normalizeOrgName(input: string): string {
  const base = normalizeCasing(normalizeWhitespace(input));
  return base
    .replace(
      /\b(co\.?,? ?ltd\.?|ltd\.?|inc\.?|llc|gmbh|plc|corp\.?|company|jsc|s\.a\.?|s\.r\.l\.?|pte\.?)\b/g,
      "",
    )
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** ISO-8601 UTC normalization. Rejects invalid dates deterministically. */
export function normalizeIsoDate(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date input: ${input}`);
  }
  return d.toISOString();
}

/** Sort object keys recursively so structured values hash stably. */
export function stableStructuredValue<T extends Record<string, unknown>>(v: T): T {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(v).sort()) {
    const val = v[k];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      out[k] = stableStructuredValue(val as Record<string, unknown>);
    } else if (Array.isArray(val)) {
      out[k] = val
        .map((x: any) =>
          x && typeof x === "object" && !Array.isArray(x)
            ? stableStructuredValue(x as Record<string, unknown>)
            : x,
        )
        .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
    } else {
      out[k] = val;
    }
  }
  return out as T;
}

/** Deterministic canonical key for a candidate. */
export function candidateCanonicalKey(
  kind: RelationshipMemoryKind,
  predicate: string,
  canonicalText: string,
): string {
  const norm = normalizeWhitespace(normalizeCasing(`${predicate}:${canonicalText}`));
  return canonicalKey(kind, norm);
}

// BC-9.1 Turn B2c — Safe deterministic embedding input builder + hash.
//
// Client-safe (pure). Never accepts raw source content, private notes,
// hidden contact details, owner/tenant IDs, receipt tokens, or provider
// payloads. Callers pass ONLY approved projections.

import {
  RELATIONSHIP_MEMORY_EMBEDDING_PROFILE,
  RELATIONSHIP_MEMORY_EMBEDDING_INPUT_VERSION,
} from "./embedding-profile";
import type { RelationshipMemoryKind, RelationshipMemorySubjectType } from "./registry";

export interface SafeEmbeddingInputParts {
  memoryKind: RelationshipMemoryKind;
  canonicalText: string;
  /** Deterministic short summary of approved structured value. */
  structuredSummary?: string | null;
  /** Public-safe subject label (e.g. resolved display slug). Never raw UUID. */
  subjectType?: RelationshipMemorySubjectType | null;
  subjectLabel?: string | null;
  /** Public-safe scope label. Never raw UUID / owner ID. */
  scopeLabel?: string | null;
}

/** Forbidden characters that hint at raw identifiers or payload leakage. */
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

function assertNoRawIdentifier(field: string, value: string | null | undefined) {
  if (!value) return;
  if (UUID_RE.test(value)) {
    throw new Error(`buildRelationshipMemoryEmbeddingInput: '${field}' contains raw identifier`);
  }
}

function normalize(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deterministic input string. Fields ordered lexically, separators fixed,
 * locale-independent, truncated to profile.maxInputChars.
 */
export function buildRelationshipMemoryEmbeddingInput(parts: SafeEmbeddingInputParts): {
  text: string;
  inputVersion: string;
  contentHash: string;
} {
  assertNoRawIdentifier("canonicalText", parts.canonicalText);
  assertNoRawIdentifier("structuredSummary", parts.structuredSummary);
  assertNoRawIdentifier("subjectLabel", parts.subjectLabel);
  assertNoRawIdentifier("scopeLabel", parts.scopeLabel);

  const fields: Array<[string, string]> = [
    ["kind", parts.memoryKind],
    ["text", normalize(parts.canonicalText)],
  ];
  if (parts.structuredSummary) {
    fields.push(["structured", normalize(parts.structuredSummary)]);
  }
  if (parts.subjectType && parts.subjectLabel) {
    fields.push(["subject", `${parts.subjectType}::${normalize(parts.subjectLabel)}`]);
  }
  if (parts.scopeLabel) {
    fields.push(["scope", normalize(parts.scopeLabel)]);
  }
  fields.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const joined = fields.map(([k, v]) => `${k}=${v}`).join("|");
  const max = RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.maxInputChars;
  const truncated = joined.length > max ? joined.slice(0, max) : joined;

  return {
    text: truncated,
    inputVersion: RELATIONSHIP_MEMORY_EMBEDDING_INPUT_VERSION,
    contentHash: fnv1a64Hex(truncated),
  };
}

/** Deterministic FNV-1a 64-bit hex (browser-safe, no crypto module). */
export function fnv1a64Hex(input: string): string {
  let hi = 0xcbf29ce4 >>> 0;
  let lo = 0x84222325 >>> 0;
  for (let i = 0; i < input.length; i++) {
    const b = input.charCodeAt(i) & 0xff;
    lo ^= b;
    // 64-bit multiply by 0x100000001b3, split hi/lo
    const loMul = Math.imul(lo, 0x000001b3) >>> 0;
    const hiMul = (Math.imul(hi, 0x000001b3) + Math.imul(lo, 0x00000001)) >>> 0;
    lo = loMul >>> 0;
    hi = hiMul >>> 0;
  }
  return hi.toString(16).padStart(8, "0") + lo.toString(16).padStart(8, "0");
}

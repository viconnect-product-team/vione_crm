// BC-9.1 Turn B1 — RelationshipMemoryCandidate contract + validator.
//
// Frozen shape produced by every extractor. Never contains raw source body,
// auth identifiers, tenant IDs, or hidden contact fields. Validation is pure
// and shared by deterministic and (future) model-assisted extractors.

import { z } from "zod";
import {
  RELATIONSHIP_MEMORY_KINDS,
  RELATIONSHIP_MEMORY_SENSITIVITY,
  RELATIONSHIP_MEMORY_SUBJECT_TYPES,
  RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS,
  type RelationshipMemoryKind,
  type RelationshipMemorySensitivity,
  type RelationshipMemorySubjectType,
  type RelationshipMemoryAllowedSourceDomain,
} from "./registry";
import { RELATIONSHIP_MEMORY_HARD_BLOCKED_TABLES } from "./eligibility";
import { RelationshipMemoryError } from "./errors";

/** Evidence strength band for a single candidate observation. */
export const RELATIONSHIP_MEMORY_EVIDENCE_TYPES = [
  "direct_statement",
  "structured_field",
  "explicit_commitment",
  "corroborated_signal",
  "weak_signal",
] as const;
export type RelationshipMemoryEvidenceType = (typeof RELATIONSHIP_MEMORY_EVIDENCE_TYPES)[number];

/** Coarse strength; used as an input to confidence mapping. */
export const RELATIONSHIP_MEMORY_EVIDENCE_STRENGTHS = ["low", "medium", "high"] as const;
export type RelationshipMemoryEvidenceStrength =
  (typeof RELATIONSHIP_MEMORY_EVIDENCE_STRENGTHS)[number];

export interface RelationshipMemoryCandidate {
  readonly extractorId: string;
  readonly extractorVersion: string;
  readonly sourceDomain: RelationshipMemoryAllowedSourceDomain;
  readonly sourceRecordId: string;
  readonly sourceVersion: string;
  readonly scopeType: "meeting" | "introduction" | "profile" | "work_item" | "none";
  readonly scopeRecordId: string | null;
  readonly subjectType: RelationshipMemorySubjectType;
  /** Subject entity reference — MUST be resolved through entity-resolution
   *  before persistence. Extractors may emit unresolved subjects; the
   *  service rejects or defers them. */
  readonly subjectRef: string;
  readonly subjectResolved: boolean;
  readonly memoryKind: RelationshipMemoryKind;
  readonly canonicalPredicate: string;
  readonly canonicalText: string;
  readonly structuredValue: Readonly<Record<string, unknown>>;
  readonly evidenceType: RelationshipMemoryEvidenceType;
  readonly evidenceStrength: RelationshipMemoryEvidenceStrength;
  readonly occurredAt: string;
  readonly visibilityClass: RelationshipMemorySensitivity;
}

const CANDIDATE_TEXT_MAX = 800;
const PREDICATE_MAX = 120;
const SUBJECT_REF_MAX = 200;

const structuredValueSchema = z.record(z.string(), z.unknown()).refine((v) => {
  // No auth/tenant/private-note leakage in structuredValue keys.
  const forbidden =
    /(auth[_-]?id|tenant|private[_-]?note|access[_-]?token|refresh[_-]?token|secret)/i;
  for (const k of Object.keys(v)) if (forbidden.test(k)) return false;
  return true;
}, "structuredValue contains a forbidden key");

const BLOCKED_TABLE_REGEX = new RegExp(
  RELATIONSHIP_MEMORY_HARD_BLOCKED_TABLES.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(
    "|",
  ),
  "i",
);

const canonicalTextSchema = z
  .string()
  .min(1)
  .max(CANDIDATE_TEXT_MAX)
  .refine((s) => !BLOCKED_TABLE_REGEX.test(s), "canonicalText references a hard-blocked table")
  .refine(
    (s) => !/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i.test(s),
    "canonicalText contains a raw UUID",
  );

export const relationshipMemoryCandidateSchema = z
  .object({
    extractorId: z.string().min(1).max(120),
    extractorVersion: z.string().min(1).max(40),
    sourceDomain: z.enum(RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS),
    sourceRecordId: z.string().min(1).max(200),
    sourceVersion: z.string().min(1).max(80),
    scopeType: z.enum(["meeting", "introduction", "profile", "work_item", "none"]),
    scopeRecordId: z.string().min(1).max(200).nullable(),
    subjectType: z.enum(RELATIONSHIP_MEMORY_SUBJECT_TYPES),
    subjectRef: z.string().min(1).max(SUBJECT_REF_MAX),
    subjectResolved: z.boolean(),
    memoryKind: z.enum(RELATIONSHIP_MEMORY_KINDS),
    canonicalPredicate: z.string().min(1).max(PREDICATE_MAX),
    canonicalText: canonicalTextSchema,
    structuredValue: structuredValueSchema,
    evidenceType: z.enum(RELATIONSHIP_MEMORY_EVIDENCE_TYPES),
    evidenceStrength: z.enum(RELATIONSHIP_MEMORY_EVIDENCE_STRENGTHS),
    occurredAt: z.string().datetime(),
    visibilityClass: z.enum(RELATIONSHIP_MEMORY_SENSITIVITY),
  })
  .strict();

export function validateCandidate(input: unknown): RelationshipMemoryCandidate {
  const parsed = relationshipMemoryCandidateSchema.safeParse(input);
  if (!parsed.success) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_CANDIDATE_INVALID",
      parsed.error.message,
      { issues: parsed.error.issues },
    );
  }
  return Object.freeze({
    ...parsed.data,
    structuredValue: Object.freeze({ ...parsed.data.structuredValue }),
  }) as RelationshipMemoryCandidate;
}

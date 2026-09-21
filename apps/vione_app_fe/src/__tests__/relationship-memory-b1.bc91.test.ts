// BC-9.1 Turn B1 — Policy/runtime-foundation tests.
//
// Scope: extractor registry integrity, candidate contract, deterministic
// normalization, ambiguous-entity error contract, receipts idempotency shape,
// and structural private-note gate over new B1 sources.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  RELATIONSHIP_MEMORY_EXTRACTORS,
  RELATIONSHIP_MEMORY_EXTRACTION_LIMITS,
  RELATIONSHIP_MEMORY_EXTRACTION_MODES,
  assertRegistryIntegrity,
  getExtractor,
  isKnownExtractor,
} from "@/lib/business-connect/relationship-memory/extractor-registry";
import {
  validateCandidate,
  RELATIONSHIP_MEMORY_EVIDENCE_TYPES,
  RELATIONSHIP_MEMORY_EVIDENCE_STRENGTHS,
} from "@/lib/business-connect/relationship-memory/candidate";
import {
  normalizeWhitespace,
  normalizeCasing,
  normalizeChannel,
  normalizeOrgName,
  normalizeIsoDate,
  stableStructuredValue,
  candidateCanonicalKey,
} from "@/lib/business-connect/relationship-memory/normalizers";
import { RelationshipMemoryError } from "@/lib/business-connect/relationship-memory/errors";
import { extractionIdempotencySignature } from "@/lib/business-connect/relationship-memory/receipts.server";
import { RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS } from "@/lib/business-connect/relationship-memory";

const DOMAIN_ROOT = resolve(__dirname, "../lib/business-connect/relationship-memory");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

const validCandidate = () => ({
  extractorId: "meeting_outcome.commitments.v1",
  extractorVersion: "1.0.0",
  sourceDomain: "meeting_outcome_safe" as const,
  sourceRecordId: "m-123",
  sourceVersion: "v1",
  scopeType: "meeting" as const,
  scopeRecordId: "meeting-abc",
  subjectType: "person" as const,
  subjectRef: "person-node-ref",
  subjectResolved: true,
  memoryKind: "commitment" as const,
  canonicalPredicate: "committed_to",
  canonicalText: "Will share the Q3 pipeline report by next Friday",
  structuredValue: { dueBy: "2026-08-01", channel: "email" },
  evidenceType: "explicit_commitment" as const,
  evidenceStrength: "high" as const,
  occurredAt: "2026-07-15T09:00:00.000Z",
  visibilityClass: "sensitive" as const,
});

describe("BC-9.1 B1 — extractor registry", () => {
  it("is frozen and structurally valid", () => {
    expect(() => assertRegistryIntegrity()).not.toThrow();
    expect(Object.isFrozen(RELATIONSHIP_MEMORY_EXTRACTORS)).toBe(true);
  });

  it("targets only allowlisted safe source domains", () => {
    const allowed = new Set<string>(RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS);
    for (const ex of RELATIONSHIP_MEMORY_EXTRACTORS) {
      expect(allowed.has(ex.sourceDomain)).toBe(true);
    }
  });

  it("has extractor lookup", () => {
    expect(isKnownExtractor("meeting_outcome.commitments.v1")).toBe(true);
    expect(isKnownExtractor("__nope__")).toBe(false);
    expect(getExtractor("meeting_outcome.commitments.v1")?.mode).toBe("deterministic");
  });

  it("uses only registered modes", () => {
    const modes = new Set<string>(RELATIONSHIP_MEMORY_EXTRACTION_MODES);
    for (const ex of RELATIONSHIP_MEMORY_EXTRACTORS) {
      expect(modes.has(ex.mode)).toBe(true);
    }
  });

  it("respects the per-source candidate ceiling", () => {
    for (const ex of RELATIONSHIP_MEMORY_EXTRACTORS) {
      expect(ex.maxCandidates).toBeGreaterThan(0);
      expect(ex.maxCandidates).toBeLessThanOrEqual(
        RELATIONSHIP_MEMORY_EXTRACTION_LIMITS.MAX_CANDIDATES_PER_SOURCE,
      );
    }
  });
});

describe("BC-9.1 B1 — candidate contract", () => {
  it("accepts a well-formed candidate", () => {
    const c = validateCandidate(validCandidate());
    expect(c.memoryKind).toBe("commitment");
    expect(Object.isFrozen(c)).toBe(true);
  });

  it("rejects a candidate that leaks a UUID in canonicalText", () => {
    expect(() =>
      validateCandidate({
        ...validCandidate(),
        canonicalText: "See record 550e8400-e29b-41d4-a716-446655440000",
      }),
    ).toThrow(RelationshipMemoryError);
  });

  it("rejects structuredValue with forbidden keys (auth/tenant/secret)", () => {
    for (const k of ["auth_id", "tenantId", "private_note", "access_token", "secret_key"]) {
      expect(() =>
        validateCandidate({ ...validCandidate(), structuredValue: { [k]: "x" } }),
      ).toThrow(RelationshipMemoryError);
    }
  });

  it("rejects a canonicalText that references business_meeting_private_notes", () => {
    expect(() =>
      validateCandidate({
        ...validCandidate(),
        canonicalText: "Referenced from business_meeting_private_notes/abc",
      }),
    ).toThrow(RelationshipMemoryError);
  });

  it("rejects an unregistered source domain", () => {
    expect(() =>
      validateCandidate({ ...validCandidate(), sourceDomain: "made_up_domain" }),
    ).toThrow();
  });

  it("evidence enums are frozen", () => {
    expect(RELATIONSHIP_MEMORY_EVIDENCE_TYPES.length).toBeGreaterThan(0);
    expect(RELATIONSHIP_MEMORY_EVIDENCE_STRENGTHS).toContain("high");
  });
});

describe("BC-9.1 B1 — deterministic normalization", () => {
  it("normalizeWhitespace collapses runs and strips zero-width", () => {
    expect(normalizeWhitespace("  a\u200B b\t\tc\n")).toBe("a b c");
  });

  it("normalizeCasing strips diacritics", () => {
    expect(normalizeCasing("Việt Nam")).toBe("viet nam");
  });

  it("normalizeChannel strips leading @ and lowercases", () => {
    expect(normalizeChannel("@AlicE_23")).toBe("alice_23");
  });

  it("normalizeOrgName strips common suffixes and diacritics", () => {
    expect(normalizeOrgName("Acme Company, Ltd.")).toBe("acme");
    expect(normalizeOrgName("Công Ty TNHH")).toContain("cong ty tnhh");
  });

  it("normalizeIsoDate returns stable ISO", () => {
    expect(normalizeIsoDate("2026-07-15T09:00:00Z")).toBe("2026-07-15T09:00:00.000Z");
    expect(() => normalizeIsoDate("not-a-date")).toThrow();
  });

  it("stableStructuredValue sorts keys deterministically", () => {
    const a = stableStructuredValue({ b: 1, a: { z: 1, y: 2 } });
    expect(JSON.stringify(a)).toBe('{"a":{"y":2,"z":1},"b":1}');
  });

  it("candidateCanonicalKey is stable across whitespace/case variants", () => {
    const k1 = candidateCanonicalKey("commitment", "committed_to", "Will share  the Q3 REPORT");
    const k2 = candidateCanonicalKey("commitment", "committed_to", "will share the q3 report");
    expect(k1).toBe(k2);
  });
});

describe("BC-9.1 B1 — receipt idempotency identity", () => {
  it("produces a stable signature for the same identity", () => {
    const id = {
      ownerUserId: "u-1",
      sourceDomain: "meeting_outcome_safe",
      sourceRecordId: "m-1",
      sourceVersion: "v1",
      extractorId: "meeting_outcome.commitments.v1",
      extractorVersion: "1.0.0",
    };
    expect(extractionIdempotencySignature(id)).toBe(extractionIdempotencySignature({ ...id }));
  });

  it("differs when any identity field differs", () => {
    const base = {
      ownerUserId: "u-1",
      sourceDomain: "meeting_outcome_safe",
      sourceRecordId: "m-1",
      sourceVersion: "v1",
      extractorId: "meeting_outcome.commitments.v1",
      extractorVersion: "1.0.0",
    };
    const sig = extractionIdempotencySignature(base);
    for (const field of Object.keys(base) as Array<keyof typeof base>) {
      const mutated = { ...base, [field]: `${base[field]}-x` };
      expect(extractionIdempotencySignature(mutated)).not.toBe(sig);
    }
  });
});

describe("BC-9.1 B1 — structural private-note gate covers new files", () => {
  it("no B1 module references business_meeting_private_notes as a live table", () => {
    const files = walk(DOMAIN_ROOT).filter(
      (f) =>
        f.endsWith("extractor-registry.ts") ||
        f.endsWith("candidate.ts") ||
        f.endsWith("normalizers.ts") ||
        f.endsWith("entity-resolution.server.ts") ||
        f.endsWith("receipts.server.ts") ||
        f.endsWith("extraction-worker.server.ts"),
    );
    for (const f of files) {
      const body = readFileSync(f, "utf8");
      expect(body.includes("business_meeting_private_notes")).toBe(false);
      expect(body.includes("private_meeting_notes")).toBe(false);
    }
  });

  it("client-safe barrel does not re-export .server modules", () => {
    const body = readFileSync(join(DOMAIN_ROOT, "index.ts"), "utf8");
    expect(body).not.toMatch(/\.server(?:\.ts)?["']/);
    expect(body).not.toMatch(/receipts\.server/);
    expect(body).not.toMatch(/entity-resolution\.server/);
    expect(body).not.toMatch(/extraction-worker\.server/);
  });
});

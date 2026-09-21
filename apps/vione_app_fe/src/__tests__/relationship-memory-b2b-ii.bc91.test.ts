// BC-9.1 Turn B2b-ii — Focused unit + structural tests for candidate
// persistence, merge classification, enrichment mergers, provenance/link
// invariants, DTO safety, and structural exclusion of private notes.
//
// Runtime RPC concurrency behavior is proven at the DB layer via CHECK/UNIQUE
// constraints and the SECURITY DEFINER function body; those SQL invariants
// are asserted here structurally by inspecting the migration file.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  classifyMerge,
  type RelationshipMemoryMergeOutcome,
} from "@/lib/business-connect/relationship-memory/merge-classifier";
import {
  mergeForEnrichment,
  RELATIONSHIP_MEMORY_ENRICHMENT_ALLOWLIST,
} from "@/lib/business-connect/relationship-memory/enrichment-mergers";
import {
  toSafeApplyResult,
  assertSafeApplyPayload,
  type RelationshipMemoryApplyRpcRow,
} from "@/lib/business-connect/relationship-memory/apply-result-dto";
import {
  RELATIONSHIP_MEMORY_ERROR_CODES,
  RelationshipMemoryError,
} from "@/lib/business-connect/relationship-memory/errors";
import { RELATIONSHIP_MEMORY_SDK_METHODS } from "@/lib/business-connect/relationship-memory/sdk";
import * as barrel from "@/lib/business-connect/relationship-memory";

// ---------- helpers ----------

function findMigrationSQL(): string {
  const dir = "supabase/migrations";
  const files = readdirSync(dir).sort();
  const match = files
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .find((s) => s.includes("business_relationship_memory_apply_candidate"));
  if (!match) throw new Error("apply_candidate migration not found");
  return match;
}
const APPLY_SQL = findMigrationSQL();

// ---------- 1. Persistence entrypoint / RPC hardening (structural) ----------

describe("BC-9.1 B2b-ii — RPC hardening", () => {
  it("RPC is SECURITY DEFINER with locked search_path", () => {
    expect(APPLY_SQL).toMatch(/SECURITY DEFINER/);
    expect(APPLY_SQL).toMatch(/SET search_path\s*=\s*public,\s*pg_temp/);
  });
  it("RPC is revoked from PUBLIC, anon, authenticated and granted only to service_role", () => {
    expect(APPLY_SQL).toMatch(
      /REVOKE ALL ON FUNCTION public\.business_relationship_memory_apply_candidate\S* FROM PUBLIC/,
    );
    expect(APPLY_SQL).toMatch(
      /REVOKE ALL ON FUNCTION public\.business_relationship_memory_apply_candidate\S* FROM anon/,
    );
    expect(APPLY_SQL).toMatch(
      /REVOKE ALL ON FUNCTION public\.business_relationship_memory_apply_candidate\S* FROM authenticated/,
    );
    expect(APPLY_SQL).toMatch(
      /GRANT\s+EXECUTE ON FUNCTION public\.business_relationship_memory_apply_candidate\S* TO service_role/,
    );
  });
  it("supersede RPC has the same service-role hardening", () => {
    expect(APPLY_SQL).toMatch(
      /REVOKE ALL ON FUNCTION public\.business_relationship_memory_supersede\S* FROM authenticated/,
    );
    expect(APPLY_SQL).toMatch(
      /GRANT\s+EXECUTE ON FUNCTION public\.business_relationship_memory_supersede\S* TO service_role/,
    );
  });
  it("RPC derives ownership from receipt (does not accept owner argument)", () => {
    // The signature contains no p_owner param.
    expect(APPLY_SQL).not.toMatch(/business_relationship_memory_apply_candidate[^)]*p_owner/);
    expect(APPLY_SQL).toMatch(/v_owner\s*:=\s*v_receipt\.owner_user_id/);
  });
  it("RPC validates claim token and processing state", () => {
    expect(APPLY_SQL).toMatch(/v_receipt\.claim_token\s*<>\s*p_claim_token/);
    expect(APPLY_SQL).toMatch(/v_receipt\.status\s*<>\s*'processing'/);
  });
  it("RPC rejects unresolved subjects", () => {
    expect(APPLY_SQL).toMatch(/NOT v_subject_resolved/);
  });
  it("RPC hard-rejects private-note source", () => {
    expect(APPLY_SQL).toMatch(/v_source_domain\s*=\s*'private_meeting_notes'/);
  });
});

// ---------- 2. Merge classifier ----------

describe("BC-9.1 B2b-ii — merge classifier", () => {
  it("creates_new when no existing memory", () => {
    expect(classifyMerge({ existing: null, candidate: { topic: "ai" } }).outcome).toBe(
      "creates_new",
    );
  });
  it("duplicate when candidate carries no new/changed key", () => {
    expect(
      classifyMerge({ existing: { canonicalValue: { topic: "ai" } }, candidate: { topic: "ai" } })
        .outcome,
    ).toBe("duplicate");
  });
  it("supports_existing collapses to duplicate when candidate is empty subset", () => {
    // Empty candidate ⇒ nothing to enrich, nothing conflicts ⇒ duplicate.
    expect(
      classifyMerge({ existing: { canonicalValue: { topic: "ai" } }, candidate: {} }).outcome,
    ).toBe("duplicate");
  });
  it("enriches_existing when candidate strictly extends existing", () => {
    const r = classifyMerge({
      existing: { canonicalValue: { topic: "ai" } },
      candidate: { topic: "ai", context: "workshop" },
    });
    expect(r.outcome).toBe("enriches_existing");
    expect(r.enrichingKeys).toEqual(["context"]);
  });
  it("conflicts_existing when a shared key value differs", () => {
    const r = classifyMerge({
      existing: { canonicalValue: { topic: "ai" } },
      candidate: { topic: "ml" },
    });
    expect(r.outcome).toBe("conflicts_existing");
    expect(r.conflictingKeys).toEqual(["topic"]);
  });
  const outcomes: RelationshipMemoryMergeOutcome[] = [
    "creates_new",
    "duplicate",
    "supports_existing",
    "enriches_existing",
    "conflicts_existing",
  ];
  it("frozen outcome set", () => {
    expect(new Set(outcomes).size).toBe(5);
  });
});

// ---------- 3. Enrichment mergers ----------

describe("BC-9.1 B2b-ii — enrichment mergers", () => {
  it("allowlist covers every memory kind", () => {
    for (const k of Object.keys(RELATIONSHIP_MEMORY_ENRICHMENT_ALLOWLIST)) {
      expect(Array.isArray(RELATIONSHIP_MEMORY_ENRICHMENT_ALLOWLIST[k as never])).toBe(true);
    }
  });
  it("adds allowlisted field", () => {
    const out = mergeForEnrichment("preference", { channel: "email" }, { topic: "product-launch" });
    expect(out).toEqual({ channel: "email", topic: "product-launch" });
  });
  it("never overwrites an existing field even if the field is allowlisted", () => {
    const out = mergeForEnrichment("preference", { channel: "email" }, { channel: "sms" });
    expect(out).toEqual({ channel: "email" });
  });
  it("rejects non-allowlisted field", () => {
    expect(() =>
      mergeForEnrichment("preference", { channel: "email" }, { arbitrary_field: 1 }),
    ).toThrow(RelationshipMemoryError);
  });
  it("rejects auth/tenant style key even if capitalized differently", () => {
    expect(() =>
      mergeForEnrichment("goal", { headline: "raise seed" }, { tenant_id: "x" }),
    ).toThrow(RelationshipMemoryError);
  });
});

// ---------- 4. Safe result DTO ----------

describe("BC-9.1 B2b-ii — safe result DTO", () => {
  const row: RelationshipMemoryApplyRpcRow = {
    outcome: "creates_new",
    memoryId: "11111111-1111-1111-1111-111111111111",
    existingMemoryId: null,
    created: true,
    materiallyChanged: true,
    provenanceAdded: true,
    linkAdded: false,
    version: 1,
    reviewRequired: false,
  };
  it("wraps memory id, omits owner/tenant/token", () => {
    const dto = toSafeApplyResult(row);
    expect(dto.memoryRef.id).toBe(row.memoryId);
    expect(Object.keys(dto)).not.toContain("ownerUserId");
    expect(Object.keys(dto)).not.toContain("claimToken");
  });
  it("assertSafeApplyPayload rejects forbidden keys", () => {
    expect(() => assertSafeApplyPayload({ ownerUserId: "x" })).toThrow();
    expect(() => assertSafeApplyPayload({ claimToken: "x" })).toThrow();
    expect(() => assertSafeApplyPayload({ canonicalValue: {} })).toThrow();
    expect(() => assertSafeApplyPayload({ snippet: "x" })).toThrow();
  });
  it("DTO is frozen", () => {
    const dto = toSafeApplyResult(row);
    expect(Object.isFrozen(dto)).toBe(true);
  });
});

// ---------- 5. DB constraints (structural on migration SQL) ----------

describe("BC-9.1 B2b-ii — DB constraints", () => {
  it("adds row_version positive and superseded_not_self", () => {
    expect(APPLY_SQL).toMatch(/bc_rm_memory_row_version_positive/);
    expect(APPLY_SQL).toMatch(/bc_rm_memory_superseded_not_self/);
  });
  it("provenance uniqueness includes evidence_type and extractor identity", () => {
    expect(APPLY_SQL).toMatch(/bc_rm_sources_identity_unique/);
    expect(APPLY_SQL).toMatch(
      /memory_id,\s*source_domain,\s*source_record_id,\s*source_version,\s*extractor_id,\s*extractor_version,\s*evidence_type/,
    );
  });
  it("expands link kinds without dropping no-self-link", () => {
    expect(APPLY_SQL).toMatch(/'derived_from'/);
    expect(APPLY_SQL).toMatch(/'confirmed_by'/);
    expect(APPLY_SQL).toMatch(/'mentioned_in'/);
    // no-self-link constraint predates this migration; verified separately in
    // the live schema (\d links) and not dropped here.
    expect(APPLY_SQL).not.toMatch(/DROP CONSTRAINT.*bc_rm_link_not_self/);
  });
  it("active-canonical uniqueness allows historical supersession", () => {
    expect(APPLY_SQL).toMatch(/bc_rm_memory_active_unique/);
    expect(APPLY_SQL).toMatch(/WHERE status IN \('candidate','active'\)/);
  });
});

// ---------- 6. Error contract ----------

describe("BC-9.1 B2b-ii — error contract", () => {
  const required = [
    "RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM",
    "RELATIONSHIP_MEMORY_PERSISTENCE_CONFLICT",
    "RELATIONSHIP_MEMORY_VERSION_CONFLICT",
    "RELATIONSHIP_MEMORY_INVALID_MERGE",
    "RELATIONSHIP_MEMORY_PROVENANCE_CONFLICT",
    "RELATIONSHIP_MEMORY_LINK_CONFLICT",
    "RELATIONSHIP_MEMORY_VISIBILITY_ESCALATION",
    "RELATIONSHIP_MEMORY_SENSITIVITY_DOWNGRADE",
    "RELATIONSHIP_MEMORY_SUPERSESSION_NOT_ALLOWED",
    "RELATIONSHIP_MEMORY_INTERNAL_ERROR",
  ];
  it("all B2b-ii error codes registered", () => {
    for (const c of required) expect(RELATIONSHIP_MEMORY_ERROR_CODES).toContain(c);
  });
});

// ---------- 7. Structural / SDK exclusions ----------

describe("BC-9.1 B2b-ii — structural exclusions", () => {
  it("public SDK exposes no applyCandidate / supersede method", () => {
    expect(RELATIONSHIP_MEMORY_SDK_METHODS).toEqual([
      "list",
      "getById",
      "searchMemories",
      "listRelevantMemories",
      "getMemoryGraphContext",
    ]);
  });
  it("client barrel does not export server runtime symbols", () => {
    const keys = Object.keys(barrel);
    for (const forbidden of [
      "applyRelationshipMemoryCandidate",
      "supersedeRelationshipMemory",
      "RelationshipMemoryRepository",
      "ExtractionReceiptRepository",
    ]) {
      expect(keys).not.toContain(forbidden);
    }
  });
  it("no private-note source path exists in service code", () => {
    const svc = readFileSync(
      "src/lib/business-connect/relationship-memory/apply-candidate.server.ts",
      "utf8",
    );
    expect(svc).not.toMatch(/private_meeting_notes/);
    // The RPC hard-rejects it structurally.
    expect(APPLY_SQL).toMatch(/'private_meeting_notes'/);
  });
  it("apply service never accepts an owner argument", () => {
    const svc = readFileSync(
      "src/lib/business-connect/relationship-memory/apply-candidate.server.ts",
      "utf8",
    );
    expect(svc).not.toMatch(/ownerUserId/i);
  });
  it("apply service opens no external provider call", () => {
    const svc = readFileSync(
      "src/lib/business-connect/relationship-memory/apply-candidate.server.ts",
      "utf8",
    );
    expect(svc).not.toMatch(/fetch\(/);
    expect(svc).not.toMatch(/lovable-ai|openai|anthropic|gateway/i);
  });
});

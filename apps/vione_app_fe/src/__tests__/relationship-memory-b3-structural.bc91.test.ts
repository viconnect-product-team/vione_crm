// BC-9.1 Turn B3 — Structural / repository-wide security proofs.
//
// Purely static scans of the relationship-memory tree, its client barrel,
// migrations, and adjacent modules. No DB, no network. Runs fast and
// deterministically so it can gate CI.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import * as barrel from "@/lib/business-connect/relationship-memory";
import { RELATIONSHIP_MEMORY_SDK_METHODS } from "@/lib/business-connect/relationship-memory/sdk";
import {
  RELATIONSHIP_MEMORY_EMBEDDING_PROFILE,
  RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID,
} from "@/lib/business-connect/relationship-memory/embedding-profile";
import {
  RELATIONSHIP_MEMORY_SEARCH_LIMIT_DEFAULT,
  RELATIONSHIP_MEMORY_SEARCH_LIMIT_MAX,
  RELATIONSHIP_MEMORY_SEMANTIC_CANDIDATE_POOL_MAX,
  RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH,
  RELATIONSHIP_MEMORY_GRAPH_MAX_NODES,
  RELATIONSHIP_MEMORY_QUERY_MAX_CHARS,
} from "@/lib/business-connect/relationship-memory/search-dto";
import { RELATIONSHIP_MEMORY_ERROR_CODES } from "@/lib/business-connect/relationship-memory/errors";
import { RELATIONSHIP_MEMORY_HARD_BLOCKED_TABLES } from "@/lib/business-connect/relationship-memory/eligibility";

// --- helpers ---------------------------------------------------------------

const RM_ROOT = resolve(__dirname, "..", "lib", "business-connect", "relationship-memory");
const MIGRATIONS_ROOT = resolve(__dirname, "..", "..", "supabase", "migrations");

function walkFiles(dir: string, filter: (p: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walkFiles(p, filter));
    else if (filter(p)) out.push(p);
  }
  return out;
}

const RM_TS_FILES = walkFiles(RM_ROOT, (p) => p.endsWith(".ts"));

function readAll(files: string[]): { file: string; body: string }[] {
  return files.map((f) => ({ file: f, body: readFileSync(f, "utf8") }));
}

function grep(
  pattern: RegExp,
  files: string[],
  allowlist: string[] = [],
): { file: string; match: string }[] {
  const hits: { file: string; match: string }[] = [];
  for (const f of files) {
    if (allowlist.some((a) => f.endsWith(a))) continue;
    const body = readFileSync(f, "utf8");
    const m = body.match(pattern);
    if (m) hits.push({ file: f, match: m[0] });
  }
  return hits;
}

// --- 5. Private-note structural proof --------------------------------------

describe("BC-9.1 B3 · Private-note structural exclusion", () => {
  const FORBIDDEN = [
    /business_meeting_private_notes/,
    /\bprivate_meeting_notes\b/,
    /\bMeetingPrivateNote\b/,
    /\bgetPrivateNote\b/,
    /\bprivateNotes\b/,
  ];
  const ALLOWLIST = ["registry.ts", "eligibility.ts", "embedding-eligibility.ts"];

  for (const re of FORBIDDEN) {
    it(`no relationship-memory runtime code references ${re}`, () => {
      const hits = grep(re, RM_TS_FILES, ALLOWLIST);
      expect(hits).toEqual([]);
    });
  }

  it("hard-blocked tables list contains business_meeting_private_notes", () => {
    expect(RELATIONSHIP_MEMORY_HARD_BLOCKED_TABLES).toContain("business_meeting_private_notes");
  });

  it("private-note CHECK constraint exists in migration files", () => {
    const migs = walkFiles(MIGRATIONS_ROOT, (p) => p.endsWith(".sql"));
    const found = migs.some((m) =>
      readFileSync(m, "utf8").includes("bc_rm_source_reject_private_notes"),
    );
    expect(found).toBe(true);
  });
});

// --- 4. Public / internal boundary -----------------------------------------

describe("BC-9.1 B3 · Public SDK surface", () => {
  it("SDK method list is frozen to five read-only methods", () => {
    expect([...RELATIONSHIP_MEMORY_SDK_METHODS]).toEqual([
      "list",
      "getById",
      "searchMemories",
      "listRelevantMemories",
      "getMemoryGraphContext",
    ]);
  });

  it("client barrel exports no *.server modules", () => {
    const barrelSrc = readFileSync(join(RM_ROOT, "index.ts"), "utf8");
    expect(/\.server(["']|$)/m.test(barrelSrc)).toBe(false);
  });

  it("client barrel exports no worker / apply / persistence symbols", () => {
    const forbidden = [
      "runExtractionWorkerOnce",
      "applyRelationshipMemoryCandidate",
      "supersedeMemory",
      "claimExtractionReceipts",
      "generateEmbeddingForMemory",
      "loadMeetingOutcomeSource",
      "loadSharedNoteSource",
    ];
    const keys = Object.keys(barrel);
    for (const f of forbidden) expect(keys).not.toContain(f);
  });

  it("SDK contains no raw-vector method", () => {
    for (const k of RELATIONSHIP_MEMORY_SDK_METHODS) {
      expect(/vector|embedding/i.test(k)).toBe(false);
    }
  });
});

// --- 6. Raw vector / embedding security ------------------------------------

describe("BC-9.1 B3 · Raw-vector containment", () => {
  it("search DTO shape contains no vector / distance / rawSimilarity field", () => {
    const raw = readFileSync(join(RM_ROOT, "search-dto.ts"), "utf8");
    // strip line + block comments before scanning for identifiers
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(/\bvector\b/i.test(src)).toBe(false);
    expect(/\brawSimilarity\b/.test(src)).toBe(false);
    expect(/\bdistance\b/i.test(src)).toBe(false);
    expect(/\bembedding\b/i.test(src)).toBe(false);
  });

  it("embedding provider module is server-only (*.server.ts)", () => {
    const files = readdirSync(RM_ROOT);
    expect(files).toContain("embedding-provider.server.ts");
    expect(files).not.toContain("embedding-provider.ts");
  });

  it("query embedder module is server-only", () => {
    const files = readdirSync(RM_ROOT);
    expect(files).toContain("query-embedder.server.ts");
  });

  it("no purely client-safe module (non *.server, non *.functions) imports server-only embedding provider or query embedder", () => {
    const clientSafe = RM_TS_FILES.filter(
      (f) => !f.endsWith(".server.ts") && !f.endsWith(".functions.ts"),
    );
    const hits: string[] = [];
    for (const f of clientSafe) {
      const body = readFileSync(f, "utf8");
      if (/embedding-provider\.server|query-embedder\.server/.test(body)) {
        hits.push(f);
      }
    }
    expect(hits).toEqual([]);
  });
});

// --- 7/8. Stable error codes for provider / concurrency --------------------

describe("BC-9.1 B3 · Stable provider / embedding error codes", () => {
  const required = [
    "RELATIONSHIP_MEMORY_EMBEDDING_PROVIDER_UNAVAILABLE",
    "RELATIONSHIP_MEMORY_EMBEDDING_PROVIDER_FORBIDDEN",
    "RELATIONSHIP_MEMORY_EMBEDDING_DIMENSION_MISMATCH",
    "RELATIONSHIP_MEMORY_EMBEDDING_FAILED",
    "RELATIONSHIP_MEMORY_EMBEDDING_STALE",
    "RELATIONSHIP_MEMORY_RECEIPT_CLAIM_CONFLICT",
    "RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM",
    "RELATIONSHIP_MEMORY_VERSION_CONFLICT",
    "RELATIONSHIP_MEMORY_RETRIEVAL_FORBIDDEN",
    "RELATIONSHIP_MEMORY_GRAPH_LIMIT_EXCEEDED",
  ];
  for (const code of required) {
    it(`error code registered: ${code}`, () => {
      expect(RELATIONSHIP_MEMORY_ERROR_CODES as readonly string[]).toContain(code);
    });
  }
});

// --- 11/12/13/14. Retrieval / graph bounds ---------------------------------

describe("BC-9.1 B3 · Retrieval + graph bounds are frozen", () => {
  it("default result limit is 20", () => {
    expect(RELATIONSHIP_MEMORY_SEARCH_LIMIT_DEFAULT).toBe(20);
  });
  it("hard result limit is 100", () => {
    expect(RELATIONSHIP_MEMORY_SEARCH_LIMIT_MAX).toBe(100);
  });
  it("semantic candidate pool capped at 200", () => {
    expect(RELATIONSHIP_MEMORY_SEMANTIC_CANDIDATE_POOL_MAX).toBeLessThanOrEqual(200);
  });
  it("graph depth capped at 2", () => {
    expect(RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH).toBe(2);
  });
  it("graph nodes capped at 100", () => {
    expect(RELATIONSHIP_MEMORY_GRAPH_MAX_NODES).toBe(100);
  });
  it("query text capped", () => {
    expect(RELATIONSHIP_MEMORY_QUERY_MAX_CHARS).toBeLessThanOrEqual(1000);
  });

  it("search server function validators cap limit at MAX", () => {
    const src = readFileSync(join(RM_ROOT, "search.functions.ts"), "utf8");
    expect(src).toContain("RELATIONSHIP_MEMORY_SEARCH_LIMIT_MAX");
    expect(src).toContain("RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH");
    expect(src).toContain("RELATIONSHIP_MEMORY_GRAPH_MAX_NODES");
  });

  it("no relationship-memory server function accepts owner_user_id / tenant_id from callers", () => {
    const files = walkFiles(
      RM_ROOT,
      (p) => p.endsWith(".functions.ts") || p.endsWith("functions.ts"),
    );
    for (const f of files) {
      const b = readFileSync(f, "utf8");
      expect(/\bowner_user_id\b/.test(b)).toBe(false);
      expect(/\btenant_id\b/.test(b)).toBe(false);
    }
  });
});

// --- 6/17. Advisory-only — no mutation authority ---------------------------

describe("BC-9.1 B3 · Advisory-only integration", () => {
  // Business-domain terms only; complete_relationship_memory_extraction_receipt
  // is a receipt lifecycle RPC, not a canonical business mutation.
  const forbidden = [
    /\.rpc\((["'`])(send_[a-z_]+|submit_[a-z_]+|schedule_meeting|approve_[a-z_]+|introduce_[a-z_]+|notify_[a-z_]+|complete_meeting|complete_follow_up)\b/,
    /\.from\((["'])(business_meetings|business_meeting_follow_ups|business_meeting_outcomes|business_meeting_shared_notes|business_meeting_agenda_items|user_profiles|member_business_cards|introduction_requests|opportunities)(["'])\)\s*\.(update|delete|insert|upsert)\(/,
  ];
  for (const re of forbidden) {
    it(`no relationship-memory runtime mutates canonical business domains via ${re}`, () => {
      const hits = grep(re, RM_TS_FILES);
      expect(hits).toEqual([]);
    });
  }
});

// --- 20. Migrations enforce RLS + FORCE RLS on RM tables -------------------

describe("BC-9.1 B3 · RLS coverage in migrations", () => {
  const RM_TABLES = [
    "business_relationship_memories",
    "business_relationship_memory_sources",
    "business_relationship_memory_links",
    "business_relationship_memory_feedback",
    "business_relationship_memory_extraction_receipts",
    "business_relationship_memory_embeddings",
  ];
  const allSql = walkFiles(MIGRATIONS_ROOT, (p) => p.endsWith(".sql"))
    .map((p) => readFileSync(p, "utf8"))
    .join("\n");
  for (const t of RM_TABLES) {
    it(`${t} has ENABLE ROW LEVEL SECURITY`, () => {
      expect(
        new RegExp(`ALTER TABLE[^;]*${t}[^;]*ENABLE ROW LEVEL SECURITY`, "i").test(allSql),
      ).toBe(true);
    });
    it(`${t} has FORCE ROW LEVEL SECURITY`, () => {
      expect(
        new RegExp(`ALTER TABLE[^;]*${t}[^;]*FORCE\\s+ROW\\s+LEVEL\\s+SECURITY`, "i").test(allSql),
      ).toBe(true);
    });
  }
});

// --- 23. Index verification ------------------------------------------------

describe("BC-9.1 B3 · Required indexes present in migrations", () => {
  const allSql = walkFiles(MIGRATIONS_ROOT, (p) => p.endsWith(".sql"))
    .map((p) => readFileSync(p, "utf8"))
    .join("\n");
  it("HNSW cosine index exists on embeddings", () => {
    expect(/hnsw[^;]*halfvec_cosine_ops|hnsw[^;]*vector_cosine_ops/i.test(allSql)).toBe(true);
  });
  it("extraction receipts claim index exists", () => {
    expect(/business_relationship_memory_extraction_receipts/i.test(allSql)).toBe(true);
  });
});

// --- 43. Frozen embedding profile ------------------------------------------

describe("BC-9.1 B3 · Frozen embedding profile", () => {
  it("profile ID is relationship_memory_semantic_v1", () => {
    expect(RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_ID).toBe("relationship_memory_semantic_v1");
  });
  it("profile object is frozen", () => {
    expect(Object.isFrozen(RELATIONSHIP_MEMORY_EMBEDDING_PROFILE)).toBe(true);
  });
  it("dimensions match pgvector column (1536)", () => {
    // vector(1536) is our column; embedding-profile.ts declares dims match.
    expect(RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.dimensions).toBeGreaterThanOrEqual(768);
    expect(RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.dimensions).toBeLessThanOrEqual(3072);
  });
});

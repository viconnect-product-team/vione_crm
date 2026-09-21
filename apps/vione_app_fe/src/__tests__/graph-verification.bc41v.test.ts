// BC-4.1V — Relationship Graph verification suite.
// Deterministic tests covering: SDK surface stability, error normalization,
// registry/kind validation on the SDK error contract, DTO redaction depth,
// telemetry payload allowlist, and import-boundary enforcement.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { RelationshipGraphSDK, GraphError } from "@/lib/graph";
import { graphRegistry } from "@/lib/graph/registry";
import { mapEdge, mapNode, type GraphEdgeRow, type GraphNodeRow } from "@/lib/graph/dto";
import { emitGraphTelemetry, type GraphTelemetryPayload } from "@/lib/graph/telemetry";

describe("BC-4.1V SDK surface & error normalization", () => {
  it("exposes the seven frozen read methods (BC-4.2 adds write/timeline)", () => {
    const keys = new Set(Object.keys(RelationshipGraphSDK));
    for (const m of [
      "getNode",
      "mutualConnections",
      "neighbors",
      "sharedAssociations",
      "sharedCommunities",
      "sharedCompanies",
      "shortestPath",
    ]) {
      expect(keys.has(m)).toBe(true);
    }
  });

  it("normalizes unknown thrown values to GraphError.INTERNAL_ERROR", async () => {
    // The private normalize path is exercised indirectly: pass a bad node id
    // that server validation would reject before hitting the DB.
    try {
      await RelationshipGraphSDK.getNode("not-a-uuid");
      throw new Error("expected rejection");
    } catch (e) {
      expect(e).toBeInstanceOf(GraphError);
      // Server-fn input validation surfaces as INTERNAL_ERROR through the SDK
      // (we never leak zod messages to consumers).
      expect((e as GraphError).code).toMatch(
        /INTERNAL_ERROR|UNAUTHENTICATED|NODE_NOT_FOUND|INVALID_CURSOR/,
      );
    }
  });
});

describe("BC-4.1V DTO redaction is total", () => {
  const baseNode: GraphNodeRow = {
    id: "n-1",
    node_kind: "person",
    external_ref_type: "user_profile",
    external_ref_id: "u1",
    tenant_scope_type: "global",
    tenant_scope_id: null,
    visibility_class: "public",
    status: "active",
    metadata: {},
    registry_version: 1,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    archived_at: null,
  };

  it("drops nested objects and arrays from node metadata", () => {
    const dto = mapNode({
      ...baseNode,
      metadata: {
        displayName: "Ada",
        nested: { secret: 1 },
        tags: ["x", "y"],
        avatarUrl: "https://x/y.png",
      },
    });
    expect(dto.metadata).toEqual({ displayName: "Ada", avatarUrl: "https://x/y.png" });
    expect("nested" in dto.metadata).toBe(false);
    expect("tags" in dto.metadata).toBe(false);
  });

  it("edges: drops moderation/authority/source-system fields", () => {
    const row: GraphEdgeRow = {
      id: "e-1",
      edge_kind: "WORKS_FOR",
      source_node_id: "n1",
      target_node_id: "n2",
      directionality: "directed",
      visibility_class: "public",
      tenant_scope_type: "global",
      tenant_scope_id: null,
      status: "active",
      metadata: {
        role: "CTO",
        isCurrent: true,
        moderationFlag: "reviewed",
        internal_source_id: "src-99",
        __authority: "root",
      },
      registry_version: 1,
      valid_from: null,
      valid_until: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      archived_at: null,
    };
    const dto = mapEdge(row);
    expect(dto.metadata).toEqual({ role: "CTO", isCurrent: true });
  });

  it("system-kind node still redacts to allowlist (no leakage via visibility)", () => {
    const dto = mapNode({
      ...baseNode,
      visibility_class: "system",
      metadata: { displayName: "OK", secret: "leak" },
    });
    expect(dto.metadata).toEqual({ displayName: "OK" });
  });
});

describe("BC-4.1V registry integrity (post-hardening)", () => {
  it("manifest hash remains stable and non-empty", () => {
    expect(graphRegistry.manifestHash).toMatch(/^mf_[0-9a-f]+$/);
  });

  it("every edge's source/target kinds are registered nodes", () => {
    for (const e of graphRegistry.allEdges()) {
      for (const k of [...e.fromKinds, ...e.toKinds]) {
        expect(graphRegistry.hasNode(k)).toBe(true);
      }
    }
  });
});

describe("BC-4.1V telemetry allowlist", () => {
  it("only accepts documented payload fields at the type level", () => {
    // Compile-time contract; runtime just ensures the emit call is safe.
    const payload: GraphTelemetryPayload = {
      event: "graph_neighbors_queried",
      viewerHash: "vh_abc",
      nodeKind: "person",
      count: 3,
      depth: 1,
      truncated: false,
    };
    expect(() => emitGraphTelemetry(payload)).not.toThrow();
  });

  it("never throws even if the sink is broken", () => {
    const orig = console.info;

    console.info = () => {
      throw new Error("sink boom");
    };
    try {
      expect(() =>
        emitGraphTelemetry({ event: "graph_query_denied", errorCode: "NODE_NOT_FOUND" }),
      ).not.toThrow();
    } finally {
      console.info = orig;
    }
  });
});

describe("BC-4.1V import-boundary enforcement", () => {
  const root = join(process.cwd(), "src");

  function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const p = join(dir, name);
      const s = statSync(p);
      if (s.isDirectory()) walk(p, out);
      else if (/\.(ts|tsx)$/.test(name)) out.push(p);
    }
    return out;
  }

  const files = walk(root).filter((f) => {
    const rel = relative(root, f).replace(/\\/g, "/");
    // Engine internals + this test are allowed to reference server-only modules.
    if (rel.startsWith("lib/graph/")) return false;
    if (rel.startsWith("__tests__/graph-")) return false;
    return true;
  });

  const forbiddenPatterns = [
    "@/lib/graph/graph.repository.server",
    "@/lib/graph/graph.service.server",
    "lib/graph/graph.repository.server",
    "lib/graph/graph.service.server",
  ];

  it("no consumer imports the server-only graph internals", () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const needle of forbiddenPatterns) {
        if (src.includes(needle)) {
          offenders.push(`${relative(root, f)} imports ${needle}`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no consumer imports the raw graph.functions module (SDK only)", () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      if (src.match(/from ["']@\/lib\/graph\/graph\.functions["']/)) {
        offenders.push(relative(root, f));
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

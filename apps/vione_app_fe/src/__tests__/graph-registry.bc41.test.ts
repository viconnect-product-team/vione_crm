// BC-4.1 — Registry integrity & DTO redaction tests.
// Deterministic and framework-free.

import { describe, expect, it } from "vitest";
import { graphRegistry } from "@/lib/graph/registry";
import { mapEdge, mapNode, type GraphEdgeRow, type GraphNodeRow } from "@/lib/graph/dto";
import { GraphError } from "@/lib/graph/errors";

describe("BC-4.1 registry integrity", () => {
  it("loads without throwing and produces a stable manifest hash", () => {
    expect(graphRegistry.manifestHash).toMatch(/^mf_[0-9a-f]+$/);
    expect(graphRegistry.version).toBe(1);
  });

  it("registers frozen v1 node kinds", () => {
    for (const k of [
      "person",
      "company",
      "association",
      "community",
      "event",
      "meeting",
      "marketplace_listing",
      "opportunity",
      "project",
      "document",
      "location",
      "tag",
    ]) {
      expect(graphRegistry.hasNode(k)).toBe(true);
    }
  });

  it("registers frozen v1 edge kinds", () => {
    for (const k of [
      "CONNECTED_TO",
      "WORKS_FOR",
      "EMPLOYS",
      "MEMBER_OF",
      "HAS_MEMBER",
      "MANAGES",
      "MANAGED_BY",
      "ATTENDED",
      "HAD_ATTENDEE",
      "MET",
      "SAVED_CARD",
      "SAVED_BY",
      "FOLLOWED",
      "FOLLOWED_BY",
    ]) {
      expect(graphRegistry.hasEdge(k)).toBe(true);
    }
  });

  it("every directed edge with an inverse has a symmetric inverse registration", () => {
    for (const e of graphRegistry.allEdges()) {
      if (!e.inverse) continue;
      const inv = graphRegistry.getEdge(e.inverse);
      expect(inv, `missing inverse ${e.inverse}`).toBeDefined();
      expect(inv!.inverse).toBe(e.kind);
    }
  });

  it("edge kind references only registered node kinds", () => {
    for (const e of graphRegistry.allEdges()) {
      for (const k of [...e.fromKinds, ...e.toKinds]) {
        expect(graphRegistry.hasNode(k)).toBe(true);
      }
    }
  });

  it("registry entries are frozen (no runtime mutation)", () => {
    const p = graphRegistry.getNode("person")!;
    expect(Object.isFrozen(p)).toBe(true);
    expect(() => {
      (p as unknown as { kind: string }).kind = "hacked";
    }).toThrow();
  });
});

describe("BC-4.1 DTO metadata redaction", () => {
  it("drops fields outside the node metadata allowlist", () => {
    const row: GraphNodeRow = {
      id: "00000000-0000-0000-0000-000000000001",
      node_kind: "person",
      external_ref_type: "user_profile",
      external_ref_id: "u1",
      tenant_scope_type: "global",
      tenant_scope_id: null,
      visibility_class: "public",
      status: "active",
      metadata: {
        displayName: "Ada",
        email: "leak@example.com", // NOT allowlisted
        secretNote: "hidden", // NOT allowlisted
      },
      registry_version: 1,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      archived_at: null,
    };
    const dto = mapNode(row);
    expect(dto.metadata).toEqual({ displayName: "Ada" });
    expect("email" in dto.metadata).toBe(false);
    expect("secretNote" in dto.metadata).toBe(false);
  });

  it("drops fields outside the edge metadata allowlist", () => {
    const row: GraphEdgeRow = {
      id: "00000000-0000-0000-0000-000000000010",
      edge_kind: "WORKS_FOR",
      source_node_id: "n1",
      target_node_id: "n2",
      directionality: "directed",
      visibility_class: "public",
      tenant_scope_type: "global",
      tenant_scope_id: null,
      status: "active",
      metadata: { role: "CTO", salary: 999, isCurrent: true, privateNote: "x" },
      registry_version: 1,
      valid_from: null,
      valid_until: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      archived_at: null,
    };
    const dto = mapEdge(row);
    expect(dto.metadata).toEqual({ role: "CTO", isCurrent: true });
    expect("salary" in dto.metadata).toBe(false);
    expect("privateNote" in dto.metadata).toBe(false);
  });
});

describe("BC-4.1 error contract", () => {
  it("GraphError carries a stable code and never leaks SQL", () => {
    const e = new GraphError("NODE_NOT_FOUND");
    expect(e.code).toBe("NODE_NOT_FOUND");
    expect(e.message).toBe("NODE_NOT_FOUND");
    expect(String(e)).not.toMatch(/select|from|where/i);
  });
});

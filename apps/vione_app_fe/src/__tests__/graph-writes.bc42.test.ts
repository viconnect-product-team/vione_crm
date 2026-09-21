// BC-4.2 — Write, timeline and outbox contract tests.
// Framework-free registry / metadata / SDK boundary checks. Database RPC
// behavior is proven at migration time and by the authenticated E2E matrix.

import { describe, it, expect, vi } from "vitest";
import { graphRegistry } from "@/lib/graph/registry";
import { validateAndProject, timelineDedupeKey } from "@/lib/graph/metadata";
import { GraphError, graphErrorFromPg } from "@/lib/graph/errors";
import { RelationshipGraphSDK } from "@/lib/graph";

describe("BC-4.2 metadata validation", () => {
  it("keeps only allowlisted scalar keys", () => {
    const out = validateAndProject(
      { role: "cto", secret: "shh", isCurrent: true, nested: { x: 1 }, count: 3 },
      ["role", "isCurrent", "count"],
    );
    expect(out).toEqual({ role: "cto", isCurrent: true, count: 3 });
    expect("secret" in out).toBe(false);
    expect("nested" in out).toBe(false);
  });
  it("drops non-scalar values silently", () => {
    const out = validateAndProject({ tags: ["a", "b"] }, ["tags"]);
    expect(out).toEqual({});
  });
  it("truncates over-long strings", () => {
    const long = "x".repeat(1000);
    const out = validateAndProject({ role: long }, ["role"]);
    expect((out.role as string).length).toBeLessThanOrEqual(512);
  });
  it("returns empty for null / non-object", () => {
    expect(validateAndProject(null, ["a"])).toEqual({});
    expect(validateAndProject(undefined, ["a"])).toEqual({});
  });
});

describe("BC-4.2 timeline dedupe key", () => {
  it("is deterministic per edge id", () => {
    expect(timelineDedupeKey("abc")).toBe("edge:abc");
    expect(timelineDedupeKey("abc")).toBe(timelineDedupeKey("abc"));
  });
});

describe("BC-4.2 error contract", () => {
  it("maps known Postgres codes to stable GraphError codes", () => {
    const e = graphErrorFromPg({ message: "SELF_EDGE_FORBIDDEN: bad" });
    expect(e).toBeInstanceOf(GraphError);
    expect(e.code).toBe("SELF_EDGE_FORBIDDEN");
  });
  it("collapses unique_violation to EDGE_ALREADY_EXISTS", () => {
    const e = graphErrorFromPg({ message: "duplicate key value violates unique constraint" });
    expect(e.code).toBe("EDGE_ALREADY_EXISTS");
  });
  it("maps permission denied to WRITE_FORBIDDEN", () => {
    const e = graphErrorFromPg({ message: "permission denied for function" });
    expect(e.code).toBe("WRITE_FORBIDDEN");
  });
  it("falls back to INTERNAL_ERROR without leaking messages", () => {
    const e = graphErrorFromPg({ message: "some SQL detail: table graph_nodes" });
    expect(e.code).toBe("INTERNAL_ERROR");
    expect(e.message).toBe("INTERNAL_ERROR");
  });
});

describe("BC-4.2 SDK write surface", () => {
  it("exposes the frozen write and timeline methods", () => {
    for (const method of [
      "registerNode",
      "createEdge",
      "connect",
      "disconnect",
      "archiveEdge",
      "restoreEdge",
      "updateEdgeMetadata",
      "timeline",
      "pairTimeline",
      "history",
    ] as const) {
      expect(typeof RelationshipGraphSDK[method]).toBe("function");
    }
  });
  it("preserves the frozen read methods", () => {
    for (const method of [
      "getNode",
      "neighbors",
      "mutualConnections",
      "sharedCompanies",
      "sharedAssociations",
      "sharedCommunities",
      "shortestPath",
    ] as const) {
      expect(typeof RelationshipGraphSDK[method]).toBe("function");
    }
  });
});

describe("BC-4.2 registry write compatibility", () => {
  it("CONNECTED_TO is registered, undirected, timeline-emitting", () => {
    const e = graphRegistry.getEdge("CONNECTED_TO")!;
    expect(e).toBeDefined();
    expect(e.directionality).toBe("undirected");
    expect(e.timeline).toBe(true);
  });
  it("rejects unregistered edge kinds via SDK-side registry check parity", () => {
    expect(graphRegistry.getEdge("NOT_A_KIND")).toBeUndefined();
  });
  it("timeline dedupe stays scoped to the underlying edge", () => {
    const a = timelineDedupeKey("edge-1");
    const b = timelineDedupeKey("edge-2");
    expect(a).not.toBe(b);
  });
});

describe("BC-4.2 telemetry never receives raw metadata", () => {
  it("emitGraphTelemetry payload keys remain allowlisted", async () => {
    const { emitGraphTelemetry } = await import("@/lib/graph/telemetry");
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    emitGraphTelemetry({ event: "graph_edge_created", edgeKind: "CONNECTED_TO" });
    const arg = spy.mock.calls[0]?.[1] as string;
    const parsed = JSON.parse(arg);
    for (const k of Object.keys(parsed)) {
      expect([
        "event",
        "viewerHash",
        "nodeKind",
        "edgeKind",
        "count",
        "depth",
        "errorCode",
        "truncated",
      ]).toContain(k);
    }
    spy.mockRestore();
  });
});

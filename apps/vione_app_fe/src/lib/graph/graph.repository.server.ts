// BC-4.1 — Relationship Graph Engine — Read repository (server-only).
// The ONLY layer that touches graph_nodes / graph_edges. All rows returned
// here are already RLS-filtered; the Service layer applies redaction and
// registry validation on top.

import type { SupabaseClient } from "@supabase/supabase-js";
import { graphErr } from "./errors";
import type { GraphEdgeRow, GraphNodeRow } from "./dto";
import type { Direction, EdgeKind, NodeKind } from "./types";

export const REPO_LIMITS = {
  defaultLimit: 25,
  maxLimit: 100,
  maxPathDepth: 4,
  maxPathFanOut: 50,
} as const;

type SB = SupabaseClient;

function decodeCursor(cursor: string | null | undefined): string | null {
  if (!cursor) return null;
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
    if (typeof decoded?.after === "string") return decoded.after;
    return null;
  } catch {
    throw graphErr("INVALID_CURSOR");
  }
}
function encodeCursor(after: string | null): string | null {
  if (!after) return null;
  return Buffer.from(JSON.stringify({ after })).toString("base64");
}

function clampLimit(limit?: number): number {
  const n = limit ?? REPO_LIMITS.defaultLimit;
  if (!Number.isFinite(n) || n <= 0) throw graphErr("LIMIT_EXCEEDED");
  return Math.min(n, REPO_LIMITS.maxLimit);
}

export interface RepoNeighborsInput {
  nodeId: string;
  edgeKinds?: EdgeKind[];
  nodeKinds?: NodeKind[];
  direction: Direction;
  cursor?: string | null;
  limit?: number;
}

export interface RepoNeighborsResult {
  rows: Array<{ edge: GraphEdgeRow; node: GraphNodeRow }>;
  nextCursor: string | null;
}

export class RelationshipGraphRepository {
  constructor(private readonly sb: SB) {}

  async getNode(id: string): Promise<GraphNodeRow | null> {
    const { data, error } = await this.sb
      .from("graph_nodes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw graphErr("INTERNAL_ERROR");
    return (data as GraphNodeRow | null) ?? null;
  }

  async getNodes(ids: string[]): Promise<GraphNodeRow[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.sb.from("graph_nodes").select("*").in("id", ids);
    if (error) throw graphErr("INTERNAL_ERROR");
    return (data as GraphNodeRow[]) ?? [];
  }

  async findNodeByExternalRef(
    nodeKind: NodeKind,
    externalRefType: string,
    externalRefId: string,
  ): Promise<GraphNodeRow | null> {
    const { data, error } = await this.sb
      .from("graph_nodes")
      .select("*")
      .eq("node_kind", nodeKind)
      .eq("external_ref_type", externalRefType)
      .eq("external_ref_id", externalRefId)
      .maybeSingle();
    if (error) throw graphErr("INTERNAL_ERROR");
    return (data as GraphNodeRow | null) ?? null;
  }

  async getEdge(id: string): Promise<GraphEdgeRow | null> {
    const { data, error } = await this.sb
      .from("graph_edges")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw graphErr("INTERNAL_ERROR");
    return (data as GraphEdgeRow | null) ?? null;
  }

  async listNeighbors(input: RepoNeighborsInput): Promise<RepoNeighborsResult> {
    const limit = clampLimit(input.limit);
    const after = decodeCursor(input.cursor);

    // Direction → which side matches `nodeId`
    const dir = input.direction ?? "any";
    let edgeQuery = this.sb
      .from("graph_edges")
      .select("*")
      .eq("status", "active")
      .is("archived_at", null);

    if (dir === "outgoing") {
      edgeQuery = edgeQuery.eq("source_node_id", input.nodeId);
    } else if (dir === "incoming") {
      edgeQuery = edgeQuery.eq("target_node_id", input.nodeId);
    } else {
      edgeQuery = edgeQuery.or(
        `source_node_id.eq.${input.nodeId},target_node_id.eq.${input.nodeId}`,
      );
    }

    if (input.edgeKinds?.length) {
      edgeQuery = edgeQuery.in("edge_kind", input.edgeKinds);
    }
    if (after) edgeQuery = edgeQuery.gt("id", after);
    edgeQuery = edgeQuery.order("id", { ascending: true }).limit(limit + 1);

    const { data: edges, error } = await edgeQuery;
    if (error) throw graphErr("INTERNAL_ERROR");
    const edgeRows = (edges as GraphEdgeRow[]) ?? [];

    const truncated = edgeRows.length > limit;
    const page = truncated ? edgeRows.slice(0, limit) : edgeRows;

    // Resolve counterpart nodes
    const counterpartIds = Array.from(
      new Set(
        page.map((e: any) => (e.source_node_id === input.nodeId ? e.target_node_id : e.source_node_id)),
      ),
    );
    const nodes = await this.getNodes(counterpartIds);
    const nodeMap = new Map(nodes.map((n: any) => [n.id, n]));

    const rows = page
      .map((edge) => {
        const cid =
          edge.source_node_id === input.nodeId ? edge.target_node_id : edge.source_node_id;
        const node = nodeMap.get(cid);
        if (!node) return null;
        if (input.nodeKinds?.length && !input.nodeKinds.includes(node.node_kind)) return null;
        return { edge, node };
      })
      .filter((v): v is { edge: GraphEdgeRow; node: GraphNodeRow } => v !== null);

    const nextCursor = truncated ? encodeCursor(page[page.length - 1]?.id ?? null) : null;
    return { rows, nextCursor };
  }

  /** Bounded neighbor id list — used by mutuals / shared / shortestPath. */
  async neighborIds(
    nodeId: string,
    opts: { edgeKinds?: EdgeKind[]; nodeKinds?: NodeKind[] } = {},
  ): Promise<string[]> {
    let q = this.sb
      .from("graph_edges")
      .select("source_node_id,target_node_id,edge_kind")
      .eq("status", "active")
      .is("archived_at", null)
      .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`)
      .limit(REPO_LIMITS.maxPathFanOut * 4);
    if (opts.edgeKinds?.length) q = q.in("edge_kind", opts.edgeKinds);
    const { data, error } = await q;
    if (error) throw graphErr("INTERNAL_ERROR");
    const ids = new Set<string>();
    for (const row of (data ?? []) as Pick<GraphEdgeRow, "source_node_id" | "target_node_id">[]) {
      ids.add(row.source_node_id === nodeId ? row.target_node_id : row.source_node_id);
    }
    if (!opts.nodeKinds?.length) return [...ids];
    const nodes = await this.getNodes([...ids]);
    return nodes.filter((n) => opts.nodeKinds!.includes(n.node_kind)).map((n: any) => n.id);
  }

  /**
   * BC-4.4 optimization — bounded neighbor ids for many source nodes in a
   * single round trip. Returns Map<nodeId, neighborIds[]>. RLS still filters.
   */
  async batchNeighborIds(
    nodeIds: string[],
    opts: { edgeKinds?: EdgeKind[]; nodeKinds?: NodeKind[]; perNodeCap?: number } = {},
  ): Promise<Map<string, string[]>> {
    const out = new Map<string, string[]>();
    if (nodeIds.length === 0) return out;
    const set = new Set(nodeIds);
    const cap = Math.max(1, opts.perNodeCap ?? REPO_LIMITS.maxPathFanOut);
    const csv = nodeIds.join(",");
    let q = this.sb
      .from("graph_edges")
      .select("source_node_id,target_node_id,edge_kind")
      .eq("status", "active")
      .is("archived_at", null)
      .or(`source_node_id.in.(${csv}),target_node_id.in.(${csv})`)
      .limit(Math.min(2000, nodeIds.length * cap * 2));
    if (opts.edgeKinds?.length) q = q.in("edge_kind", opts.edgeKinds);
    const { data, error } = await q;
    if (error) throw graphErr("INTERNAL_ERROR");

    const perNode = new Map<string, Set<string>>();
    for (const id of nodeIds) perNode.set(id, new Set());
    for (const row of (data ?? []) as Pick<GraphEdgeRow, "source_node_id" | "target_node_id">[]) {
      if (set.has(row.source_node_id)) {
        const s = perNode.get(row.source_node_id)!;
        if (s.size < cap) s.add(row.target_node_id);
      }
      if (set.has(row.target_node_id)) {
        const s = perNode.get(row.target_node_id)!;
        if (s.size < cap) s.add(row.source_node_id);
      }
    }

    if (opts.nodeKinds?.length) {
      const allIds = new Set<string>();
      for (const s of perNode.values()) for (const x of s) allIds.add(x);
      const nodes = await this.getNodes([...allIds]);
      const allowed = new Set(
        nodes.filter((n) => opts.nodeKinds!.includes(n.node_kind)).map((n: any) => n.id),
      );
      for (const [k, s] of perNode) {
        out.set(
          k,
          [...s].filter((x: any) => allowed.has(x)),
        );
      }
    } else {
      for (const [k, s] of perNode) out.set(k, [...s]);
    }
    return out;
  }
}

// BC-4.1 — Relationship Graph Engine — Read service (server-only).
// Sole owner of graph semantics: registry validation, visibility resolution,
// traversal limits, DTO mapping and telemetry. UI never touches this — the
// SDK sits above it.

import type { SupabaseClient } from "@supabase/supabase-js";
import { graphErr, GraphError } from "./errors";
import { graphRegistry } from "./registry";
import { mapEdge, mapNode } from "./dto";
import { emitGraphTelemetry } from "./telemetry";
import {
  RelationshipGraphRepository,
  REPO_LIMITS,
  type RepoNeighborsInput,
} from "./graph.repository.server";
import type {
  GraphCursorPage,
  GraphMutualDTO,
  GraphNeighborDTO,
  GraphNodeDTO,
  GraphPathDTO,
  GraphSharedNodeDTO,
  MutualQuery,
  NeighborsQuery,
  SharedNodesQuery,
  ShortestPathQuery,
  Direction,
  EdgeKind,
  NodeKind,
} from "./types";

export class RelationshipGraphService {
  private readonly repo: RelationshipGraphRepository;

  constructor(
    sb: SupabaseClient,
    private readonly viewerUserId: string | null,
  ) {
    this.repo = new RelationshipGraphRepository(sb);
  }

  private requireViewer(): string {
    if (!this.viewerUserId) throw graphErr("UNAUTHENTICATED");
    return this.viewerUserId;
  }

  private validateEdgeKinds(kinds: EdgeKind[] | undefined) {
    if (!kinds?.length) return;
    for (const k of kinds) {
      if (!graphRegistry.hasEdge(k)) throw graphErr("INVALID_EDGE_KIND", undefined, { kind: k });
    }
  }
  private validateNodeKinds(kinds: NodeKind[] | undefined) {
    if (!kinds?.length) return;
    for (const k of kinds) {
      if (!graphRegistry.hasNode(k)) throw graphErr("INVALID_NODE_KIND", undefined, { kind: k });
    }
  }
  private validateDirection(dir: Direction | undefined): Direction {
    const d = dir ?? "any";
    if (d !== "outgoing" && d !== "incoming" && d !== "any") throw graphErr("INVALID_DIRECTION");
    return d;
  }

  async getNode(nodeId: string): Promise<GraphNodeDTO> {
    this.requireViewer();
    const row = await this.repo.getNode(nodeId);
    if (!row) {
      emitGraphTelemetry({ event: "graph_query_denied", errorCode: "NODE_NOT_FOUND" });
      throw graphErr("NODE_NOT_FOUND");
    }
    emitGraphTelemetry({ event: "graph_node_read", nodeKind: row.node_kind });
    return mapNode(row);
  }

  async neighbors(q: NeighborsQuery): Promise<GraphCursorPage<GraphNeighborDTO>> {
    this.requireViewer();
    this.validateEdgeKinds(q.edgeKinds);
    this.validateNodeKinds(q.nodeKinds);
    const direction = this.validateDirection(q.direction);

    const input: RepoNeighborsInput = {
      nodeId: q.nodeId,
      edgeKinds: q.edgeKinds,
      nodeKinds: q.nodeKinds,
      direction,
      cursor: q.cursor,
      limit: q.limit,
    };
    const res = await this.repo.listNeighbors(input);
    emitGraphTelemetry({
      event: "graph_neighbors_queried",
      count: res.rows.length,
      truncated: res.nextCursor !== null,
    });
    return {
      items: res.rows.map(({ edge, node }) => ({ edge: mapEdge(edge), node: mapNode(node) })),
      nextCursor: res.nextCursor,
    };
  }

  async mutualConnections(q: MutualQuery): Promise<GraphCursorPage<GraphMutualDTO>> {
    this.requireViewer();
    this.validateEdgeKinds(q.edgeKinds);
    const [a, b] = await Promise.all([
      this.repo.neighborIds(q.nodeA, { edgeKinds: q.edgeKinds }),
      this.repo.neighborIds(q.nodeB, { edgeKinds: q.edgeKinds }),
    ]);
    const bSet = new Set(b);
    const commonIds = a.filter((id) => bSet.has(id));
    const limit = Math.min(q.limit ?? REPO_LIMITS.defaultLimit, REPO_LIMITS.maxLimit);
    const page = commonIds.slice(0, limit);
    const nodes = await this.repo.getNodes(page);
    emitGraphTelemetry({ event: "graph_mutuals_queried", count: nodes.length });
    return {
      items: nodes.map((n: any) => ({ node: mapNode(n), viaEdgeKinds: q.edgeKinds ?? [] })),
      nextCursor: commonIds.length > limit ? "eof" : null,
    };
  }

  async sharedCompanies(q: SharedNodesQuery): Promise<GraphCursorPage<GraphSharedNodeDTO>> {
    return this.sharedByNodeKind(q, "company", ["WORKS_FOR"]);
  }
  async sharedAssociations(q: SharedNodesQuery): Promise<GraphCursorPage<GraphSharedNodeDTO>> {
    return this.sharedByNodeKind(q, "association", ["MEMBER_OF"]);
  }
  async sharedCommunities(q: SharedNodesQuery): Promise<GraphCursorPage<GraphSharedNodeDTO>> {
    return this.sharedByNodeKind(q, "community", ["MEMBER_OF"]);
  }

  private async sharedByNodeKind(
    q: SharedNodesQuery,
    kind: NodeKind,
    edgeKinds: EdgeKind[],
  ): Promise<GraphCursorPage<GraphSharedNodeDTO>> {
    this.requireViewer();
    const [a, b] = await Promise.all([
      this.repo.neighborIds(q.nodeA, { edgeKinds, nodeKinds: [kind] }),
      this.repo.neighborIds(q.nodeB, { edgeKinds, nodeKinds: [kind] }),
    ]);
    const bSet = new Set(b);
    const commonIds = a.filter((id) => bSet.has(id));
    const limit = Math.min(q.limit ?? REPO_LIMITS.defaultLimit, REPO_LIMITS.maxLimit);
    const page = commonIds.slice(0, limit);
    const nodes = await this.repo.getNodes(page);
    emitGraphTelemetry({
      event: "graph_shared_nodes_queried",
      nodeKind: kind,
      count: nodes.length,
    });
    return {
      items: nodes.map((n: any) => ({ node: mapNode(n), viaEdgeKinds: edgeKinds })),
      nextCursor: commonIds.length > limit ? "eof" : null,
    };
  }

  async shortestPath(q: ShortestPathQuery): Promise<GraphPathDTO> {
    this.requireViewer();
    this.validateEdgeKinds(q.edgeKinds);
    this.validateNodeKinds(q.nodeKinds);
    const maxDepth = Math.min(q.maxDepth ?? REPO_LIMITS.maxPathDepth, REPO_LIMITS.maxPathDepth);

    if (q.fromNodeId === q.toNodeId) throw graphErr("PATH_NOT_FOUND");

    // BC-4.4: BFS batches neighbor lookups per depth level to eliminate N+1.
    const visited = new Map<string, string>(); // childId -> parentId
    visited.set(q.fromNodeId, "");
    let frontier: string[] = [q.fromNodeId];
    let depth = 0;
    let found = false;

    while (frontier.length > 0 && depth < maxDepth && !found) {
      const batch = await this.repo.batchNeighborIds(frontier, {
        edgeKinds: q.edgeKinds,
        nodeKinds: q.nodeKinds,
        perNodeCap: REPO_LIMITS.maxPathFanOut,
      });
      const nextFrontier: string[] = [];
      for (const parent of frontier) {
        const neighbors = batch.get(parent) ?? [];
        if (neighbors.length >= REPO_LIMITS.maxPathFanOut) {
          emitGraphTelemetry({
            event: "graph_query_truncated",
            errorCode: "DEPTH_EXCEEDED",
            depth,
          });
        }
        for (const nid of neighbors) {
          if (visited.has(nid)) continue;
          visited.set(nid, parent);
          if (nid === q.toNodeId) {
            found = true;
            break;
          }
          nextFrontier.push(nid);
        }
        if (found) break;
      }
      frontier = nextFrontier;
      depth++;
    }

    if (!found) {
      emitGraphTelemetry({ event: "graph_path_queried", errorCode: "PATH_NOT_FOUND" });
      throw graphErr("PATH_NOT_FOUND");
    }

    // Reconstruct path
    const pathIds: string[] = [];
    let cur: string | undefined = q.toNodeId;
    while (cur) {
      pathIds.unshift(cur);
      const parent = visited.get(cur);
      if (!parent) break;
      cur = parent;
    }

    const nodes = await this.repo.getNodes(pathIds);
    const byId = new Map(nodes.map((n: any) => [n.id, n]));
    const orderedNodes = pathIds
      .map((id: any) => byId.get(id))
      .filter((n): n is NonNullable<typeof n> => Boolean(n));
    if (orderedNodes.length !== pathIds.length) throw graphErr("PATH_NOT_FOUND");

    // Fetch one edge per hop (any active visible edge between the pair)
    const hops: GraphPathDTO["hops"] = [];
    for (let i = 0; i < pathIds.length - 1; i++) {
      const from = pathIds[i]!;
      const to = pathIds[i + 1]!;
      const edgeRow = await this.findEdgeBetween(from, to, q.edgeKinds);
      if (!edgeRow) throw graphErr("PATH_NOT_FOUND");
      hops.push({ fromNodeId: from, toNodeId: to, edge: mapEdge(edgeRow) });
    }

    emitGraphTelemetry({ event: "graph_path_queried", depth: hops.length });
    return {
      nodes: orderedNodes.map(mapNode),
      hops,
      length: hops.length,
    };
  }

  private async findEdgeBetween(a: string, b: string, edgeKinds?: EdgeKind[]) {
    const res = await this.repo.listNeighbors({
      nodeId: a,
      edgeKinds,
      direction: "any",
      limit: 1,
    });
    const match = res.rows.find((r) => r.node.id === b);
    return match?.edge ?? null;
  }
}

export { GraphError };

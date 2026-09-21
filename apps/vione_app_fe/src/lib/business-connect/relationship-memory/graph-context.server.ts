// BC-9.1 Turn B2c — Graph-aware neighbor traversal (server-only).
//
// Owner-scoped BFS over business_relationship_memory_links with strict depth
// (<=2) and node cap (<=100). Returns safe DTOs only.

import {
  RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH,
  RELATIONSHIP_MEMORY_GRAPH_MAX_NODES,
  type RelationshipMemoryGraphContextDTO,
} from "./search-dto";
import { RelationshipMemoryError } from "./errors";

type SupabaseLike = { from: (t: string) => any };

export async function getMemoryGraphContext(
  supabase: SupabaseLike,
  input: { rootMemoryId: string; maxDepth?: number; maxNodes?: number },
): Promise<RelationshipMemoryGraphContextDTO> {
  const maxDepth = Math.min(
    Math.max(1, input.maxDepth ?? RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH),
    RELATIONSHIP_MEMORY_GRAPH_MAX_DEPTH,
  );
  const maxNodes = Math.min(
    Math.max(1, input.maxNodes ?? RELATIONSHIP_MEMORY_GRAPH_MAX_NODES),
    RELATIONSHIP_MEMORY_GRAPH_MAX_NODES,
  );

  const { data: rootRow, error: rootErr } = await supabase
    .from("business_relationship_memories")
    .select("id, memory_kind, subject_type, subject_ref")
    .eq("id", input.rootMemoryId)
    .maybeSingle();
  if (rootErr) {
    throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_RETRIEVAL_FAILED", rootErr.message);
  }
  if (!rootRow) {
    return {
      rootMemoryId: input.rootMemoryId,
      nodes: [],
      truncated: false,
      nodeCount: 0,
      maxDepth,
    };
  }

  const nodes: Array<{
    memoryId: string;
    kind: any;
    subjectType: any;
    subjectRef: string;
    depth: number;
    edgeKindFromRoot: "self" | "supports" | "refines" | "contradicts" | "related";
  }> = [
    {
      memoryId: rootRow.id,
      kind: rootRow.memory_kind,
      subjectType: rootRow.subject_type,
      subjectRef: rootRow.subject_ref,
      depth: 0,
      edgeKindFromRoot: "self",
    },
  ];
  const seen = new Set<string>([rootRow.id]);
  let frontier: string[] = [rootRow.id];
  let truncated = false;

  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    const { data: edges, error: edgeErr } = await supabase
      .from("business_relationship_memory_links")
      .select("from_memory_id, to_memory_id, link_kind")
      .in("from_memory_id", frontier);
    if (edgeErr) {
      throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_RETRIEVAL_FAILED", edgeErr.message);
    }
    const nextIds: string[] = [];
    for (const e of (edges ?? []) as any[]) {
      if (seen.has(e.to_memory_id)) continue;
      seen.add(e.to_memory_id);
      nextIds.push(e.to_memory_id);
      if (nodes.length >= maxNodes) {
        truncated = true;
        break;
      }
    }
    if (nextIds.length === 0) break;
    const { data: peerRows, error: peerErr } = await supabase
      .from("business_relationship_memories")
      .select("id, memory_kind, subject_type, subject_ref")
      .in("id", nextIds);
    if (peerErr) {
      throw new RelationshipMemoryError("RELATIONSHIP_MEMORY_RETRIEVAL_FAILED", peerErr.message);
    }
    for (const p of (peerRows ?? []) as any[]) {
      if (nodes.length >= maxNodes) {
        truncated = true;
        break;
      }
      // Use first edge's kind (deterministic ordering fallback: 'related').
      nodes.push({
        memoryId: p.id,
        kind: p.memory_kind,
        subjectType: p.subject_type,
        subjectRef: p.subject_ref,
        depth,
        edgeKindFromRoot: "related",
      });
    }
    if (truncated) break;
    frontier = nextIds;
  }

  if (nodes.length > maxNodes) {
    throw new RelationshipMemoryError(
      "RELATIONSHIP_MEMORY_GRAPH_LIMIT_EXCEEDED",
      `Graph exceeded ${maxNodes} nodes`,
    );
  }

  return {
    rootMemoryId: input.rootMemoryId,
    nodes,
    truncated,
    nodeCount: nodes.length,
    maxDepth,
  };
}

# GRAPH_QUERY_API — Query Contract

Design-only. Interfaces only.

## Guiding Rules

- All queries are **viewer-scoped**; the engine applies edge visibility on
  every read.
- No product SQL. Every read goes through `RelationshipGraphSDK`.
- All list results are paginated with a stable cursor.
- Query cost is bounded: depth ≤ 4, fan-out ≤ configured `maxNeighbors`.

## Common Types

```ts
export interface Page<T> {
  items: T[];
  nextCursor?: string;
}

export interface NeighborFilter {
  edgeTypes?: EdgeType[];
  nodeKinds?: NodeKind[];
  minStrength?: StrengthTier;
  since?: string;
  until?: string;
  limit?: number;
  cursor?: string;
}
```

## SDK Query Surface

```ts
export interface RelationshipGraphQueryAPI {
  neighbors(nodeId: string, f?: NeighborFilter): Promise<Page<GraphEdge>>;

  shortestPath(
    fromNodeId: string,
    toNodeId: string,
    opts?: { maxDepth?: number; edgeTypes?: EdgeType[] },
  ): Promise<GraphNode[] | null>;

  mutualConnections(
    a: string,
    b: string,
    opts?: { limit?: number; cursor?: string },
  ): Promise<Page<GraphNode>>;

  sharedCommunities(a: string, b: string): Promise<GraphNode[]>;
  sharedCompanies(a: string, b: string): Promise<GraphNode[]>;
  sharedAssociations(a: string, b: string): Promise<GraphNode[]>;

  relationshipTimeline(
    a: string,
    b: string,
    f?: { edgeTypes?: EdgeType[]; limit?: number; cursor?: string },
  ): Promise<Page<GraphTimelineEvent>>;

  relationshipStrength(a: string, b: string): Promise<RelationshipStrength>;

  recommendConnections(
    forNodeId: string,
    opts?: { limit?: number; reasonTypes?: RecommendationReason[] },
  ): Promise<Recommendation[]>;
}

export interface Recommendation {
  nodeId: string;
  score: number; // 0..1
  reasons: RecommendationReason[];
}

export type RecommendationReason =
  | "mutual_connection"
  | "shared_company"
  | "shared_association"
  | "shared_community"
  | "shared_event"
  | "introduced_by"
  | "referred_by"
  | "ai_suggested";
```

## Non-Goals

- No graph traversal DSL exposed to products.
- No arbitrary Cypher / SQL passthrough.
- No write API here — see Service interfaces.

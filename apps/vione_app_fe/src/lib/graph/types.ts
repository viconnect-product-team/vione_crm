// BC-4.1 — Relationship Graph Engine — Consumer DTOs.
// Raw database rows are never returned; DTOs carry only allowlisted fields
// resolved through the registry's metadata contract.

export type NodeKind = string;
export type EdgeKind = string;

export type VisibilityClass =
  | "private"
  | "connected"
  | "association"
  | "community"
  | "public"
  | "system";

export type TenantScopeType = "global" | "association" | "community" | "tenant";
export type Direction = "outgoing" | "incoming" | "any";
export type Directionality = "directed" | "undirected";
export type NodeStatus = "active" | "archived" | "suspended";
export type EdgeStatus = "active" | "archived" | "revoked";

export interface ExternalRef {
  type: string;
  id: string;
}

export type GraphMetadata = Record<string, string | number | boolean | null>;

export interface GraphNodeDTO {
  id: string;
  kind: NodeKind;
  externalRef: ExternalRef;
  tenant: { type: TenantScopeType; id: string | null };
  visibility: VisibilityClass;
  metadata: GraphMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface GraphEdgeDTO {
  id: string;
  kind: EdgeKind;
  sourceNodeId: string;
  targetNodeId: string;
  directionality: Directionality;
  visibility: VisibilityClass;
  metadata: GraphMetadata;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GraphNeighborDTO {
  edge: GraphEdgeDTO;
  node: GraphNodeDTO;
}

export interface GraphMutualDTO {
  node: GraphNodeDTO;
  viaEdgeKinds: EdgeKind[];
}

export interface GraphSharedNodeDTO {
  node: GraphNodeDTO;
  viaEdgeKinds: EdgeKind[];
}

export interface GraphPathHop {
  fromNodeId: string;
  toNodeId: string;
  edge: GraphEdgeDTO;
}

export interface GraphPathDTO {
  nodes: GraphNodeDTO[];
  hops: GraphPathHop[];
  length: number;
}

export interface GraphCursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface NeighborsQuery {
  nodeId: string;
  edgeKinds?: EdgeKind[];
  nodeKinds?: NodeKind[];
  direction?: Direction;
  cursor?: string | null;
  limit?: number;
}

export interface MutualQuery {
  nodeA: string;
  nodeB: string;
  edgeKinds?: EdgeKind[];
  cursor?: string | null;
  limit?: number;
}

export interface SharedNodesQuery {
  nodeA: string;
  nodeB: string;
  cursor?: string | null;
  limit?: number;
}

export interface ShortestPathQuery {
  fromNodeId: string;
  toNodeId: string;
  edgeKinds?: EdgeKind[];
  nodeKinds?: NodeKind[];
  maxDepth?: number;
}

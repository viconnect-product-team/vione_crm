// BC-4.1 — Relationship Graph Engine — Registry implementation.
// Loads the frozen BC-4.0 node/edge manifest and enforces integrity at
// module-load time. Product code never mutates these registrations.

import type { EdgeKind, NodeKind, VisibilityClass, Directionality } from "./types";

export type Cardinality = "one-to-one" | "one-to-many" | "many-to-many";

export interface NodeKindRegistration {
  kind: NodeKind;
  version: number;
  label: string;
  pluralLabel: string;
  ownerDomain: string;
  externalRefType: string;
  visibilityDefault: VisibilityClass;
  supportsTimeline: boolean;
  supportsStrength: boolean;
  aiVisible: boolean;
  capabilities: string[];
  metadataAllowlist: readonly string[];
  aliases?: readonly string[];
  deprecated?: boolean;
}

export interface EdgeKindRegistration {
  kind: EdgeKind;
  version: number;
  fromKinds: NodeKind[];
  toKinds: NodeKind[];
  directionality: Directionality;
  inverse?: EdgeKind;
  cardinality: Cardinality;
  visibilityDefault: VisibilityClass;
  timeline: boolean;
  strength: "very_low" | "low" | "med" | "high" | "neg" | "none";
  aiVisible: boolean;
  capabilities: string[];
  metadataAllowlist: readonly string[];
  allowSelfEdge?: boolean;
  aliases?: readonly string[];
  deprecated?: boolean;
}

// ---------------- Frozen v1 node manifest ----------------
const NODE_MANIFEST: NodeKindRegistration[] = [
  {
    kind: "person",
    version: 1,
    label: "Person",
    pluralLabel: "People",
    ownerDomain: "identity",
    externalRefType: "user_profile",
    visibilityDefault: "public",
    supportsTimeline: true,
    supportsStrength: true,
    aiVisible: true,
    capabilities: ["cross_tenant"],
    metadataAllowlist: ["displayName", "headline", "avatarUrl"],
  },
  {
    kind: "company",
    version: 1,
    label: "Company",
    pluralLabel: "Companies",
    ownerDomain: "company",
    externalRefType: "company",
    visibilityDefault: "public",
    supportsTimeline: true,
    supportsStrength: true,
    aiVisible: true,
    capabilities: ["cross_tenant"],
    metadataAllowlist: ["name", "slug", "logoUrl"],
  },
  {
    kind: "association",
    version: 1,
    label: "Association",
    pluralLabel: "Associations",
    ownerDomain: "association",
    externalRefType: "association",
    visibilityDefault: "association",
    supportsTimeline: true,
    supportsStrength: false,
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: ["name", "slug"],
  },
  {
    kind: "community",
    version: 1,
    label: "Community",
    pluralLabel: "Communities",
    ownerDomain: "community",
    externalRefType: "community",
    visibilityDefault: "community",
    supportsTimeline: true,
    supportsStrength: false,
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: ["name", "slug"],
  },
  {
    kind: "event",
    version: 1,
    label: "Event",
    pluralLabel: "Events",
    ownerDomain: "events",
    externalRefType: "event",
    visibilityDefault: "association",
    supportsTimeline: true,
    supportsStrength: false,
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: ["title", "startsAt"],
  },
  {
    kind: "meeting",
    version: 1,
    label: "Meeting",
    pluralLabel: "Meetings",
    ownerDomain: "business-meetings",
    externalRefType: "business_meeting",
    visibilityDefault: "private",
    supportsTimeline: true,
    supportsStrength: true,
    aiVisible: false,
    capabilities: [],
    metadataAllowlist: ["title", "scheduledAt"],
  },
  {
    kind: "marketplace_listing",
    version: 1,
    label: "Listing",
    pluralLabel: "Listings",
    ownerDomain: "marketplace",
    externalRefType: "product",
    visibilityDefault: "public",
    supportsTimeline: true,
    supportsStrength: false,
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: ["title", "slug"],
  },
  {
    kind: "opportunity",
    version: 1,
    label: "Opportunity",
    pluralLabel: "Opportunities",
    ownerDomain: "opportunities",
    externalRefType: "opportunity",
    visibilityDefault: "association",
    supportsTimeline: true,
    supportsStrength: false,
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: ["title"],
  },
  {
    kind: "project",
    version: 1,
    label: "Project",
    pluralLabel: "Projects",
    ownerDomain: "projects",
    externalRefType: "project",
    visibilityDefault: "private",
    supportsTimeline: true,
    supportsStrength: false,
    aiVisible: false,
    capabilities: [],
    metadataAllowlist: ["title"],
  },
  {
    kind: "document",
    version: 1,
    label: "Document",
    pluralLabel: "Documents",
    ownerDomain: "documents",
    externalRefType: "document",
    visibilityDefault: "private",
    supportsTimeline: false,
    supportsStrength: false,
    aiVisible: false,
    capabilities: [],
    metadataAllowlist: ["title"],
  },
  {
    kind: "location",
    version: 1,
    label: "Location",
    pluralLabel: "Locations",
    ownerDomain: "geo",
    externalRefType: "location",
    visibilityDefault: "public",
    supportsTimeline: false,
    supportsStrength: false,
    aiVisible: true,
    capabilities: ["cross_tenant"],
    metadataAllowlist: ["name", "geo"],
  },
  {
    kind: "tag",
    version: 1,
    label: "Tag",
    pluralLabel: "Tags",
    ownerDomain: "taxonomy",
    externalRefType: "tag",
    visibilityDefault: "public",
    supportsTimeline: false,
    supportsStrength: false,
    aiVisible: true,
    capabilities: ["cross_tenant"],
    metadataAllowlist: ["slug", "label"],
  },
];

// ---------------- Frozen v1 edge manifest ----------------
const EDGE_MANIFEST: EdgeKindRegistration[] = [
  {
    kind: "CONNECTED_TO",
    version: 1,
    fromKinds: ["person"],
    toKinds: ["person"],
    directionality: "undirected",
    inverse: "CONNECTED_TO",
    cardinality: "many-to-many",
    visibilityDefault: "association",
    timeline: true,
    strength: "high",
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: ["source"],
  },
  {
    kind: "WORKS_FOR",
    version: 1,
    fromKinds: ["person"],
    toKinds: ["company"],
    directionality: "directed",
    inverse: "EMPLOYS",
    cardinality: "many-to-many",
    visibilityDefault: "public",
    timeline: true,
    strength: "med",
    aiVisible: true,
    capabilities: ["cross_tenant"],
    metadataAllowlist: ["role", "isCurrent"],
  },
  {
    kind: "EMPLOYS",
    version: 1,
    fromKinds: ["company"],
    toKinds: ["person"],
    directionality: "directed",
    inverse: "WORKS_FOR",
    cardinality: "many-to-many",
    visibilityDefault: "public",
    timeline: false,
    strength: "med",
    aiVisible: true,
    capabilities: ["cross_tenant"],
    metadataAllowlist: [],
  },
  {
    kind: "MEMBER_OF",
    version: 1,
    fromKinds: ["person"],
    toKinds: ["association", "community"],
    directionality: "directed",
    inverse: "HAS_MEMBER",
    cardinality: "many-to-many",
    visibilityDefault: "association",
    timeline: true,
    strength: "med",
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: ["role"],
  },
  {
    kind: "HAS_MEMBER",
    version: 1,
    fromKinds: ["association", "community"],
    toKinds: ["person"],
    directionality: "directed",
    inverse: "MEMBER_OF",
    cardinality: "many-to-many",
    visibilityDefault: "association",
    timeline: false,
    strength: "med",
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: [],
  },
  {
    kind: "MANAGES",
    version: 1,
    fromKinds: ["person"],
    toKinds: ["company", "community"],
    directionality: "directed",
    inverse: "MANAGED_BY",
    cardinality: "many-to-many",
    visibilityDefault: "public",
    timeline: true,
    strength: "med",
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: [],
  },
  {
    kind: "MANAGED_BY",
    version: 1,
    fromKinds: ["company", "community"],
    toKinds: ["person"],
    directionality: "directed",
    inverse: "MANAGES",
    cardinality: "many-to-many",
    visibilityDefault: "public",
    timeline: false,
    strength: "med",
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: [],
  },
  {
    kind: "ATTENDED",
    version: 1,
    fromKinds: ["person"],
    toKinds: ["event"],
    directionality: "directed",
    inverse: "HAD_ATTENDEE",
    cardinality: "many-to-many",
    visibilityDefault: "association",
    timeline: true,
    strength: "low",
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: ["ticketType"],
  },
  {
    kind: "HAD_ATTENDEE",
    version: 1,
    fromKinds: ["event"],
    toKinds: ["person"],
    directionality: "directed",
    inverse: "ATTENDED",
    cardinality: "many-to-many",
    visibilityDefault: "association",
    timeline: false,
    strength: "low",
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: [],
  },
  {
    kind: "MET",
    version: 1,
    fromKinds: ["person"],
    toKinds: ["person"],
    directionality: "undirected",
    inverse: "MET",
    cardinality: "many-to-many",
    visibilityDefault: "private",
    timeline: true,
    strength: "high",
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: ["context"],
  },
  {
    kind: "SAVED_CARD",
    version: 1,
    fromKinds: ["person"],
    toKinds: ["person"],
    directionality: "directed",
    inverse: "SAVED_BY",
    cardinality: "many-to-many",
    visibilityDefault: "private",
    timeline: true,
    strength: "med",
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: ["source"],
  },
  {
    kind: "SAVED_BY",
    version: 1,
    fromKinds: ["person"],
    toKinds: ["person"],
    directionality: "directed",
    inverse: "SAVED_CARD",
    cardinality: "many-to-many",
    visibilityDefault: "private",
    timeline: false,
    strength: "med",
    aiVisible: true,
    capabilities: [],
    metadataAllowlist: [],
  },
  {
    kind: "FOLLOWED",
    version: 1,
    fromKinds: ["person"],
    toKinds: ["person", "company"],
    directionality: "directed",
    inverse: "FOLLOWED_BY",
    cardinality: "many-to-many",
    visibilityDefault: "public",
    timeline: false,
    strength: "low",
    aiVisible: true,
    capabilities: ["cross_tenant"],
    metadataAllowlist: [],
  },
  {
    kind: "FOLLOWED_BY",
    version: 1,
    fromKinds: ["person", "company"],
    toKinds: ["person"],
    directionality: "directed",
    inverse: "FOLLOWED",
    cardinality: "many-to-many",
    visibilityDefault: "public",
    timeline: false,
    strength: "low",
    aiVisible: true,
    capabilities: ["cross_tenant"],
    metadataAllowlist: [],
  },
];

// ---------------- Registry class ----------------
class Registry {
  private nodes = new Map<NodeKind, NodeKindRegistration>();
  private edges = new Map<EdgeKind, EdgeKindRegistration>();
  private nodeAliases = new Map<string, NodeKind>();
  private edgeAliases = new Map<string, EdgeKind>();
  readonly manifestHash: string;
  readonly version = 1;

  constructor(nodes: NodeKindRegistration[], edges: EdgeKindRegistration[]) {
    // Deterministic order
    const sortedNodes = [...nodes].sort((a, b) => a.kind.localeCompare(b.kind));
    const sortedEdges = [...edges].sort((a, b) => a.kind.localeCompare(b.kind));

    for (const n of sortedNodes) this.registerNode(n);
    for (const e of sortedEdges) this.registerEdge(e);

    this.validateInverses();
    this.manifestHash = this.computeHash(sortedNodes, sortedEdges);
    Object.freeze(this);
  }

  private registerNode(n: NodeKindRegistration) {
    if (this.nodes.has(n.kind)) {
      throw new Error(`[graph.registry] duplicate node kind: ${n.kind}`);
    }
    if (this.nodeAliases.has(n.kind)) {
      throw new Error(`[graph.registry] alias collision on node kind: ${n.kind}`);
    }
    this.nodes.set(n.kind, Object.freeze({ ...n, metadataAllowlist: [...n.metadataAllowlist] }));
    for (const alias of n.aliases ?? []) {
      if (this.nodeAliases.has(alias) || this.nodes.has(alias)) {
        throw new Error(`[graph.registry] alias collision: ${alias}`);
      }
      this.nodeAliases.set(alias, n.kind);
    }
  }

  private registerEdge(e: EdgeKindRegistration) {
    if (this.edges.has(e.kind)) {
      throw new Error(`[graph.registry] duplicate edge kind: ${e.kind}`);
    }
    for (const nk of [...e.fromKinds, ...e.toKinds]) {
      if (!this.nodes.has(nk)) {
        throw new Error(`[graph.registry] edge ${e.kind} references unknown node kind ${nk}`);
      }
    }
    this.edges.set(e.kind, Object.freeze({ ...e, metadataAllowlist: [...e.metadataAllowlist] }));
    for (const alias of e.aliases ?? []) {
      if (this.edgeAliases.has(alias) || this.edges.has(alias)) {
        throw new Error(`[graph.registry] alias collision: ${alias}`);
      }
      this.edgeAliases.set(alias, e.kind);
    }
  }

  private validateInverses() {
    for (const e of this.edges.values()) {
      if (!e.inverse) continue;
      const inv = this.edges.get(e.inverse);
      if (!inv) {
        throw new Error(`[graph.registry] edge ${e.kind} inverse ${e.inverse} not registered`);
      }
      if (inv.inverse !== e.kind) {
        throw new Error(`[graph.registry] inverse mismatch: ${e.kind} <-> ${e.inverse}`);
      }
      // Direction pairing
      const kindsMatch = arraysEq(inv.fromKinds, e.toKinds) && arraysEq(inv.toKinds, e.fromKinds);
      if (e.directionality === "directed" && !kindsMatch) {
        throw new Error(`[graph.registry] inverse kind pairing invalid for ${e.kind}`);
      }
    }
  }

  private computeHash(nodes: NodeKindRegistration[], edges: EdgeKindRegistration[]): string {
    const src = JSON.stringify({
      n: nodes.map((n: any) => [n.kind, n.version]),
      e: edges.map((e: any) => [e.kind, e.version, e.inverse ?? null]),
    });
    // Small non-crypto hash — deterministic for manifest tracking.
    let h = 5381;
    for (let i = 0; i < src.length; i++) h = ((h << 5) + h) ^ src.charCodeAt(i);
    return `mf_${(h >>> 0).toString(16)}`;
  }

  getNode(kind: NodeKind): NodeKindRegistration | undefined {
    return this.nodes.get(kind) ?? this.nodes.get(this.nodeAliases.get(kind) ?? "");
  }
  getEdge(kind: EdgeKind): EdgeKindRegistration | undefined {
    return this.edges.get(kind) ?? this.edges.get(this.edgeAliases.get(kind) ?? "");
  }
  hasNode(kind: NodeKind): boolean {
    return this.getNode(kind) !== undefined;
  }
  hasEdge(kind: EdgeKind): boolean {
    return this.getEdge(kind) !== undefined;
  }
  allNodes(): readonly NodeKindRegistration[] {
    return [...this.nodes.values()];
  }
  allEdges(): readonly EdgeKindRegistration[] {
    return [...this.edges.values()];
  }
}

function arraysEq(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

// Module-scope singleton; throws at load time on any validation failure.
export const graphRegistry = new Registry(NODE_MANIFEST, EDGE_MANIFEST);

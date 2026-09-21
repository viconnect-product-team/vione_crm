# GRAPH_EDGE_MODEL — Edge Taxonomy & Registry

Design-only. No storage.

## Edge Identity

```ts
export type EdgeType = string; // registry-checked

export interface GraphEdge {
  id: string;
  type: EdgeType;
  fromNodeId: string;
  toNodeId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdBy?: string; // actor node id (usually a person)
  weight?: number; // 0..1, optional per-edge modifier
  metadata?: Record<string, unknown>; // registry-validated shape
  visibility: EdgeVisibility; // resolved at write from registry + overrides
  validFrom?: string;
  validTo?: string; // for time-bounded edges (e.g. WORKS_FOR)
}

export type EdgeVisibility = "public" | "association" | "community" | "private" | "system";
```

## Frozen v1 Edge Types

| Type         | From → To                      | Direction  | Inverse       | Default Visibility | Timeline | Strength | AI  |
| ------------ | ------------------------------ | ---------- | ------------- | ------------------ | -------- | -------- | --- |
| CONNECTED_TO | Person → Person                | undirected | CONNECTED_TO  | association        | yes      | high     | y   |
| WORKS_FOR    | Person → Company               | directed   | EMPLOYS       | public             | yes      | med      | y   |
| MEMBER_OF    | Person → Association/Community | directed   | HAS_MEMBER    | association        | yes      | med      | y   |
| MANAGES      | Person → Company/Community     | directed   | MANAGED_BY    | public             | yes      | med      | y   |
| FOUNDED      | Person → Company               | directed   | FOUNDED_BY    | public             | yes      | low      | y   |
| ATTENDED     | Person → Event                 | directed   | HAD_ATTENDEE  | association        | yes      | low      | y   |
| MET          | Person → Person                | undirected | MET           | private            | yes      | high     | y   |
| INTRODUCED   | Person → Person (by actor)     | directed   | INTRODUCED_BY | private            | yes      | high     | y   |
| REFERRED     | Person → Person/Opportunity    | directed   | REFERRED_BY   | private            | yes      | high     | y   |
| PURCHASED    | Person → Listing               | directed   | PURCHASED_BY  | private            | yes      | med      | y   |
| SOLD         | Person → Listing               | directed   | SOLD_BY       | private            | yes      | med      | y   |
| LIKED        | Person → \*                    | directed   | LIKED_BY      | public             | no       | very_low | n   |
| FOLLOWED     | Person → Person/Company        | directed   | FOLLOWED_BY   | public             | no       | low      | y   |
| MESSAGED     | Person → Person                | directed   | —             | private            | no       | med      | y   |
| INVITED      | Person → Person/Event          | directed   | INVITED_BY    | private            | yes      | low      | y   |
| HOSTED       | Person/Company → Event         | directed   | HOSTED_BY     | public             | yes      | low      | y   |
| SPEAKER_AT   | Person → Event                 | directed   | HAD_SPEAKER   | public             | yes      | low      | y   |
| SPONSORED    | Company → Event/Community      | directed   | SPONSORED_BY  | public             | yes      | low      | y   |
| CHECKED_IN   | Person → Event/Location        | directed   | HAD_CHECKIN   | association        | yes      | low      | y   |
| VIEWED_CARD  | Person → Person(card)          | directed   | VIEWED_BY     | private            | no       | very_low | y   |
| SAVED_CARD   | Person → Person(card)          | directed   | SAVED_BY      | private            | yes      | med      | y   |
| BOOKMARKED   | Person → \*                    | directed   | BOOKMARKED_BY | private            | no       | very_low | n   |
| JOINED       | Person → Community/Assoc       | directed   | HAD_JOIN      | association        | yes      | med      | y   |
| LEFT         | Person → Community/Assoc       | directed   | HAD_LEAVE     | association        | yes      | neg      | y   |
| CUSTOM       | _ → _                          | any        | (declared)    | private            | opt      | opt      | opt |

`CUSTOM` is a reserved namespace; consumers must register a specific
sub-type before writing.

## Edge Registry Entry

```ts
export interface EdgeTypeRegistration {
  type: EdgeType;
  fromKinds: NodeKind[]; // allowed source kinds
  toKinds: NodeKind[]; // allowed target kinds
  direction: "directed" | "undirected";
  inverse?: EdgeType; // canonical inverse, if any
  cardinality: "one-to-one" | "one-to-many" | "many-to-many";
  visibilityDefault: EdgeVisibility;
  timeline: TimelineContribution; // see GRAPH_TIMELINE.md
  strength: StrengthContribution; // see GRAPH_STRENGTH_MODEL.md
  aiVisible: boolean;
  metadataSchema?: JSONSchema; // validated on write
  capabilities: string[]; // e.g. ["cross_tenant", "system"]
}
```

## Invariants

- Every edge write is validated against a registration.
- Direction / inverse / visibility are **derived** from the registry, never
  from the caller.
- Products MUST NOT embed edge semantics (`if (type === "MET") …`). Instead
  read `registration.timeline`, `registration.strength`, etc.
- Undirected edges are stored canonically (`fromNodeId < toNodeId`).
- Time-bounded edges (`WORKS_FOR`, `MEMBER_OF`, `JOINED`/`LEFT`) use
  `validFrom` / `validTo`; `LEFT` is emitted as a state event, not a
  separate persistent edge.

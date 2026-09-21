# GRAPH_NODE_MODEL — Node Taxonomy

Design-only. No storage in this slice.

## Frozen Node Types (v1)

| Type                | Key                   | Notes                        |
| ------------------- | --------------------- | ---------------------------- |
| Person              | `person`              | Backed by `user_profiles`    |
| Company             | `company`             | Backed by `companies`        |
| Association         | `association`         | Multi-tenant org             |
| Community           | `community`           | Interest / cohort            |
| Event               | `event`               | Time-bound gathering         |
| Meeting             | `meeting`             | 1:1 or small-group encounter |
| Marketplace Listing | `marketplace_listing` | Product / service            |
| Opportunity         | `opportunity`         | Deal / RFQ                   |
| Project             | `project`             | Multi-party workstream       |
| Document            | `document`            | Shared artifact              |
| Location            | `location`            | Geo / venue                  |
| Tag                 | `tag`                 | Semantic label node          |

The taxonomy is **extensible**: additional node types register via the
Extension Registry (`kind`, display metadata, capability flags). The engine
must never `switch` on node kind for behavior.

## Node Identity Contract

```ts
export type NodeKind = string; // registry-checked, not a TS union

export interface GraphNode {
  id: string; // globally unique node id
  kind: NodeKind; // registry key
  refId: string; // primary key in the owning domain table
  tenantId?: string; // optional tenant scope
  createdAt: string; // ISO
  updatedAt: string; // ISO
  deletedAt?: string | null;
}
```

## Registry Entry (per node kind)

```ts
export interface NodeKindRegistration {
  kind: NodeKind;
  label: string;
  pluralLabel: string;
  ownerDomain: string; // e.g. "business-card", "association"
  visibilityDefault: "public" | "association" | "community" | "private";
  supportsTimeline: boolean;
  supportsStrength: boolean;
  aiVisible: boolean;
  capabilities: string[]; // free-form flags, resolved by consumers
}
```

## Invariants

- `(kind, refId)` is unique per tenant scope.
- A node is never mutated to a different `kind`.
- Soft-delete via `deletedAt`; edges referencing it are hidden by default.
- Cross-tenant edges are allowed only when both node kinds declare
  `capabilities: ["cross_tenant"]`.

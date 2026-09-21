# BC-4.0 — Relationship Graph Engine — Architecture

Status: FROZEN CONTRACT (design-only). No implementation in this slice.
Architecture Version: Business Connect v1 (frozen).

## 1. Purpose

The Relationship Graph Engine is the canonical platform substrate for every
entity-to-entity relationship across ViOne. It replaces per-domain
relationship code with a single, extensible graph:

- Every entity is a **Node**.
- Every relationship is an **Edge** (typed, directed, versioned).
- Every meaningful edge transition may emit a **Timeline Event**.
- Every product reads relationships via the **RelationshipGraphSDK**.
  No product owns its own relationship storage semantics.

This is NOT Networking, NOT Friends, NOT Followers. Those are _products_
that consume the engine.

## 2. Non-Goals (this slice)

- No SQL / migrations / RLS / RPC.
- No Repository, Service, SDK implementations.
- No React, routes, or UI.
- No AI scoring implementation — contract only.
- No tests, no code generation.

## 3. Layered Model

```text
┌────────────────────────────────────────────────────────────┐
│ Products (Business Connect, Meetings, Marketplace, CRM…)   │
│   consume ONLY: RelationshipGraphSDK                       │
├────────────────────────────────────────────────────────────┤
│ RelationshipGraphSDK   (pure, framework-free)              │
├────────────────────────────────────────────────────────────┤
│ RelationshipGraphService   (interface)                     │
├────────────────────────────────────────────────────────────┤
│ RelationshipGraphRepository   (interface)                  │
├────────────────────────────────────────────────────────────┤
│ Storage (future migrations, indexes, partitions)           │
└────────────────────────────────────────────────────────────┘
```

Rules:

- Products never import the Repository or Service directly.
- Edge semantics live in the **Edge Registry**, not in product code.
- No product may `switch(edgeType)` for behavior — behavior comes from the
  registry entry.
- The engine is read-heavy; writes go through Service.connect/disconnect
  which enforce direction, inverse, and visibility from the registry.

## 4. Consumers (frozen list, extensible)

Business Connect · Association · Marketplace · Companies · Communities ·
Meetings · Events · Affiliate · CRM · AI · Future.

## 5. Extensibility Principle

New products **register** node types, edge types, and capability flags
through the Extension Registry (see `GRAPH_EXTENSION_GUIDE.md`). The engine
never ships hardcoded knowledge of any single product.

## 6. See Also

- `GRAPH_NODE_MODEL.md`
- `GRAPH_EDGE_MODEL.md`
- `GRAPH_TIMELINE.md`
- `GRAPH_QUERY_API.md`
- `GRAPH_RLS_MODEL.md`
- `GRAPH_STRENGTH_MODEL.md`
- `GRAPH_EVENT_MODEL.md`
- `GRAPH_EXTENSION_GUIDE.md`
- `GRAPH_MIGRATION_PLAN.md`

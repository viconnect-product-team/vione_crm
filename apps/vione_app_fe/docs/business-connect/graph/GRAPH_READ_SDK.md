# GRAPH_READ_SDK.md — BC-4.1

`RelationshipGraphSDK` is the ONLY consumer-facing API for the graph engine.

## Contract

- Framework-free — no React, no Supabase, no repository imports.
- All methods return typed DTOs; every rejection normalizes to
  `GraphError` with a stable `code` from `GraphErrorCode`.
- Cursor pagination (`nextCursor` opaque).
- Consumers MUST NOT pass a viewer parameter — identity is resolved
  server-side from the authenticated session.

## Methods

- `getNode(nodeId)`
- `neighbors(q)`
- `mutualConnections(q)`
- `sharedCompanies(q)` / `sharedAssociations(q)` / `sharedCommunities(q)`
- `shortestPath(q)`

## Import

```ts
import { RelationshipGraphSDK } from "@/lib/graph";
```

Product modules MUST NOT import `graph.repository.server`, `graph.service.server`,
or the raw `graph.functions` endpoints.

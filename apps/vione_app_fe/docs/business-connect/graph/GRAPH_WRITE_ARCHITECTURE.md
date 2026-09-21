# GRAPH_WRITE_ARCHITECTURE.md — BC-4.2

The write path is a single, closed chain:

```
Product
 → RelationshipGraphSDK              (framework-free)
 → authenticated server functions    (requireSupabaseAuth)
 → RelationshipGraphWriteService     (registry + metadata + telemetry)
 → RelationshipGraphWriteRepository  (thin RPC caller)
 → SECURITY DEFINER RPCs             (transactional edge + timeline + outbox)
 → graph_nodes / graph_edges / graph_timeline_events / graph_outbox_events
```

Products import ONLY from `@/lib/graph` (barrel). Repository and service
files are server-only and never referenced from client code.

## Non-negotiable rules

1. No direct `INSERT/UPDATE/DELETE` grants for `authenticated` on any graph table.
2. Every write derives the actor from `auth.uid()` inside the RPC. The SDK
   accepts NO viewer/actor/authority parameter.
3. Every write is idempotent (see `GRAPH_IDEMPOTENCY.md`).
4. Edge semantics come from the frozen registry — no product-specific switch.
5. Metadata is projected through the registry allowlist before it reaches the DB.
6. Timeline emission and outbox event are part of the same transaction as
   the edge mutation.

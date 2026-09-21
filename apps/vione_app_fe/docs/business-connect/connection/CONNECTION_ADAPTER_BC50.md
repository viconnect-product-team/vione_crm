# BC-5.0 — Connection Lifecycle Foundation (Adapter over Existing)

**Status:** Frozen. Architecture Version: Business Connect v1.

## Decision

BC-5.0 introduces a canonical **Connection domain** (`src/lib/connection/`)
keyed on Relationship Graph `person` nodes. It is a THIN ADAPTER over the
existing `user_connections` + `GlobalConnectionService` engine. No parallel
tables, no schema migration, no behavior change to the legacy
`/connect/network/*` surface.

## Boundaries

- **ConnectionSDK** (`sdk.ts`) — the ONLY entry point for BC-5.0 product
  code. Framework-free, client-safe.
- **ConnectionService** (`service.server.ts`) — server-only adapter:
  resolves person nodes ↔ user ids, delegates lifecycle to
  `GlobalConnectionService`, synchronizes `CONNECTED_TO` graph edges,
  normalizes errors.
- **State resolver** (`state-resolver.ts`) — pure. Applies the frozen
  precedence: `unavailable > blocked_by_me > blocked_me > connected >
incoming_pending > outgoing_pending > none`.
- **Recommendation exclusion** — `RecommendationService` calls
  `ConnectionService.listBlockedPersonNodeIds` so blocked pairs never
  appear as recommendations, regardless of graph-edge state.

## Idempotency

- `sendRequest` / `accept` / `decline` / `cancel` / `disconnect` / `block`
  forward `mutationKey` to the underlying engine, which enforces
  request-scoped idempotency at the DB layer.
- `acceptRequest` derives the graph-edge idempotency key from the
  connection id (`bc5:<connectionId>`); replaying an accepted request never
  produces a duplicate `CONNECTED_TO` edge.
- `disconnect` / `block` archive the active `CONNECTED_TO` edge in either
  direction; re-running is a no-op.

## Legacy compatibility

- `/connect/network/*` and `src/lib/global-network.functions.ts` are
  preserved as-is. Both surfaces read the same `user_connections` rows and
  resolve to the SAME `ConnectionState` (proven by
  `src/__tests__/connection-adapter.bc50.test.ts`).
- The block-aware recommendation exclusion is additive; blocked users were
  already hidden from graph-only reads, this closes the gap for pairs
  where no graph edge exists.

## Capability gaps deferred (future migration slice)

Documented here so no BC-5.0 code silently works around them:

1. **Attached message on a connection request.** `user_connections` has no
   `message` column. `sendRequest.message` is currently accepted, sanitized,
   and dropped. A future slice may add `user_connections.request_message`
   or a satellite table.
2. **Request expiry.** No `expires_at`; the DTO surfaces `expiresAt` as
   optional and is always `null`. Cron-driven expiry is a separate slice.
3. **Structured `ConnectionErrorCode` mapping for `REQUEST_NOT_PENDING`
   vs `REQUEST_NOT_OWNED`.** The legacy engine returns
   `NETWORK_INVALID_TRANSITION` for both cases; the adapter picks the more
   common `REQUEST_NOT_PENDING`. A finer discriminator requires a new
   engine error code.
4. **Direct `unblock` RPC.** The current DB layer exposes no
   `global_connection_unblock`. The adapter performs a scoped row update
   under RLS. A dedicated RPC + audit hook is a future slice.
5. **Full graph-only lifecycle.** Long-term, connection state may migrate
   fully onto `graph_edges` with lifecycle metadata. BC-5.0 explicitly
   does not attempt this — the adapter keeps both surfaces coherent while
   the domain stabilizes.

## Scope guardrails (enforced this slice)

- No new tables.
- No changes to `user_connections` schema, RLS, or RPCs.
- No changes to `/connect/network/*` routes or components.
- No product UI in this slice; UI wiring is a follow-up.

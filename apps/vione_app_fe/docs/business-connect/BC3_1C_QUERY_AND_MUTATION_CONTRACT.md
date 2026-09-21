# BC-3.1C — Query & Mutation Contract

Defines the exact client-facing contract the UI depends on. The façade is
`GlobalNetworkSDK` (`src/lib/global-network/network.sdk.ts`); everything below
is invoked through it via the `use-global-network` hooks.

## Queries (reads)

| SDK call                          | Server fn                     | Returns                 |
| --------------------------------- | ----------------------------- | ----------------------- |
| `connections.listAccepted()`      | `listConnectionsFn`           | `GlobalConnectionDTO[]` |
| `connections.listIncoming()`      | `listIncomingRequestsFn`      | `GlobalConnectionDTO[]` |
| `connections.listOutgoing()`      | `listOutgoingRequestsFn`      | `GlobalConnectionDTO[]` |
| `connections.countByStatus()`     | `countConnectionsByStatusFn`  | `StatusCounts`          |
| `connections.getById(id)`         | `getConnectionByIdFn`         | `GlobalConnectionDTO`   |
| `connections.getState(userId)`    | `getConnectionStateFn`        | `PairState`             |
| `counterparts.resolvePublic(ids)` | `resolvePublicCounterpartsFn` | `CounterpartSummary[]`  |

All reads are participant-scoped server-side (the user id comes from
`requireSupabaseAuth`, never from client input).

## Mutations (writes)

| SDK call                             | Server fn                 | Result                           |
| ------------------------------------ | ------------------------- | -------------------------------- |
| `mutations.sendRequest(input)`       | `sendConnectionRequestFn` | `GlobalConnectionMutationResult` |
| `mutations.accept(id, mutationKey?)` | `acceptConnectionFn`      | `GlobalConnectionMutationResult` |
| `mutations.decline(id, input?)`      | `declineConnectionFn`     | `GlobalConnectionMutationResult` |
| `mutations.cancel(id, mutationKey?)` | `cancelConnectionFn`      | `GlobalConnectionMutationResult` |
| `mutations.disconnect(id, input?)`   | `disconnectConnectionFn`  | `GlobalConnectionMutationResult` |
| `mutations.block(userId, input?)`    | `blockUserFn`             | `GlobalConnectionMutationResult` |

`input` carries optional `reason` and `mutationKey` (idempotency, BC-3.1A).

## Optimistic update rule

On success, the acting row is removed from its current section immediately
(`removeRow`). Section membership is re-derived on the next `reload()`. On
failure nothing is removed and an i18n error toast is shown.

## Error contract

Server functions carry a stable `NETWORK_*` code in `Error.message` across the
RPC boundary. `toNetworkErrorCode` extracts it; `networkErrorTKey` maps it to an
i18n key. Any unrecognized error collapses to `NETWORK_UNKNOWN` so raw
SQL/RLS text never reaches the UI.

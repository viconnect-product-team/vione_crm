# BC-6.2 — Path Validation

`sendRequest` NEVER trusts the client's snapshot. Server re-derives:

1. Requester user id from auth context.
2. Target node via `RelationshipGraphRepository.getNode` (must be person + active).
3. Introduction paths via `SmartIntroductionService.findIntroductionPaths({ target, maxDepth: 2, limit: 25 })`.
   - Hidden/absent targets short-circuit as `INTRO_REQUEST_PATH_INVALID`
     (topology indistinguishable).
   - `TARGET_ALREADY_CONNECTED` short-circuit → `INTRO_REQUEST_TARGET_ALREADY_CONNECTED`.
4. Match the requested `pathId` inside the returned page.
   No match → `INTRO_REQUEST_PATH_INVALID`.
5. `depth !== 2` → `INTRO_REQUEST_PATH_UNSUPPORTED`.
6. Extract primary intermediary from the validated path chain and resolve its
   user id via `graph_nodes`. If the person node is not backed by a user
   profile → `INTRO_REQUEST_INTERMEDIARY_UNAVAILABLE`.
7. Block checks reuse `ConnectionService.listBlockedPersonNodeIds` transitively
   through `SmartIntroductionService`; blocked intermediaries never enter the
   path list, so step 4 fails naturally.
8. Persist snapshot (path_id, versions, intermediary node ids, target,
   confidence, reason codes, generated_at) alongside the row.

The RPC re-checks the requester's `person` node exists so a stale client
state can never impersonate someone else.

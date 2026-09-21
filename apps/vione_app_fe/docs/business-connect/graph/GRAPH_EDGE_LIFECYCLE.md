# GRAPH_EDGE_LIFECYCLE.md — BC-4.2

States: `active`, `archived` (soft-delete). Networking request states
(pending/accepted) are OUT OF SCOPE for BC-4.2 and belong to the product slice.

## Operations

- `createEdge(args)` / `connect(args)` — insert; validated by registry
- `archiveEdge(id)` / `disconnect(id)` — soft-delete; cascades to related timeline rows
- `restoreEdge(id)` — un-archive
- `updateEdgeMetadata(id, patch)` — allowlisted patch only

## Validation (service + RPC)

- edge kind registered
- source kind ∈ registry.fromKinds
- target kind ∈ registry.toKinds
- self-edge forbidden unless registry allows
- both endpoints exist and are not archived
- visibility ≠ `system`

## Duplicate policy

- `(edge_kind, source_node_id, target_node_id)` has a unique partial index
  over `status='active' AND archived_at IS NULL`.
- On duplicate the RPC returns the existing active edge id (no error).

## Authorization

archive/restore/updateMetadata require the caller to own at least one endpoint
node (`graph_user_owns_node`). Otherwise `WRITE_FORBIDDEN`.

## Hard delete

Not available through the SDK. Reserved for administrative cleanup via
`service_role`.

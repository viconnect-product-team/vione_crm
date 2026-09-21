# GRAPH_NODE_REGISTRATION.md — BC-4.2

`RelationshipGraphSDK.registerNode(args)` calls `graph_register_node(...)`.

## Identity

Node identity is `(node_kind, external_ref_type, external_ref_id)`. Repeated
calls with the same triple return the existing node id — registration is
idempotent by construction.

## Server-derived fields

- `created_at`, `updated_at`, `id`
- `tenant_scope_type` defaults to `global`
- `visibility` defaults to the registry's `visibilityDefault` for the kind
- `visibility = 'system'` is rejected with `VISIBILITY_INVALID`
- Metadata is projected through the registry allowlist; unknown keys are dropped

## Client cannot supply

- viewer / actor / owner ids
- authority overrides
- registry version (recorded from the loaded registry)

## Errors

`UNAUTHENTICATED`, `INVALID_NODE_KIND`, `METADATA_INVALID`, `VISIBILITY_INVALID`,
`INTERNAL_ERROR`.

## Read never registers

Read calls (`getNode`, `neighbors`, etc.) never create nodes.

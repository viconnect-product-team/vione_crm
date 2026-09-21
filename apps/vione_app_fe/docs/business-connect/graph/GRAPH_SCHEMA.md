# GRAPH_SCHEMA.md — BC-4.1 Persistence

Additive schema for the Relationship Graph Engine. Read-only in this slice;
writes land in BC-4.2 via SECURITY DEFINER functions.

## Tables

### `graph_nodes`

- `id uuid pk`
- `node_kind text` — registry-checked
- `external_ref_type text`, `external_ref_id text` — canonical reference to
  the owning domain row (no data copied here)
- `tenant_scope_type text` ∈ `{global, association, community, tenant}`
- `tenant_scope_id uuid null`
- `visibility_class text` ∈ `{private, connected, association, community, public, system}`
- `status text` ∈ `{active, archived, suspended}`, `archived_at timestamptz null`
- `metadata jsonb` — registry-allowlisted fields only
- `registry_version int`, `created_at`, `updated_at`
- `UNIQUE (node_kind, external_ref_type, external_ref_id)`
- Indexes: kind+ref, tenant scope, visibility, status+archive

### `graph_edges`

- `id uuid pk`
- `edge_kind text` — registry-checked
- `source_node_id uuid → graph_nodes(id) on delete cascade`
- `target_node_id uuid → graph_nodes(id) on delete cascade`
- `directionality text` ∈ `{directed, undirected}`
- `visibility_class`, `tenant_scope_*`, `status ∈ {active, archived, revoked}`
- `metadata jsonb`, `registry_version int`
- `valid_from`, `valid_until` for time-bounded edges
- `created_by_user_id uuid null`
- Indexes: source+kind+status, target+kind+status, pair, tenant, visibility,
  validity, archived_at

### `graph_registry_versions`

- Tracks deployed manifests (`manifest_hash unique`, `manifest jsonb`, `version int`).

## Constraints

- Self-edges rejected at the service layer unless the registry entry sets
  `allowSelfEdge`.
- Node-kind pair validity comes from the registry (`fromKinds`, `toKinds`).
- Duplicate active edges follow registry cardinality (enforced in BC-4.2
  writers; read layer treats duplicates as visible rows).

## Write policy

No `INSERT/UPDATE/DELETE` policies for `authenticated`. `service_role` retains
full access. All writes flow through BC-4.2 SECURITY DEFINER functions.

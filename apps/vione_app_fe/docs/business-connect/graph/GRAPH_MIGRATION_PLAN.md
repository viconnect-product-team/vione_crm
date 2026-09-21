# GRAPH_MIGRATION_PLAN — Future Storage & Rollout

Design-only. **No migrations executed in BC-4.0.**

## Storage Specification (target)

### `graph_nodes`

- `id uuid pk`
- `kind text not null` — validated against registry
- `ref_id text not null`
- `tenant_id uuid null`
- `created_at timestamptz`, `updated_at timestamptz`, `deleted_at timestamptz null`
- unique `(tenant_id, kind, ref_id)`
- indexes: `(kind)`, `(tenant_id, kind)`, `(ref_id)`

### `graph_edges`

- `id uuid pk`
- `type text not null`
- `from_node_id uuid not null`, `to_node_id uuid not null`
- `visibility text not null`
- `weight numeric null`
- `metadata jsonb null` — registry-schema validated
- `valid_from timestamptz null`, `valid_to timestamptz null`
- `created_by uuid null`, `created_at`, `updated_at`, `deleted_at`
- unique canonical `(type, LEAST(from,to), GREATEST(from,to))` for
  undirected types
- indexes: `(from_node_id, type)`, `(to_node_id, type)`,
  `(type, visibility)`, GIN on `metadata`

### `graph_timeline`

- `id uuid pk`
- `edge_id uuid not null references graph_edges(id)`
- `edge_type text not null`
- `actor_node_id uuid`, `subject_node_id uuid not null`
- `related_node_ids uuid[] null`
- `occurred_at timestamptz not null`
- `visibility text not null`
- `summary_key text not null`
- `payload jsonb null`
- partition by `occurred_at` month; retention per tenant policy

### `graph_edge_metadata_versions`

- Append-only history of metadata changes for audit / redaction.

### `graph_registry`

- Materialization of the extension registry (kinds, types, capabilities)
  used by the write path for validation.

## Indexing & Sharding Strategy

- Hot paths: neighbor lookup by `(node, type)`, timeline by `(node, time)`.
- Timeline is partitioned monthly; edges are partitioned by `type_class`
  (system/private/public) once volume warrants.
- Sharding key candidate: `tenant_id` where present; global nodes remain
  in a shared partition.

## Rollout Phases

| Phase  | Scope                                                               |
| ------ | ------------------------------------------------------------------- |
| BC-4.0 | **This slice.** Contracts, taxonomy, interfaces, docs.              |
| BC-4.1 | Schema + RLS migrations, Repository implementation, read-only SDK.  |
| BC-4.2 | Write path (`connect`/`disconnect`), timeline emission, events bus. |
| BC-4.3 | Strength scoring implementation (v1 deterministic).                 |
| BC-4.4 | Recommendation engine (mutuals, shared context).                    |
| BC-4.5 | Backfill existing domains (Business Connect saved cards, meetings,  |
|        | associations, communities) into the graph, dual-write for one       |
|        | release, then cut over reads.                                       |
| BC-4.6 | AI signals as strength contributions; freeze v1 contract.           |

## Backfill Order (BC-4.5)

1. Person nodes ← `user_profiles`.
2. Company, Association, Community nodes.
3. `SAVED_CARD` edges ← `saved_business_cards`.
4. `CONNECTED_TO` edges ← existing networking (BC-3.1).
5. `MEMBER_OF`, `MANAGES`, `WORKS_FOR` from association/company tables.
6. `ATTENDED`, `CHECKED_IN`, `HOSTED` from events.
7. Timeline synthesized from `created_at` per edge.

## Risks (see also section 10 of BC-4.0 return)

- Registry drift between products and engine.
- Timeline write amplification.
- Cross-tenant visibility mistakes.
- Backfill scale / dual-write consistency.
- Strength contract version churn.

## Reversibility

Every migration in BC-4.1+ ships with a documented rollback. Until BC-4.5
cutover, products keep their existing storage; the graph is additive.

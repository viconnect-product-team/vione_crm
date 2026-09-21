# GRAPH_RLS_IMPLEMENTATION.md — BC-4.1

RLS is enabled AND forced on `graph_nodes`, `graph_edges`, and
`graph_registry_versions`. No `anon` grants.

## Helper functions (all SECURITY DEFINER, `search_path = public`)

- `graph_user_owns_node(_node graph_nodes) → boolean`
  Returns true when `auth.uid()` matches a person-node external ref.
- `graph_user_in_scope(_scope_type text, _scope_id uuid) → boolean`
  True when the current user is a `memberships` member of the association.
  Community/tenant scopes fail closed until BC-4.2 wires them.
- `graph_can_read_node(_node graph_nodes) → boolean` — canonical node
  visibility resolver (fails closed on missing viewer, archived, `system`).
- `graph_can_read_node_id(_node_id uuid) → boolean` — id-based lookup wrapper
  used by the edge policy.

All helpers have `REVOKE ALL ... FROM PUBLIC` and `GRANT EXECUTE` only to
`authenticated` and `service_role`.

## Policies

### `graph_nodes`

- `graph_nodes_read_scoped` (SELECT, authenticated) — uses
  `graph_can_read_node`. Public nodes → any signed-in viewer.
  Owner nodes → the owning user. Association/community nodes → members only.
  `system` and archived rows are always hidden.

### `graph_edges`

- `graph_edges_read_scoped` (SELECT, authenticated) — enforces:
  1. Both endpoints readable by `graph_can_read_node_id`.
  2. Effective edge visibility:
     - `public` → any signed-in viewer
     - `private` → viewer must own one endpoint
     - `association` / `community` → viewer must share scope
     - `connected` → falls back to endpoint ownership until BC-4.2 defines
       mutual-connection resolution (fails closed for strangers)
     - `system` → never returned
- Archived / non-active edges filtered.

## Isolation matrix (proved by RLS suite)

| Scenario                           | Expected            |
| ---------------------------------- | ------------------- |
| Unauth reader                      | 0 rows              |
| User A → User B's private edge     | denied              |
| Assoc member reads assoc node/edge | allowed             |
| Cross-association read             | denied              |
| Archived node/edge                 | invisible           |
| `system`-class node/edge           | invisible           |
| Path via hidden intermediate       | not_found (no leak) |

## Write policy

No authenticated write policies exist. Writes require the BC-4.2 SECURITY
DEFINER mutation functions (deferred).

# GRAPH_CONNECTED_VISIBILITY.md — BC-4.2

BC-4.1 documented a temporary endpoint-ownership fallback. BC-4.2 replaces it
with a real connection check.

`graph_viewer_connected_to(_node_id)` returns true when:

- the caller has a `person` node keyed on `external_ref_id = auth.uid()`;
- an active `CONNECTED_TO` edge (undirected, non-archived) links the caller's
  person node to `_node_id`.

## Rules

- Archived `CONNECTED_TO` edges do NOT grant visibility.
- Hidden connection edges (endpoint not readable) do NOT grant unrelated
  topology access.
- Only direct 1-hop connections are checked. No friend-of-friend traversal in
  RLS — that would risk recursive policy evaluation and unbounded queries.
- Cross-tenant connection visibility requires the counterpart node to be
  independently readable by tenant/scope rules.

## Owner fallback

Owners always see their own `connected`-class nodes even without an active
`CONNECTED_TO` edge (via `graph_user_owns_node`).

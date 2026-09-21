# GRAPH_SCOPE_RESOLUTION.md — BC-4.2

## Association scope

`graph_user_in_scope('association', <association_id>)` returns true when the
caller has an active membership in `public.memberships` for that association.

## Community scope

**Fail-closed.** No canonical `community_memberships` source has been ratified
for the graph engine. Nodes/edges with `visibility='community'` are invisible
to non-owners until BC-4.x wires the community membership resolver.

## Tenant scope

**Fail-closed.** No cross-tenant capability grant surface exists yet. Nodes
with `visibility='tenant'` are invisible to non-owners.

## Deferred

Extending `graph_user_in_scope` to communities and tenants is deferred to
BC-4.2b (community) and to the tenant-membership foundation slice. Until then
the resolver returns `false` and no permissive fallback is introduced.

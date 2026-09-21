# GRAPH_RLS_MODEL — Visibility & Access Design

Design-only. No SQL.

## Visibility Classes

| Class         | Who can read                                                         |
| ------------- | -------------------------------------------------------------------- |
| `public`      | Any authenticated user; anonymous when node kind is public.          |
| `association` | Members of a shared association (any of endpoints).                  |
| `community`   | Members of a shared community (any of endpoints).                    |
| `private`     | Endpoints only (both `from` and `to` when Person; owner otherwise).  |
| `system`      | Engine + admin roles only; never returned to product SDK by default. |

## Resolution Order (read)

1. If viewer is one of the edge endpoints → allowed (unless `system`).
2. Else compute effective visibility = `edge.visibility` ?? registry default.
3. Apply class rule above against viewer's memberships.
4. Cross-tenant edges require both sides to declare `cross_tenant`
   capability AND viewer must satisfy visibility on the _narrower_ side.

## Write Authority

- `Person → Person` edges: only the actor may create edges originating from
  their own person node, except `INTRODUCED` which requires actor ∈
  {from, to} or explicit invite acceptance.
- Domain-owned edges (`WORKS_FOR`, `MEMBER_OF`, `MANAGES`, `HOSTED`,
  `SPONSORED`) are written by the owning domain via a service role; the
  engine validates payloads but does not judge the business rule.
- System edges (`VIEWED_CARD`, `CHECKED_IN`) are written by the engine on
  behalf of the actor and are always `private` or `association`.

## Deletion / Redaction

- Soft-delete only. `deletedAt` hides the edge from all reads except audit.
- Redaction removes `metadata` while preserving edge existence for
  aggregate queries (strength, mutuals).
- Person deletion cascades to `private` edges; `public` edges are anonymized.

## Audit

- Every write / delete is journalled with actor, reason, and previous
  visibility. Audit is `system`-visible only.

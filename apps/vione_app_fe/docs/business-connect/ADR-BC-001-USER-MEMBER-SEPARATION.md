# ADR-BC-001 — Platform User ≠ Association Member

Status: **Accepted** (BC-0.2). Documentation-only.

## Context

BC-0.1 confirmed that authentication succeeds without a `members` row
(`handle_new_user` creates `profiles`+`user_roles`+`memberships` but not
`members`; `/m` guard checks only `auth.getUser()`), yet Business Cards,
Networking (`net_*`) and Marketplace hard-require `current_member_id()`
(`resolveMemberId` throws; `net_*` RPCs `RAISE 'No member profile'`). Business
Connect targets users who will never have a `members` row.

## Decision

Formally separate **Platform User** (`auth.users.id`) from **Association
Member** (`members` row). Platform User is the primary identity for Business
Connect; Association Member remains authoritative for association domains. A
Platform User may link to zero, one, or many members over time; a member may
exist unlinked.

## Alternatives considered

1. **Auto-create a `members` row on signup** — rejected: pollutes the
   association registry with non-members, breaks fee/renewal/identity semantics,
   and requires a fake `association_id` (see Prohibited Patterns).
2. **Force BC users to "become a member" before any BC action** — rejected:
   contradicts the BC product (non-association users) and couples global
   features to association lifecycle.
3. **Extend `members` with a "virtual/global" flag** — rejected: overloads a
   D-class lifecycle table; RLS and grants are association-scoped and would leak
   across tenants.

## Consequences

- Global resources must key on `owner_user_id`, not `member_id`.
- Server functions gain a user-identity path alongside the member path.

## Migration impact

None now. Enables later additive `owner_user_id` columns (ADR-BC-003).

## Security impact

Prevents privilege confusion between platform and association scopes; keeps
tenant-scoped RLS intact. Ownership stays server-resolved (invariant 11).

## Operational impact

No fake rows to reconcile; association admin metrics stay accurate.

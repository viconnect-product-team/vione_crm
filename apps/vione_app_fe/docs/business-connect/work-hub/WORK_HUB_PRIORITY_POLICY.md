# Work Hub — Priority & Ordering Policy (BC-8.0)

Deterministic, pure, unit-tested (`priority-policy.ts`, tests in
`work-hub.bc80.test.ts` and `work-hub-verification.bc80f.test.ts`).

## Category precedence (§34)

`overdue > needs_action > due_soon > upcoming > waiting > recent`.

## Sort key (§33)

1. Category rank ascending.
2. Priority tier ascending (P0 first).
3. `dueAt ?? startsAt ?? occurredAt` ascending, nulls last.
4. Item `id` ascending (final tiebreaker).

`compareWorkHubItems` is total and pure. `sortWorkHubItems` returns a
new array; callers must never call `Array#sort` directly.

## Dedup (§32)

When two items share `dedupeKey`, the winner is `compareWorkHubItems`
lowest (i.e. most urgent). Verified: overdue follow-up beats an active
sibling for the same follow-up id.

## Registry version

Any change to categories, kinds, priority tiers, or windows requires
bumping `WORK_HUB_PRIORITY_VERSION`. Cursors carrying a stale version
are rejected with `WORK_HUB_INVALID_CURSOR`.

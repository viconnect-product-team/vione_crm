# BC-2.0 — Security Test Plan (for BC-2.1 implementation)

Use separate live sessions/JWTs where supported (see existing
`business-cards-scoping.e2e.test.tsx` pattern). All tests must run against real
RLS, not mocked clients.

| #   | Test                                                                          | Expected                                                                      |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Global user (no member) owns a card (`owner_user_id = uid`, `member_id NULL`) | can read own card                                                             |
| 2   | Global user updates own card                                                  | success; `owner_user_id` unchanged                                            |
| 3   | User A updates User B's card                                                  | denied (RLS)                                                                  |
| 4   | Existing member (legacy, `owner_user_id NULL`) accesses own card              | success via legacy policy                                                     |
| 5   | Assoc A manager manages Assoc B card                                          | denied                                                                        |
| 6   | Assoc manager attempts to set `owner_user_id` to self                         | denied (WITH CHECK)                                                           |
| 7   | Unresolved card (no owner, no member match) mutation attempt                  | denied                                                                        |
| 8   | Client sends `owner_user_id != auth.uid()` on insert/update                   | rejected (WITH CHECK)                                                         |
| 9   | Child row (skill/service/need/lead) mutation on card not owned                | denied (parent-derived)                                                       |
| 10  | Public projection (`getPublicBusinessCardFn`)                                 | only safe fields; no `member_id`/`owner_user_id`/internal columns             |
| 11  | hidden/private/suspended states                                               | not publicly readable; `members_only` gated                                   |
| 12  | `/b/$slug` URL stability                                                      | same URL resolves identically pre/post migration                              |
| 13  | Backfill run                                                                  | touches only category A rows; count matches preflight `eligibleBackfillCount` |
| 14  | Rollback                                                                      | clears only migration-written values; manual remediation preserved            |
| 15  | No fake member                                                                | global-user card creation inserts no `members` row                            |

## Design assertions

- Ownership ≠ moderation: manager moderation tests (5) must not grant content edit.
- Owner reassignment impossible via any client path (6, 8).
- Child ownership strictly derived through parent (9).
- Public parity holds (10, 11, 12) — cross-check `BC2_0_PUBLIC_CARD_PARITY_MATRIX.md`.

Typecheck must be clean for any added test source.

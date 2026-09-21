# Work Hub — Performance Budgets (BC-8.0)

| Dimension            | Budget                                                          | Enforcement                                                              |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Queries per request  | ≤ 6 (one per source)                                            | Repository shape; verified in `work-hub-verification.bc80f.test.ts`      |
| Rows per source      | ≤ `WORK_HUB_SOURCE_READ_LIMIT_DEFAULT` (30)                     | Explicit `.limit(...)` on every query                                    |
| Page size            | ≤ 100                                                           | `WorkHubService.listItems` rejects excess with `WORK_HUB_INVALID_FILTER` |
| Failure blast radius | Single source failure ⇒ that source empty; other sources render | `safe(...)` wrapper in repository                                        |
| CPU per request      | O(N log N) sort of ≤ 6 × limit items                            | Pure `sortWorkHubItems`                                                  |

There is no per-item fan-out ("N+1"). All enrichment happens in the
resolver from data already in the batch read.

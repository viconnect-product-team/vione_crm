# BC-7.0 — Test Matrix

| Concern                                | Suite                                    | Status     |
| -------------------------------------- | ---------------------------------------- | ---------- |
| State machine transitions              | `business-meetings.bc41a.test.ts`        | ✅         |
| Version guard (optimistic concurrency) | `business-meetings.bc41a.test.ts`        | ✅         |
| Policy B eligibility classifier        | `business-meetings.bc41a.test.ts`        | ✅         |
| Viewer capability derivation           | `business-meetings.bc41b.test.ts`        | ✅         |
| Accessibility (workspace)              | `business-meetings.bc41c.a11y.test.tsx`  | ✅         |
| BC-7.0 foundation alias                | `meeting-foundation.bc70.test.ts`        | ✅ (added) |
| DB structural verification             | 5 tables + 8 CHECKs + 8 RPCs + FORCE RLS | ✅         |
| Typecheck                              | `tsgo --noEmit`                          | ✅         |

## Deferred (per BC-4.1A doc)

End-to-end authenticated mutation tests
(create → propose → accept/reschedule/cancel) land alongside notification
and Business Interaction integration. Deferred to BC-7.1+, out of scope
for BC-7.0 ratification.

## Regression gate

Any BC-4.1A/B/C suite failure blocks BC-7.0 by definition — the alias
suite (`meeting-foundation.bc70.test.ts`) freezes the contract name.

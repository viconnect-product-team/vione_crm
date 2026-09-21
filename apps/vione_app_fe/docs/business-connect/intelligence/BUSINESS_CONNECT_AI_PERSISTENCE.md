# Business Connect AI — Persistence Layer (BC-9.0 B1)

## Scope

B1 delivers the **persistence + gateway foundation** for the Business Connect
Intelligence runtime. It does NOT include:

- The tool loop or provider execution (Turn B2).
- UI surfaces (Turn C).

What ships in B1:

- Four Postgres tables with **FORCE RLS**, owner-scoped reads, and no direct
  client writes.
- SECURITY DEFINER RPCs for every write path.
- Deterministic idempotency + concurrency-safe canonical result ownership.
- Context hashing + stale-result detection.
- Model gateway policy (private-first, structured-output aware).
- Atomic rate limits, per-capability timeouts and token/cost budgets.
- Safe audit/metering shaping with an allowlist + forbidden-key assertion.
- Owner-scoped accept/reject RPCs (no canonical domain mutation).

## Tables

| Table                                  | Purpose                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `business_connect_ai_requests`         | One row per AI generation attempt. Owner = `requester_id`. Unique per `idempotency_signature`.     |
| `business_connect_ai_results`          | Generated AI results. Owner = `owner_id`. One canonical result per request (partial unique index). |
| `business_connect_ai_result_feedback`  | Owner accept/reject/report actions. Unique per `(result, owner, action)`.                          |
| `business_connect_ai_tool_invocations` | Read-only tool call audit. Owner = `owner_id`.                                                     |

Plus `business_connect_ai_rate_counters` for the atomic daily quota check.

## Force RLS + read-only client policies

Every table:

```sql
ALTER TABLE public.<t> ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.<t> FORCE ROW LEVEL SECURITY;
```

Only `SELECT` policies exist (`WHERE owner_id = auth.uid()`). Because there
are no `INSERT` / `UPDATE` / `DELETE` policies:

- Direct client writes from PostgREST are **denied** by RLS.
- All state changes must go through the SECURITY DEFINER RPCs below.

`GRANT SELECT` is issued to `authenticated`; `GRANT ALL` to `service_role`
for cleanup jobs. `anon` never gets access.

## Lifecycles

**Request status:** `pending → running → { completed | failed | cancelled | expired }`.
**Result status:** `generated → reviewed → { accepted | rejected | expired }`.

Transitions are enforced by triggers `bcai_validate_request_transition` and
`bcai_validate_result_transition`. Illegal transitions raise
`check_violation`.

## SECURITY DEFINER RPCs

| RPC                                | Purpose                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `bcai_claim_request(...)`          | Idempotent create. Returns `(request_id, is_new, existing_status, canonical_result_id)`. |
| `bcai_transition_request(...)`     | Validated status transition, timestamps, provider/model/latency/cost.                    |
| `bcai_record_result(...)`          | Insert canonical result and link it back to the request atomically.                      |
| `bcai_accept_result(id)`           | Owner-scoped, idempotent accept; writes feedback row.                                    |
| `bcai_reject_result(id, reason)`   | Owner-scoped, idempotent reject; writes feedback row.                                    |
| `bcai_increment_rate(cap, limit)`  | Atomic per-user/per-capability daily quota.                                              |
| `bcai_record_tool_invocation(...)` | Owner-scoped tool audit insert.                                                          |

All RPCs `REVOKE ALL FROM PUBLIC` and grant `EXECUTE` only to
`authenticated`/`service_role`. All RPCs return
`BUSINESS_CONNECT_AI_UNAUTHENTICATED` when `auth.uid()` is null and
`BUSINESS_CONNECT_AI_FORBIDDEN` when the row does not belong to the caller.

## Server-side wrappers

`src/lib/business-connect/intelligence/runtime/persistence.server.ts`
is loaded only from server-function handlers via dynamic `import()`. It
provides typed wrappers:

- `claimRequest`, `transitionRequest`, `recordResult`
- `findCachedResult` (RLS-scoped, applies `isResultStale`)
- `incrementRate`
- `acceptResult`, `rejectResult`, `getOwnedResult`
- `recordToolInvocation`

## Server functions

`src/lib/business-connect-ai.functions.ts` exposes three protected functions
via `requireSupabaseAuth`:

- `bcAiAcceptResult({ resultId })`
- `bcAiRejectResult({ resultId, reason? })`
- `bcAiGetResult({ resultId })`

Generation functions remain on Turn A's SDK contract, still throwing
`BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE` until Turn B2.

## Type generation

`src/integrations/supabase/types.ts` was regenerated after the migration.
`business_connect_ai_requests`, `_results`, `_result_feedback`,
`_tool_invocations`, `_rate_counters` are all present.

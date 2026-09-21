# Business Connect AI — Rate Limits, Timeouts, Cost (BC-9.0 B1)

## Per-user daily rate limits

Defaults live in `context-policy.ts` under `DEFAULT_DAILY_RATE_LIMITS`.
Runtime enforcement is atomic via RPC `bcai_increment_rate`:

```sql
INSERT INTO public.business_connect_ai_rate_counters ...
ON CONFLICT (requester_id, capability, window_start_utc)
DO UPDATE SET count = count + 1
RETURNING count;
```

If the new count exceeds the limit the RPC **rolls back the increment**
and returns `{ allowed: false }`. This prevents leaked quota under
concurrent bursts because the increment and the check are one statement.

The gateway must call `incrementRate(...)` **before** any expensive provider
execution. When `allowed = false` the SDK returns
`BUSINESS_CONNECT_AI_RATE_LIMITED`.

## Per-capability timeouts

`REQUEST_TIMEOUT_MS` in `runtime/budgets.ts` caps wall-clock time per
capability (20 s – 45 s). Written to `business_connect_ai_requests.timeout_ms`
at claim time. Turn B2 must abort provider execution when this budget is
reached and transition the request to `failed` with
`error_code = BUSINESS_CONNECT_AI_TIMEOUT`.

## Token budget

`TOKEN_BUDGET[capability]` (2 500 – 6 000 tokens) written to
`business_connect_ai_requests.token_budget`. The tool loop must include
this as an upper bound on prompt + context + tool-turn tokens.

## Model-tier routing

Cost per class in `budgets.ts`:

| Class           | millicents / 1k tokens |
| --------------- | ---------------------- |
| `cloud_general` | 200                    |
| `cloud_private` | 150                    |
| `local_private` | 5                      |

Pre-flight `estimated_cost_millicents` is written at claim time. Post-run
`actual_cost_millicents` is written by `bcai_transition_request` when the
request completes. No request runs without a claim, so no request runs
without a budget.

## Structural context cap

`MAX_CONTEXT_ENVELOPE_CHARS = 48_000` (Turn A). The runtime rejects
oversized envelopes with `BUSINESS_CONNECT_AI_CONTEXT_TOO_LARGE`
before hitting the token budget check.

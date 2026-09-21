# BC-9.0 B3 — Concurrency & Idempotency

## Deduplication key: `idempotency_signature`

Computed by `computeIdempotencySignature` from an ordered, canonical JSON of:

| Field                                                  | Purpose                                            |
| ------------------------------------------------------ | -------------------------------------------------- |
| `requesterOpaqueId`                                    | Per-viewer partition                               |
| `tenantScopeOpaque`                                    | Per-tenant partition                               |
| `capability`                                           | Never merge across capabilities                    |
| `scopeType` / `scopeRef`                               | Same scope only                                    |
| `contextHash`                                          | Envelope-derived hash — bumps on any source change |
| `promptVersion` / `policyVersion` / `modelPolicyClass` | Contract version                                   |
| `userIdempotencyKey`                                   | Caller-supplied dedupe token                       |

Signature format: `bcai:<16 hex>`. The `bcai_requests` table has a UNIQUE
index on `idempotency_signature`, so duplicate concurrent submissions
converge on a single canonical row.

## Concurrency proofs

Verified in `business-connect-ai-security.bc90.test.ts`:

- `[duplicate requests]` — identical inputs produce identical signatures.
- `[duplicate tool execution / persistence]` — `computeContextHash` is
  key-order independent (canonical JSON).
- `[duplicate cache writes]` — `canonicalJson` is deterministic.
- `[duplicate accept / reject]` — `userIdempotencyKey` participates in the
  signature so distinct keys produce distinct rows.
- `[concurrent accept/reject]` — bumping `policyVersion` invalidates prior
  signature so stale contracts cannot claim the row.
- `[request idempotency]` — tool loop is hard-capped at
  `TOOL_LOOP_LIMITS.maxToolCallsPerRequest` calls, `maxTotalFacts` facts,
  and `maxWallClockMs` wall-clock.
- `[result idempotency]` — context-hash change flips `isResultStale`.

## SECURITY DEFINER RPC contract

The DB-side atomic state transitions are performed via SECURITY DEFINER
functions:

- `bcai_claim_request(request_id, viewer)` — atomic `pending -> running`
  with row-level `SELECT ... FOR UPDATE SKIP LOCKED`; only one worker wins.
- `bcai_transition_request(request_id, viewer, next_status, error_code)` —
  atomic `running -> completed|failed|cancelled|expired` with idempotency
  guard: re-emitting the same terminal transition is a no-op.

Both RPCs re-check the viewer's ownership inside the function body — the
service-role caller cannot escalate.

## Cache lifecycle

`bcai_results` rows carry `expires_at = now() + RESULT_EXPIRY_SECONDS[cap]`.
`isResultStale` returns `stale=true` when ANY of `expired`,
`context_hash_mismatch`, `prompt_version_mismatch`,
`policy_version_mismatch`, `policy_class_mismatch`, or
`source_version_mismatch:<domain>` holds. Stale hits are transparently
replaced, never returned to the caller.

## No lost writes

The generation flow is: authenticate → rate-limit → build envelope →
claim (or read canonical) → execute → validate → persist result →
transition. Every step is idempotent. A crashed worker leaves the row in
`running`; the reconciliation sweep (see B2 doc) transitions it to
`expired` after `REQUEST_TIMEOUT_MS[cap]` so the next submission can
re-claim.

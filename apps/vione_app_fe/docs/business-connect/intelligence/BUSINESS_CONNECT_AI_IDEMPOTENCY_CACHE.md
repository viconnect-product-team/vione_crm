# Business Connect AI — Idempotency & Cache (BC-9.0 B1)

## Deterministic context hash

`computeContextHash(envelope)` in `persistence-hash.ts` produces a stable
FNV-1a 64-bit hex hash from the redacted context envelope. Excluded fields:

- `requestId` — request-specific identity.
- `dataFreshness` — non-source metadata.
- `policyVersion`, `promptVersion`, `modelPolicy` — folded into the
  idempotency signature separately, not the context hash.
- `exclusions` — descriptive, derived from `safeFacts`.

Any change to a safe fact's `updatedAt` or `sourceVersion` bubbles into
`safeFacts[*]` and changes the hash. This is the mechanism behind
stale-result detection.

## Idempotency signature

`computeIdempotencySignature({...})` folds the following into a single
opaque key:

- `requesterOpaqueId`
- `tenantScopeOpaque`
- `capability`
- `scopeType` + `scopeRef`
- `contextHash`
- `promptVersion`
- `policyVersion`
- `modelPolicyClass`
- `userIdempotencyKey` (optional client-supplied nonce)

The signature is written to `business_connect_ai_requests.idempotency_signature`
under a `UNIQUE` index. Concurrent submissions with the same signature:

1. Both call `bcai_claim_request(...)`.
2. Postgres serializes the `INSERT ... ON CONFLICT DO NOTHING`. Exactly one
   row is created.
3. The loser's RPC falls through to a `SELECT` that returns the winner's
   `request_id`, `existing_status`, and `canonical_result_id`.

So duplicate/concurrent requests always **converge on one canonical row**.

## Canonical result

`business_connect_ai_results` has:

```sql
CREATE UNIQUE INDEX ux_bcai_res_canonical
  ON public.business_connect_ai_results (request_id)
  WHERE is_canonical;
```

`bcai_record_result` inserts with `is_canonical = true` and
`ON CONFLICT ON CONSTRAINT ux_bcai_res_canonical DO NOTHING`. Concurrent
writers therefore converge on one canonical result per request; the loser
reads back the winner's id and returns it.

## Cache lookup

`findCachedResult(supabase, args)`:

- Queries `business_connect_ai_results` scoped by RLS (`owner_id = auth.uid()`)
  and `capability + context_hash + is_canonical = true`.
- Filters to statuses `generated | reviewed | accepted` (not expired,
  rejected).
- Applies `isResultStale` to compare context hash, source versions,
  prompt/policy version, model policy class, and expiry.
- Returns `null` (miss) or `{ resultId, payload, meta, staleReason }`.

## Cross-user / cross-tenant isolation

- RLS `owner_id = auth.uid()` gates every read. A user cannot see another
  user's cache row, even in the same tenant.
- `tenant_scope_opaque` is stamped on every row so future analytics never
  cross tenants.
- The idempotency signature includes `tenantScopeOpaque`, so identical
  contexts in different tenants produce different signatures and cannot
  collide.

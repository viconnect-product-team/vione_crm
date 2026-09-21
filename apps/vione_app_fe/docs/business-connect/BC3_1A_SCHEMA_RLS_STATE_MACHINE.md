# BC-3.1A — Global Connection Schema, RLS & State Machine

Architecture Version: **Business Connect v1 (FROZEN)**. Implementation slice —
**database + server domain foundation only**. No UI, notifications, messaging,
CRM, community, or marketplace. Legacy Association networking untouched.

## 1. Objects created (additive)

### Enums

- `public.global_connection_status` = `pending | accepted | declined | cancelled | disconnected | blocked`
- `public.global_connection_source_type` = `business_card | saved_card | qr | nfc | event | meeting | association | community | company | marketplace | manual | referral`

### Tables

- **`public.user_connections`** — user-to-user connections.
  - `requester_user_id`, `recipient_user_id` → `auth.users(id)` (frozen identity target, matches BC-3.0).
  - `pair_user_low` / `pair_user_high` are **`GENERATED ALWAYS AS (least/greatest)` STORED** — DB-computed, un-spoofable.
  - `status`, `source_type`, `source_id`, `blocked_by_user_id`, `status_reason`.
  - Timestamps: `requested_at`, `responded_at`, `disconnected_at`, `created_at`, `updated_at`.
  - `CHECK (requester_user_id <> recipient_user_id)`.
- **`public.user_connection_events`** — append-only audit log of lifecycle transitions
  (`connection_requested/accepted/declined/cancelled/disconnected/blocked`). No private
  card/note/contact data.
- **`public.global_connection_mutations`** — idempotency ledger keyed `(actor_user_id, mutation_key)`.

### Pair uniqueness

`user_connections_active_pair_uq` — **partial unique** on `(pair_user_low, pair_user_high)`
`WHERE status IN ('pending','accepted','blocked')`. Prevents duplicate + reverse-duplicate
pending/accepted/blocked pairs; historical `declined/cancelled/disconnected` rows may coexist.

### Indexes

`(requester_user_id,status)`, `(recipient_user_id,status)`, `(pair_user_low,pair_user_high)`,
`(status,requested_at desc)`, `(updated_at desc)`, partial `(blocked_by_user_id)`.

## 2. RLS matrix

| Table                       | anon | authenticated                                          | service_role |
| --------------------------- | ---- | ------------------------------------------------------ | ------------ |
| user_connections            | none | SELECT where `auth.uid() ∈ (requester,recipient)` only | ALL          |
| user_connection_events      | none | SELECT where `auth.uid() ∈ (actor,counterpart)`        | ALL          |
| global_connection_mutations | none | **no policy → no access**                              | ALL          |

- No `authenticated` INSERT/UPDATE/DELETE policy on any table → **all direct writes denied**.
- All mutations funnel through `SECURITY DEFINER` functions.
- Verified denied: association admin, company owner, community owner, unrelated user, anon —
  none can read a row they are not a participant of (RLS predicate is participant-only).

## 3. Controlled functions (SECURITY DEFINER, `search_path=public`)

| Function                                                               | Actor rule                             | Notes                                                       |
| ---------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| `global_connection_send_request(target, source_type, source_id, mkey)` | authenticated requester (`auth.uid()`) | self/target/block/dup checks; source normalized; idempotent |
| `global_connection_accept(id, mkey)`                                   | recipient only                         | pending→accepted                                            |
| `global_connection_decline(id, reason, mkey)`                          | recipient only                         | pending→declined                                            |
| `global_connection_cancel(id, mkey)`                                   | requester only                         | pending→cancelled                                           |
| `global_connection_disconnect(id, reason, mkey)`                       | either participant                     | accepted→disconnected                                       |
| `global_connection_block(target, reason, mkey)`                        | either → blocks other                  | transitions active row or creates blocked row               |

Internal helpers `gn_require_user`, `gn_apply_transition`, `gn_log_event` are
`REVOKE`d from `public/anon/authenticated`. Public mutation functions are
`REVOKE`d from `public/anon` and `GRANT EXECUTE` to `authenticated` only.

`requester_user_id` and `status` are **never** accepted from the client — requester is
`auth.uid()`; status is derived by the operation.

**Unblock is deferred** — BC-3.0 lists it as "if later supported"; not implemented in BC-3.1A.

## 4. State machine (enforced in DB function + `guard_user_connection_transition` trigger)

```
none      → pending      (requester)
pending   → accepted     (recipient)
pending   → declined     (recipient)
pending   → cancelled    (requester)
accepted  → disconnected (either)
active/terminal → blocked (either; blocker)
```

Rejected server-side: requester accepting/declining own request, recipient cancelling,
accepting non-pending, disconnecting non-accepted, any non-participant transition,
re-request over an active/pending/blocked pair, self-connection.

Defence in depth: `guard_user_connection_immutable` (requester/recipient frozen) +
`guard_user_connection_transition` (status graph) run on every UPDATE.

## 5. Repository foundation

`src/lib/global-network/` — `types.ts`, `errors.ts`, `state-machine.ts`, `source.ts`,
`identity.ts` (`requireGlobalNetworkUser`), `repository.ts`, `index.ts`.
Repository is read-only + participant-scoped: `findById`, `findPairState`,
`listIncomingPending`, `listOutgoingPending`, `listAccepted`, `isBlockedPair`, `countByStatus`.
No service/SDK/UI in this slice.

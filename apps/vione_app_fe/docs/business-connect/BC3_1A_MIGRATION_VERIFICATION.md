# BC-3.1A — Migration Verification

Architecture Version: **Business Connect v1 (FROZEN)**.

## Applied objects (verified via catalog)

Functions (`pg_proc`):

```
global_connection_accept, global_connection_block, global_connection_cancel,
global_connection_decline, global_connection_disconnect, global_connection_send_request,
gn_apply_transition, gn_log_event, gn_require_user
```

Indexes (`pg_indexes` on `user_connections`):

```
user_connections_pkey, user_connections_active_pair_uq,
user_connections_requester_status_idx, user_connections_recipient_status_idx,
user_connections_pair_idx, user_connections_status_requested_idx,
user_connections_updated_idx, user_connections_blocked_by_idx
```

Policies (`pg_policies`):

```
user_connections_select_participant        (SELECT, authenticated)
user_connection_events_select_participant  (SELECT, authenticated)
global_connection_mutations                (no policy → locked)
```

## Additive / collision checks

- No table name collision (`user_connections`, `user_connection_events`,
  `global_connection_mutations` are new).
- No enum name collision (`global_connection_status`, `global_connection_source_type` new;
  `DO $$ ... duplicate_object` guards protect re-run).
- Identity FK target = `auth.users(id)` (matches BC-3.0 frozen contract).
- Zero changes to legacy `connections`, `net_*` RPCs, `members`, `memberships`, `messages`.

## Regression

- `src/__tests__/global-network-state-machine.bc31a.test.ts` — 25 passed.
- `src/__tests__/networking-invite.e2e.test.ts` (legacy) — 1 passed (green).
- `tsgo --noEmit` — clean (no `global-network` errors).

## Rollback (BC-3.1A only)

```sql
DROP FUNCTION IF EXISTS public.global_connection_send_request(uuid,text,uuid,text);
DROP FUNCTION IF EXISTS public.global_connection_accept(uuid,text);
DROP FUNCTION IF EXISTS public.global_connection_decline(uuid,text,text);
DROP FUNCTION IF EXISTS public.global_connection_cancel(uuid,text);
DROP FUNCTION IF EXISTS public.global_connection_disconnect(uuid,text,text);
DROP FUNCTION IF EXISTS public.global_connection_block(uuid,text,text);
DROP FUNCTION IF EXISTS public.gn_apply_transition(uuid,text,text,text);
DROP FUNCTION IF EXISTS public.gn_log_event(uuid,uuid,uuid,text,public.global_connection_source_type,uuid,text);
DROP FUNCTION IF EXISTS public.gn_require_user();
DROP TABLE IF EXISTS public.global_connection_mutations;
DROP TABLE IF EXISTS public.user_connection_events;
DROP TABLE IF EXISTS public.user_connections;
DROP TYPE IF EXISTS public.global_connection_source_type;
DROP TYPE IF EXISTS public.global_connection_status;
```

Touches only BC-3.1A artifacts — never legacy networking, business profiles,
saved relationships, interactions, or companies.

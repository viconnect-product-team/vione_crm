# BC-3.1A — RLS Test Report

Architecture Version: **Business Connect v1 (FROZEN)**.

## Policy model (participant-private)

`user_connections` and `user_connection_events` have **SELECT-only** policies scoped to
`auth.uid() IN (participants)`. No INSERT/UPDATE/DELETE policy exists for `authenticated`,
so PostgREST denies all direct writes; the only write path is the SECURITY DEFINER
`global_connection_*` functions. `global_connection_mutations` has RLS enabled with **no
policy**, so it is unreadable/unwritable to `anon`/`authenticated` (service_role/functions only).

## Access verification matrix

| Actor                             | SELECT own row     | SELECT others' row                     | Direct INSERT/UPDATE/DELETE  |
| --------------------------------- | ------------------ | -------------------------------------- | ---------------------------- |
| participant (requester/recipient) | ✅                 | —                                      | ❌ (denied by absent policy) |
| unrelated platform user           | —                  | ❌                                     | ❌                           |
| association admin                 | —                  | ❌ (no member/assoc path in predicate) | ❌                           |
| company owner                     | —                  | ❌ (no company path in predicate)      | ❌                           |
| community owner                   | —                  | ❌ (reserved; no path in predicate)    | ❌                           |
| anonymous                         | ❌ (no anon grant) | ❌                                     | ❌                           |
| service_role                      | ✅                 | ✅                                     | ✅ (maintenance)             |

The RLS predicate references **only** `requester_user_id` / `recipient_user_id`; it contains
no association/company/community joins, so elevated roles in those domains gain **no** implicit
read access.

## Grants

```
GRANT SELECT ON public.user_connections       TO authenticated;  GRANT ALL ... TO service_role;
GRANT SELECT ON public.user_connection_events TO authenticated;  GRANT ALL ... TO service_role;
GRANT ALL    ON public.global_connection_mutations TO service_role;   -- no authenticated/anon
REVOKE ... FROM public, anon on all global_connection_* functions; GRANT EXECUTE TO authenticated.
gn_* internal helpers REVOKEd from public/anon/authenticated.
```

## Live multi-session note

`psql` runs as superuser with `auth.uid() = NULL`, so mutation functions correctly raise
`NETWORK_AUTH_REQUIRED` and RLS cannot be exercised as a signed-in user from the shell.
End-to-end participant RLS (two distinct sessions) is covered by the BC-3.1B service-layer
E2E harness (`requireGlobalNetworkUser` + authed clients), consistent with existing
`rls-ownership.e2e.test.ts` / `multi-tenant-rls.e2e.test.ts` patterns.

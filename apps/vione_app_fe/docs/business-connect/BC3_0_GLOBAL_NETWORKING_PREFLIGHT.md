# BC-3.0 — Global Business Networking Preflight

Architecture Version: **Business Connect v1 (FROZEN)**
Phase type: **Audit / Contract / Preflight** (no runtime implementation)

## 1. Audit of current networking implementation

### 1.1 Inventory & classification

| Artifact                                             | Kind         | Classification                            | Notes                                                                      |
| ---------------------------------------------------- | ------------ | ----------------------------------------- | -------------------------------------------------------------------------- |
| `src/lib/networking.functions.ts`                    | server fns   | **A — Association-only, must remain**     | All handlers resolve `resolveMemberId()` and call `net_*` RPCs             |
| `src/lib/networking-data.ts`                         | client store | **C — needs global adapter**              | `CURRENT_USER_ID` is a **member id**, not `auth.uid()`; keyed by member id |
| `src/components/dashboard/MemberNetworking.tsx`      | UI           | **A — must remain**                       | Member PWA networking surface — do not modify                              |
| `src/routes/network.tsx`                             | route        | **A — must remain**                       | Association member networking route                                        |
| `net_send_request`                                   | RPC          | **A — must remain**                       | Requires `current_member_id()`; writes two `connections` rows              |
| `net_accept_request`                                 | RPC          | **A — must remain**                       | Mutual accept + member notification                                        |
| `net_decline_request`                                | RPC          | **A — must remain**                       | Deletes both directions + notification                                     |
| `net_remove_connection`                              | RPC          | **A — must remain**                       | Cancel/disconnect (both directions)                                        |
| `list_peers`                                         | RPC          | **A — must remain**                       | Association-scoped peer directory                                          |
| `connections` table                                  | table        | **A — must remain**                       | `peer_id TEXT` (member id), dual-row model, `association_id` scoped        |
| `messages` table                                     | table        | **A / D for BC-3**                        | Legacy member DM — **not reused**; BC-3 has no messaging                   |
| `resolveMemberId` / `current-member`                 | helper       | **B — reusable infra (association only)** | Not used by global networking                                              |
| `requireSupabaseAuth` middleware                     | infra        | **B — reusable**                          | Foundation for `requireGlobalNetworkUser()`                                |
| `PlatformIdentitySDK` / bridge fns                   | infra        | **B — reusable**                          | Provides `auth.uid()`-scoped identity                                      |
| `saved_business_cards`                               | table        | **B — reference only**                    | One-sided edge; **must NOT be treated as connection**                      |
| `member_notifications` / notifications infra         | infra        | **B — reusable**                          | For request/accept notifications                                           |
| `sync_rate_limits` + `check_and_increment_sync_rate` | infra        | **B — reusable**                          | Candidate for request rate limiting                                        |
| `src/__tests__/networking-invite.e2e.test.ts`        | test         | **A — must remain green**                 | Legacy regression guard                                                    |

### 1.2 Legacy call graph (authoritative, unchanged)

```
MemberNetworking.tsx / network.tsx
  → networking-data.ts (optimistic store, keyed by member id)
    → networking.functions.ts (sendRequestFn / acceptRequestFn / declineRequestFn / removeConnectionFn / getNetworkStateFn)
      → resolveMemberId(context.supabase)            [requires members row]
      → supabase.rpc('net_send_request', {_peer})    [SECURITY DEFINER]
        → current_member_id() / current_association_id()
        → INSERT/UPDATE public.connections (owner_id, peer_id, status, association_id)  [dual row]
        → RLS: connections_member_* (owner_id = current_member_id())
        → add_member_notification(...)
```

### 1.3 Key structural findings (blockers for reuse)

1. **`connections` is member-id based, association-scoped, dual-row.** `peer_id`/`owner_id` are member ids (TEXT), not `auth.users.id`. Global networking is user-to-user (`uuid` `auth.uid()`) and must **not** require a member row → **new `user_connections` table required**.
2. **RLS on `connections`** is member-scoped via `current_member_id()`; unusable for non-members. Also historical `USING (true)` SELECT policy is anon-readable — must NOT be a model for the new table.
3. **`net_*` RPCs are SECURITY DEFINER and member-bound** — cannot be reused for global users; new `GlobalConnectionService` + server functions required.
4. **`networking-data.ts` store** hard-codes member-id semantics → global surface needs a separate store/adapter; do not overload it.
5. **No hard blockers to isolation** — the two systems address different id spaces (member id vs user id) and different tables, so coexistence is clean.

## 2. Reusable infrastructure summary

- `requireSupabaseAuth` middleware (auth context, RLS-as-user).
- `PlatformIdentitySDK` / `user_profiles` / account status (for `requireGlobalNetworkUser`).
- Notification infrastructure (`member_notifications` + `add_member_notification` pattern; a user-scoped variant is required — see privacy matrix).
- `sync_rate_limits` + `check_and_increment_sync_rate` (rate limiting candidate).
- Repository/Service/SDK layering pattern from `src/lib/business-card/` and `src/lib/company/`.

## 3. Required new artifacts (design only)

- Table: `public.user_connections` (see domain contract §4).
- Enum/trigger: connection status validation + transition guard.
- RLS: participant-scoped policies (see RLS & privacy matrix).
- RPCs / server functions: request/accept/decline/cancel/disconnect/block/unblock/getState/list\*.
- Services: `GlobalConnectionRepository`, `GlobalConnectionService`, `GlobalConnectionSDK`.
- Adapter: `RelationshipState` read adapter unifying saved-card + global-connection + association contexts.
- Helper: `requireGlobalNetworkUser()`.

## 4. Metrics

- **Current legacy dependency count:** 4 UI/route consumers (`MemberNetworking.tsx`, `network.tsx`, `members.$memberId.tsx`, marketplace/opportunities read `getStatus`), 1 store, 1 server-fn module, 5 RPCs, 2 tables (`connections`, `messages`).
- **Reusable infra count:** 5 (auth middleware, identity SDK, notifications, rate limiter, layering pattern).
- **New tables/RPCs/functions:** 1 table, 1 status enum + 2 triggers, ~11 service methods behind thin server fns.

## 5. Gate

See `BC3_0_IMPLEMENTATION_RUNBOOK.md` §Gate. Result: **GO** — legacy and global identity spaces are cleanly separable; no dual-write; rollback isolated.

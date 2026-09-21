# BC0_SECURITY_TEST_PLAN — Persona × Resource × Action Matrix (BC-0.3)

Documentation-only. Defines expected allow/deny outcomes to be encoded as tests
in BC-1+ (extending `rls-anon-exposure.e2e.test.ts`, `rls-ownership.e2e.test.ts`,
`multi-tenant-rls.e2e.test.ts`, `business-cards-scoping.e2e.test.ts`).

## Personas

- **P0** Anonymous
- **P1** Global user, no `members` row
- **P2** Association A member
- **P3** Association B member
- **P4** Association A manager/admin
- **P5** Business Card owner
- **P6** Unrelated authenticated user
- **P7** Community owner (future)
- **P8** Community moderator (future)
- **P9** Community active member (future)
- **P10** Community suspended/removed member (future)
- **P11** Platform admin/moderator

## Notation

✅ allow · ❌ deny · pub = public projection only · agg = aggregate only · n/a =
resource not applicable to persona. "select" = authenticated raw/scoped read;
"public read" = anon/D-projection read.

## R1. User profile (`user_profiles`, model A)

| Persona      | public read  | select  | insert  | update        | delete  |
| ------------ | ------------ | ------- | ------- | ------------- | ------- |
| P0           | pub(display) | ❌      | ❌      | ❌            | ❌      |
| P1/owner     | pub          | ✅(own) | ✅(own) | ✅(own)       | ✅(own) |
| P6 unrelated | pub          | ❌      | ❌      | ❌            | ❌      |
| P11 platform | pub          | ✅      | ❌      | moderate-only | ❌      |

## R2. Global card (model A + D)

| Persona                        | public read           | select | insert | update | delete | moderate |
| ------------------------------ | --------------------- | ------ | ------ | ------ | ------ | -------- |
| P0                             | pub(published/public) | ❌     | ❌     | ❌     | ❌     | ❌       |
| P5 owner                       | pub                   | ✅     | ✅     | ✅     | ✅     | ❌       |
| P4 assoc mgr (unrelated assoc) | pub                   | ❌     | ❌     | ❌     | ❌     | ❌       |
| P6                             | pub                   | ❌     | ❌     | ❌     | ❌     | ❌       |
| P11                            | pub                   | ✅     | ❌     | ❌     | ✅     | ✅       |

## R3. Association-linked card (model B + A)

| Persona               | public read | members-only read | edit content | lifecycle | suspend badge | delete |
| --------------------- | ----------- | ----------------- | ------------ | --------- | ------------- | ------ |
| P0                    | pub         | ❌                | ❌           | ❌        | ❌            | ❌     |
| P5 owner              | pub         | ✅                | ✅           | ✅        | ❌            | ✅     |
| P2 same-assoc member  | pub         | ✅                | ❌           | ❌        | ❌            | ❌     |
| P4 same-assoc mgr     | pub         | ✅                | ❌           | ❌        | ✅            | ❌     |
| P3 other-assoc member | pub         | ❌                | ❌           | ❌        | ❌            | ❌     |
| P11                   | pub         | ✅                | ❌           | ✅        | ✅            | ✅     |

## R4. Legacy unresolved card (member_id set, owner_user_id null — case C)

| Persona                                    | read     | edit | delete | notes                        |
| ------------------------------------------ | -------- | ---- | ------ | ---------------------------- |
| linked member (P5 via `current_member_id`) | ✅       | ✅   | ✅     | legacy RLS authoritative     |
| P1 global user                             | ❌       | ❌   | ❌     | never guessed into ownership |
| P4 same-assoc mgr                          | ✅(read) | ❌   | ❌     | moderation only              |
| P11                                        | ✅       | ❌   | ✅     | platform                     |

## R5. Public card projection (model D, via safe RPC)

| Persona                                                                                      | published+public   | hidden/draft | private | suspended |
| -------------------------------------------------------------------------------------------- | ------------------ | ------------ | ------- | --------- |
| P0                                                                                           | ✅ pub fields only | ❌ 404       | ❌ 404  | ❌ 404    |
| P6                                                                                           | ✅ pub             | ❌           | ❌      | ❌        |
| Never returned to anyone via D: leads, interactions, audit, private contact, owner analytics |

## R6. Saved card (`saved_business_cards`, model A)

| Persona    | read own saves | read others' saves | see who saved my card | insert | delete own |
| ---------- | -------------- | ------------------ | --------------------- | ------ | ---------- |
| P5 saver   | ✅             | ❌                 | —                     | ✅     | ✅         |
| card owner | n/a            | ❌                 | agg count only        | —      | —          |
| P11        | ❌(private)    | ❌                 | ❌                    | ❌     | ❌         |

## R7. Global connection (`user_connections`, model A dual)

| Persona         | read | create(request)   | accept/decline | cancel      | disconnect    |
| --------------- | ---- | ----------------- | -------------- | ----------- | ------------- |
| requester       | ✅   | ✅(self resolved) | ❌             | ✅(pending) | ✅(connected) |
| recipient       | ✅   | ❌                | ✅             | ❌          | ✅            |
| unrelated P6    | ❌   | ❌                | ❌             | ❌          | ❌            |
| self-connection | —    | ❌ prohibited     | —              | —           | —             |

## R8. Association connection (legacy `connections`, model B)

| Persona                        | read                     | net_send        | net_accept   | net_remove |
| ------------------------------ | ------------------------ | --------------- | ------------ | ---------- |
| P2 owner (`current_member_id`) | ✅(own)                  | ✅(same assoc)  | ✅(incoming) | ✅         |
| P3 other assoc                 | ❌                       | ❌(cross-assoc) | ❌           | ❌         |
| P1 no member row               | ❌ ("No member profile") | ❌              | ❌           | ❌         |

## R9. Communities (public / private / secret — model C + D)

| Persona               | public profile      | private content | secret existence  | member list | post | moderate              |
| --------------------- | ------------------- | --------------- | ----------------- | ----------- | ---- | --------------------- |
| P0/P1 non-member      | public✅ / others❌ | ❌              | ❌(secret hidden) | ❌          | ❌   | ❌                    |
| P9 active member      | ✅                  | ✅              | ✅                | ✅          | ✅   | ❌                    |
| P8 moderator          | ✅                  | ✅              | ✅                | ✅          | ✅   | ✅                    |
| P7 owner              | ✅                  | ✅              | ✅                | ✅          | ✅   | ✅ + transfer/archive |
| P10 suspended/removed | public only         | ❌ immediate    | ❌                | ❌          | ❌   | ❌                    |

## R10. Association Marketplace listing (`products`, model B)

| Persona        | read       | insert              | update  | delete  |
| -------------- | ---------- | ------------------- | ------- | ------- |
| P2 member      | ✅(scope)  | ✅(own member)      | ✅(own) | ✅(own) |
| P1 no member   | ❌         | ❌ (no fake member) | ❌      | ❌      |
| P3 other assoc | scope-deny | ❌                  | ❌      | ❌      |

## R11. Membership Identity pass (model B + D verify)

| Persona      | read own | verify (public D)  | issue/suspend | notes                                      |
| ------------ | -------- | ------------------ | ------------- | ------------------------------------------ |
| P5 member    | ✅       | —                  | ❌            | pass secret never exposed                  |
| P4 assoc mgr | scope    | —                  | ✅            |                                            |
| P0 verifier  | ❌ raw   | ✅ safe verify RPC | ❌            | BC card QR ≠ identity verify (invariant 9) |
| P11          | ✅       | ✅                 | ✅            |                                            |

## Cross-cutting assertions (must be tested with real separate JWTs)

1. P3 (assoc B) can never read/modify assoc A member-scoped rows.
2. P1 global user hitting member-scoped RPC → explicit "No member profile" (not crash).
3. Anon can never read `business_card_leads/interactions/audit` (currently correct).
4. Anon raw SELECT on `member_business_cards` must be **removed** and re-tested (P0-A).
5. Client-supplied `owner_user_id`/`member_id`/role is ignored (spoof test).

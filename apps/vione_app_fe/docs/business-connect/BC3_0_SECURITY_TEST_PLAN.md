# BC-3.0 — Security & Abuse Test Plan (Global Networking)

Architecture Version: **Business Connect v1 (FROZEN)**. Test design — implementation-ready, not yet executed.

## 1. Authorization

| ID  | Case                                              | Expected                     |
| --- | ------------------------------------------------- | ---------------------------- |
| A1  | anon SELECT `user_connections`                    | 0 rows / denied              |
| A2  | authenticated non-participant SELECT a pair's row | 0 rows                       |
| A3  | participant SELECT own connection                 | visible                      |
| A4  | platform admin moderation SELECT                  | visible (audit only)         |
| A5  | unauthenticated mutation                          | 401                          |
| A6  | suspended account sendRequest                     | denied; own reads allowed    |
| A7  | user without member row sendRequest               | allowed (global first-class) |

## 2. Identity forgery

| ID  | Case                                           | Expected                               |
| --- | ---------------------------------------------- | -------------------------------------- |
| F1  | client sets `requester_user_id` ≠ `auth.uid()` | server overrides to `auth.uid()`       |
| F2  | client submits target `status` directly        | ignored; only named methods transition |
| F3  | client forges `source_id` of private resource  | not persisted / not exposed            |

## 3. State machine

| ID  | Case                                                  | Expected              |
| --- | ----------------------------------------------------- | --------------------- |
| S1  | requester accepts own request                         | rejected              |
| S2  | recipient cancels requester's request                 | rejected              |
| S3  | accept non-pending                                    | rejected              |
| S4  | disconnect non-accepted                               | rejected              |
| S5  | duplicate request (same direction)                    | rejected (uniqueness) |
| S6  | reverse duplicate (recipient re-requests active pair) | rejected              |
| S7  | new request after decline/cancel/disconnect           | allowed               |
| S8  | self-connection                                       | rejected (CHECK)      |

## 4. Cross-user & cross-tenant

| ID  | Case                                                                    | Expected                            |
| --- | ----------------------------------------------------------------------- | ----------------------------------- |
| X1  | user A cannot read/modify B↔C connection                                | denied                              |
| X2  | member of assoc-1 global-connects user in assoc-2                       | allowed (global is tenant-agnostic) |
| X3  | global connection does not appear in legacy `connections`/`net_*` state | isolated                            |
| X4  | legacy association connection does not appear in `user_connections`     | isolated                            |

## 5. Privacy / leakage

| ID  | Case                                                  | Expected                |
| --- | ----------------------------------------------------- | ----------------------- |
| P1  | counterpart cannot see my saved-card tags/notes/score | never exposed           |
| P2  | blocked user is not told "blocked"                    | opaque                  |
| P3  | saved card rendered as connection                     | never                   |
| P4  | enumeration of non-discoverable accounts              | no existence disclosure |

## 6. Abuse / rate limiting

| ID  | Case                                | Expected             |
| --- | ----------------------------------- | -------------------- |
| R1  | rapid repeated sendRequest over cap | throttled            |
| R2  | mass requests to many targets       | throttled per window |
| R3  | request to user who blocked me      | rejected silently    |

## 7. Regression (legacy must stay green)

| ID  | Case                            | Expected       |
| --- | ------------------------------- | -------------- |
| L1  | `networking-invite.e2e.test.ts` | pass unchanged |
| L2  | `multi-tenant-rls.e2e.test.ts`  | pass unchanged |
| L3  | member networking UI flow       | unchanged      |

## 8. Typecheck

`tsgo` clean across new contracts/types; no `any` in domain contracts.

# Identity Bridge API Reference (BC-1.2)

All APIs are **additive** and **server-trusted**. Every method documents its
trusted source, nullable behavior, intended consumers, and forbidden usage.
There is intentionally no generic "resolve everything" method that hides
authorization requirements.

## Server helpers — `src/lib/identity/identity-bridge.server.ts`

> Server-only (`*.server` filename blocks client bundling). Imported only by
> `identity-bridge.functions.ts`.

### `resolveActiveAssociationContext(supabase, userId)`

- **Returns:** `ActiveAssociationContext | null`
- **Trusted source:** `current_member_id()` + `current_association_id()` RPCs.
- **Nullable:** `null` when no active member/association.
- **Forbidden:** trusting client `memberId`/`associationId`.

### `resolveActiveMemberId(supabase)`

- **Returns:** `string | null`. Additive bridge; not a replacement for
  `resolveMemberId()`.

### `resolveAccountStatus(supabase, userId)`

- **Returns:** `AccountStatus`. Source: `user_profiles.account_status`.
  Defaults to `"active"` when no profile row (parity with `requirePlatformUser`).
- **Forbidden:** substituting member status.

### `resolveBusinessCardOwnerContext(supabase, cardId)`

- **Returns:** `BusinessCardOwnerContext`.
- **Rule:** `ownerUserId` only from a unique valid `members.user_id`;
  null/ambiguous → `ownershipMode: "unresolved"`. Read-only. No guessing.

## Server functions (RPC) — `src/lib/identity/identity-bridge.functions.ts`

| Function                            | Method | Returns                            | Notes                                                      |
| ----------------------------------- | ------ | ---------------------------------- | ---------------------------------------------------------- |
| `getActiveAssociationContextFn`     | GET    | `ActiveAssociationContext \| null` | JWT-scoped                                                 |
| `getActiveMemberIdFn`               | GET    | `{ memberId: string \| null }`     | graceful                                                   |
| `setActiveAssociationContextFn`     | POST   | `ActiveAssociationContext \| null` | delegates to `set_active_association`; rejects cross-assoc |
| `getAccountStatusFn`                | GET    | `AccountStatusResult`              | platform status only                                       |
| `resolveBusinessCardOwnerContextFn` | GET    | `BusinessCardOwnerContext`         | BC-2 prep, read-only                                       |

## SDK — `PlatformIdentitySDK`

| Method                                    | Source                         | Nullable             | Consumers             | Forbidden                       |
| ----------------------------------------- | ------------------------------ | -------------------- | --------------------- | ------------------------------- |
| `getCurrentUser()`                        | JWT + profile                  | throws if inactive   | any signed-in surface | tenant authz                    |
| `getProfile()`                            | `user_profiles`                | `null` until created | profile screens       | storing assoc data              |
| `updateProfile(input)`                    | owner RLS                      | —                    | profile screens       | —                               |
| `getAccountStatus()`                      | `user_profiles.account_status` | never                | platform gating       | member-status substitution      |
| `isAccountActive()`                       | account status                 | never                | platform gating       | tenant gating                   |
| `getContexts()`                           | resolver                       | never throws         | overview UIs          | —                               |
| `getAssociationContexts()`                | `memberships`                  | `[]` valid           | switchers             | platform authz                  |
| `getActiveAssociationContext()`           | frozen RPCs                    | `null`               | tenant surfaces       | client memberId/assocId         |
| `setActiveAssociationContext(id)`         | `set_active_association`       | `null`               | switcher              | arbitrary memberId, cross-assoc |
| `getActiveMemberId()`                     | `current_member_id()`          | `null`               | graceful reads        | write authz                     |
| `hasAssociation()`                        | assoc contexts                 | never                | onboarding            | —                               |
| `getCommunityContexts()`                  | reserved BC-6                  | `[]`                 | BC-6                  | fabrication                     |
| `hasCommunity()`                          | reserved BC-6                  | `false`              | BC-6                  | fabrication                     |
| `resolveBusinessCardOwnerContext(cardId)` | card + unique link             | never                | BC-2 prep             | treating "unresolved" as grant  |

## Types — `src/lib/identity/identity.types.ts`

- `ActiveAssociationContext` — `{ userId, memberId, associationId, memberStatus?, associationRole? }`
- `AccountStatusResult` — `{ userId, accountStatus, isActive }`
- `BusinessCardOwnershipMode` — `"global_user" | "legacy_member" | "unresolved"`
- `BusinessCardOwnerContext` — `{ cardId, ownerUserId?, memberId?, associationId?, ownershipMode }`
- `CommunityRole` / `CommunityMembershipStatus` / `CommunityIdentityContext` — reserved BC-6, frozen signatures.

## BC-2.0 note — Ownership resolver evolution

`resolveBusinessCardOwnerContext(cardId)` remains the read-only source of truth.
In BC-2.1 it will prefer a valid `owner_user_id` (→ `global_user`) before falling
back to the unique member→user mapping (→ `legacy_member`); no trustworthy
mapping → `unresolved`. `unresolved` never grants mutation. See
`BC2_0_RLS_TRANSITION_DESIGN.md`.

# BC-1.2 — Identity Bridge Contracts

**Status:** Complete · **Date:** 2026-07-13 · **Type:** Additive, backward-compatible

## Objective

Provide the additive identity bridge contracts required by later Business
Connect phases (BC-2 Business Card, BC-3 Networking, BC-4 Marketplace, BC-6
Community) **without migrating any domain**. No schema, no RLS, no route/UI
changes, no Association-helper changes.

## What was added

| Artifact                                         | Kind             | Notes                                                                                                                                                                                |
| ------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/identity/identity-bridge.server.ts`     | server helpers   | `resolveActiveAssociationContext`, `resolveActiveMemberId`, `resolveAccountStatus`, `resolveBusinessCardOwnerContext`                                                                |
| `src/lib/identity/identity-bridge.functions.ts`  | server fns (RPC) | `getActiveAssociationContextFn`, `getActiveMemberIdFn`, `setActiveAssociationContextFn`, `getAccountStatusFn`, `resolveBusinessCardOwnerContextFn`                                   |
| `src/lib/identity/identity.types.ts`             | types            | `ActiveAssociationContext`, `AccountStatusResult`, `BusinessCardOwnerContext`, `BusinessCardOwnershipMode`, `CommunityIdentityContext`, `CommunityRole`, `CommunityMembershipStatus` |
| `src/lib/identity/platform-identity-sdk.ts`      | SDK              | new account-status, active-association, card-owner, community methods                                                                                                                |
| `src/__tests__/identity-bridge.contract.test.ts` | tests            | 14 tests, all green                                                                                                                                                                  |

## Design rules honoured

- `resolveActiveAssociationContext` never throws just because the user has no
  member row — returns `null`.
- Active association is resolved from the trusted platform path
  (`current_member_id()` / `current_association_id()`, security-definer,
  JWT-scoped). Client-provided `memberId` / `associationId` are never trusted.
- `set_active_association` (existing security-definer RPC) validates membership
  and rejects cross-association selection — the bridge delegates, introducing
  **no new client-trusted tenancy state**.
- Platform account status (`user_profiles.account_status`) stays distinct from
  association member status — never substituted.
- Card-owner bridge derives `ownerUserId` **only** from a unique valid
  `members.user_id` mapping; null/ambiguous → `ownershipMode: "unresolved"`.
  Never guesses; never uses an association admin as owner. Read-only.
- Community contract types are frozen for BC-6; `getCommunityContexts()` returns
  `[]` and `hasCommunity()` returns `false` — no fabricated data.

## my-pass technical debt

The raw `supabase.rpc("current_member_id")` call in
`src/lib/member-identity-pass/my-pass.functions.ts` was replaced with the
existing narrow additive wrapper `resolveMemberIdOrNull` from
`src/lib/current-member.ts`. Behavior is **identical** (graceful `null`, same
empty-pass path). No Digital Membership Identity logic changed.

## Non-goals (explicitly not done)

- No `owner_user_id` on Business Card, no Business Card RLS changes.
- No `user_connections`, no community schema.
- No changes to existing Association identity helpers, routes, or UI.

## Verification

- Typecheck clean (`tsgo --noEmit`).
- `identity-bridge.contract.test.ts` (14) + `platform-identity.contract.test.ts`
  (8) green.

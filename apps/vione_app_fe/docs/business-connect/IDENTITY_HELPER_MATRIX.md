# BC-0.2 — Identity Helper Matrix

Documentation-only. Existing helpers are **not** replaced. Future helpers are
additive proposals; none implemented in BC-0.2.

## Existing helpers (unchanged)

| Helper                     | Source                                         | Returns                                 | Behavior                 |
| -------------------------- | ---------------------------------------------- | --------------------------------------- | ------------------------ |
| `requireSupabaseAuth()`    | `src/integrations/supabase/auth-middleware.ts` | `context.userId`, RLS-scoped `supabase` | 401 if unauthenticated   |
| `current_member_id()`      | SQL SECURITY DEFINER                           | member id                               | NULL if no linked member |
| `current_association_id()` | SQL SECURITY DEFINER                           | association id                          | NULL if no membership    |
| `resolveMemberId()`        | `src/lib/current-member.ts`                    | member id                               | **throws** if null       |
| `resolveAssociationId()`   | `src/lib/current-member.ts`                    | association id                          | **throws** if null       |

## Future additive helpers (proposed)

| Helper                                | Purpose                          | Trusted source                               | Nullable/failure                 |
| ------------------------------------- | -------------------------------- | -------------------------------------------- | -------------------------------- |
| `requirePlatformUser()`               | Gate any authenticated BC action | `requireSupabaseAuth`                        | 401 if unauthenticated           |
| `resolveGlobalUserId()`               | Return `auth.users.id`           | middleware context                           | never null when authenticated    |
| `resolveUserProfile()`                | Load Global User Profile         | `owner_user_id` query                        | null if profile not yet created  |
| `getOptionalAssociationMemberships()` | List memberships (may be `[]`)   | server query of `memberships`/`members`      | never throws; `[]` valid         |
| `buildGlobalIdentityContext()`        | Assemble GlobalIdentityContext   | above helpers                                | valid with no memberships        |
| `requireAssociationIdentity()`        | Gate association-domain actions  | `resolveMemberId` + `resolveAssociationId`   | throws outside association scope |
| `requireCommunityIdentity()`          | Gate community actions           | `requireSupabaseAuth` + community-role query | throws if not a community member |

## Domain decision matrix

| Domain                 | Primary helper                                                 | Identity context  | Notes                                        |
| ---------------------- | -------------------------------------------------------------- | ----------------- | -------------------------------------------- |
| Business Card (global) | `requirePlatformUser` / `buildGlobalIdentityContext`           | Global            | `owner_user_id`; member/association optional |
| Saved Cards            | `requirePlatformUser`                                          | Global            | `owner_user_id` saves any card               |
| Global Networking      | `requirePlatformUser` + `buildGlobalIdentityContext`           | Global            | user-to-user; not `members`                  |
| Community              | `requireCommunityIdentity`                                     | Community         | independent from `members`                   |
| Association Members    | `requireAssociationIdentity`                                   | Association       | existing `resolveMemberId` path              |
| Fees                   | `requireAssociationIdentity`                                   | Association       | D-class, member-scoped                       |
| Membership Identity    | `requireAssociationIdentity`                                   | Association       | member + issued pass; BC QR ≠ this           |
| Marketplace (legacy)   | `requireAssociationIdentity`                                   | Association       | user-owned path deferred (ADR-BC-003)        |
| Events                 | existing RLS (`has_assoc_role`)                                | Association       | admin-owned; unchanged                       |
| AI                     | `resolveAssociationId` (+ future `buildGlobalIdentityContext`) | Association today | works with association-only, no member row   |

## BC-1.2 additive bridge helpers (implemented)

> Additive, server-trusted. Do NOT replace `resolveMemberId()` /
> `resolveAssociationId()` or the frozen `current_member_id()` /
> `current_association_id()` RPCs.

| Helper                                       | Purpose                     | Trusted source                                      | Nullable                                       | Consumers            |
| -------------------------------------------- | --------------------------- | --------------------------------------------------- | ---------------------------------------------- | -------------------- |
| `resolveActiveAssociationContext()`          | Active tenancy context      | `current_member_id()` + `current_association_id()`  | `null` if no active member                     | tenant surfaces      |
| `resolveActiveMemberId()`                    | Active member id (bridge)   | `current_member_id()`                               | `null` graceful                                | graceful reads       |
| `setActiveAssociationContextFn`              | Switch active association   | `set_active_association` RPC (validates membership) | `null`                                         | association switcher |
| `resolveAccountStatus()`                     | Platform account status     | `user_profiles.account_status`                      | never (defaults `active`)                      | platform gating      |
| `resolveBusinessCardOwnerContext()`          | BC-2 owner prep (read-only) | card + unique `members.user_id`                     | `ownershipMode:"unresolved"` if null/ambiguous | BC-2 tooling         |
| `PlatformIdentitySDK.getCommunityContexts()` | Community placeholder       | reserved BC-6                                       | `[]` (no fabrication)                          | BC-6                 |

**my-pass debt resolved:** raw `current_member_id` RPC replaced by
`resolveMemberIdOrNull` (identical behavior).

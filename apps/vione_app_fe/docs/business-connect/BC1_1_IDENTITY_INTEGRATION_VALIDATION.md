# BC-1.1 — Platform Identity Integration Validation

**Status:** Validation only (no redesign, no ownership changes, no domain migration)
**Date:** 2026-07-13
**Baseline:** PBM-1.0 · Architecture Business Connect v1 · Identity Foundation BC-1.0
**Scope guard:** No Business Card / Networking / Marketplace migration performed.

This report is the umbrella for four artifacts:

1. Identity Integration Matrix (per domain)
2. Server Function Matrix (direct identity-primitive callers)
3. Identity Coverage Report (SDK sufficiency + gaps)
4. Future Adapter List

---

## Method

Static analysis of `src/lib/**/*.functions.ts` and `.server.ts` helpers plus
DB helper definitions. Identity primitives tracked:

- **PlatformIdentity** — `user_profiles` / `PlatformIdentitySDK` / `resolvePlatformIdentityFn` (BC-1.0, global, member-independent).
- **AssociationIdentity** — `resolveMemberId()`, `resolveMemberIdOrNull()`, `resolveAssociationId()`, `current_member_id()`, `current_association_id()`, and RLS policies built on `is_member_of` / `has_assoc_role` / `is_assoc_manager`.

A domain that carries **no explicit identity call** but reads through
`context.supabase` (`requireSupabaseAuth`) is classified **AssociationIdentity
(via RLS)** — the RLS policies internally invoke the association helpers.

---

## 1. Identity Integration Matrix

| Domain                      | Uses                                       | Mechanism                                                          | Notes                                                           |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Association (mgmt)          | AssociationIdentity                        | `memberships`, `has_assoc_role`, `is_assoc_manager`, RLS           | Correct — association-scoped by design                          |
| Member PWA (`member-app/*`) | AssociationIdentity                        | `resolveMemberId`, `resolveAssociationId`                          | Correct — member-bound surface                                  |
| AI                          | AssociationIdentity                        | `resolveAssociationId`, `current_association_id`                   | Persona = association; global AI persona is BC-later            |
| Companies                   | AssociationIdentity (via RLS)              | `context.supabase` only                                            | RLS on `associations`/related tables                            |
| Meetings                    | AssociationIdentity (via RLS)              | `context.supabase` only                                            | No explicit identity call                                       |
| Marketplace                 | AssociationIdentity                        | `resolveMemberId` ×10                                              | Correct — member-owned listings                                 |
| Notifications (assoc)       | AssociationIdentity (via RLS)              | `context.supabase` only                                            | Assoc-scoped notifications                                      |
| Notifications (member PWA)  | AssociationIdentity                        | `resolveMemberId` ×8                                               | Member inbox                                                    |
| Documents                   | AssociationIdentity (via RLS)              | `context.supabase` only                                            | RLS on `documents`                                              |
| Events                      | AssociationIdentity (via RLS)              | `context.supabase` only                                            | RLS on `events`/tickets                                         |
| Membership Identity (pass)  | AssociationIdentity                        | `current_member_id` (my-pass), `association_id` + `userId` (admin) | Member identity pass                                            |
| Wallet                      | AssociationIdentity                        | via member-identity-pass                                           | Pass mint/wallet tokens                                         |
| QR                          | AssociationIdentity                        | member-identity-pass + event QR fields                             | Signed member/ticket payloads                                   |
| Verify                      | AssociationIdentity (public projection)    | `association_id` scoped, signed-token verify                       | Public read via safe projection                                 |
| Networking                  | AssociationIdentity                        | `resolveMemberId` ×5                                               | Member↔member connections                                       |
| Opportunities               | AssociationIdentity                        | `resolveMemberId` ×6                                               | Member-owned opportunities                                      |
| Member Activity             | AssociationIdentity                        | `resolveMemberIdOrNull` ×2                                         | Tolerant of missing member                                      |
| **Business Card**           | AssociationIdentity **(migration target)** | `resolveMemberId`, `resolveMemberIdOrNull`, `resolveAssociationId` | **Roadmap: → PlatformIdentity (user-owned). Adapter required.** |
| Platform Identity (BC-1.0)  | PlatformIdentity                           | `PlatformIdentitySDK`, `resolvePlatformIdentityFn`                 | New foundation; not yet consumed by any domain                  |

**Finding:** No existing domain consumes PlatformIdentity yet — expected at
BC-1.1 (foundation just landed). Every domain is AssociationIdentity, either
explicitly or via RLS. This is the correct pre-migration state.

---

## 2. Server Function Matrix — direct identity-primitive callers

Files invoking `resolveMemberId()` / `resolveMemberIdOrNull()` /
`current_member_id()` directly.

| Module                                      | Primitive                                             | Count | Classification                | Rationale                                                                                          |
| ------------------------------------------- | ----------------------------------------------------- | ----- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `networking.functions.ts`                   | `resolveMemberId`                                     | 5     | **Correct**                   | Member-to-member domain; must stay association-bound                                               |
| `marketplace.functions.ts`                  | `resolveMemberId`                                     | 10    | **Correct**                   | Member-owned listings; association-scoped                                                          |
| `opportunities.functions.ts`                | `resolveMemberId`                                     | 6     | **Correct**                   | Member-owned opportunities                                                                         |
| `member-app/notifications.functions.ts`     | `resolveMemberId`                                     | 8     | **Correct**                   | Member PWA inbox                                                                                   |
| `member-activity.functions.ts`              | `resolveMemberIdOrNull`                               | 2     | **Correct**                   | Already null-tolerant                                                                              |
| `member-identity-pass/my-pass.functions.ts` | `current_member_id` (raw RPC)                         | 1     | **Technical debt (minor)**    | Bypasses `resolveMemberId` helper — inconsistent; wrap in helper for uniformity. No behavior bug.  |
| `business-card.functions.ts`                | `resolveMemberId` / `OrNull` / `resolveAssociationId` | ~10   | **Needs adapter later**       | BC roadmap makes cards user-owned (PlatformIdentity). Requires ownership adapter before migration. |
| `current-member.ts`                         | defines `resolveMemberId*`                            | —     | **Correct (source of truth)** | Frozen adapter helper; keep authoritative                                                          |

`resolveAssociationId` callers (`ai`, `reply-templates`, `member-app/profile`)
are **Correct** — genuinely association-scoped features.

**Classification totals:** Correct = 6 domains · Needs adapter later = 1
(Business Card) · Technical debt = 1 minor (my-pass raw RPC).

---

## 3. Identity Coverage Report — is PlatformIdentitySDK sufficient?

### Present in `PlatformIdentitySDK`

`getCurrentUser`, `getProfile`, `updateProfile`, `getContexts`,
`resolvePlatformIdentity`, `hasAssociation`, `getAssociations`,
`hasCommunity`, `getCommunities`.

### Context validation (three required cases)

| Case                    | Path                                                                                                 | Result                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| User **without** member | `getCurrentUserFn` → `requirePlatformUser` (member optional) + `getAssociationContexts` returns `[]` | ✅ Valid platform user; no throw           |
| User **with** member(s) | `getAssociationContexts` maps memberships + best-effort `memberId` per association                   | ✅ Correct                                 |
| **Future community**    | `communities: []` placeholder in `PlatformIdentity` + `getCommunities()` returns `[]`                | ✅ Structurally ready (BC-2 will populate) |

Verified in `platform-identity.server.ts`: `requirePlatformUser` throws only on
non-`active` account status; `getAssociationContexts` returns `[]` for zero
memberships and never throws on missing member rows.

### Sufficiency verdict

**Sufficient for BC-1.1** (read/update global identity + read association
contexts). **Not yet sufficient** to migrate any association domain onto
PlatformIdentity — the bridging APIs below are missing.

### Missing APIs (gaps)

| Gap                                                                                | Needed by                                 |
| ---------------------------------------------------------------------------------- | ----------------------------------------- |
| `resolveActiveMemberId(associationId?)` — PlatformIdentity → memberId bridge       | Any domain migrated off `resolveMemberId` |
| `setActiveAssociation(id)` in SDK (RPC `set_active_association` exists, unexposed) | Multi-association switching UI            |
| `getAccountStatus()` / `isSuspended` client signal                                 | Account-status guarded UI                 |
| `resolveCardOwner()` (user-owned card identity)                                    | Business Card migration                   |
| Community membership resolution                                                    | BC-2 communities                          |

None are bugs — all are **future** additive surface.

---

## 4. Future Adapter List

Ordered by dependency; all additive, none required at BC-1.1.

1. **Association member adapter** — `resolveActiveMemberId(context, associationId?)`
   wrapping `current_member_id()` behind the SDK so association domains can move
   from direct `resolveMemberId()` calls without behavior change.
2. **Business Card ownership adapter** — map card ownership from `member_id` to
   `user_id` (PlatformIdentity) with a compatibility shim during migration
   (prerequisite for the BC Business Card phase).
3. **Active-association adapter** — expose `set_active_association` through the
   SDK for context switching.
4. **Account-status guard adapter** — surface `accountStatus` to client guards
   (suspended/deactivated) consistently.
5. **Community adapter** — populate `communities[]` (BC-2), replacing the
   frozen empty projection.
6. **my-pass helper normalization (debt)** — route
   `member-identity-pass/my-pass` through `resolveMemberId` instead of the raw
   `current_member_id` RPC.

---

## Outcome

- **No bug discovered.** No implementation changes required by this phase.
- Platform Identity Foundation **coexists correctly** with all 13 audited
  domains; no domain regressed and none depends on the new foundation yet.
- Business Card is the single domain flagged **Needs adapter later**; it stays
  unmigrated per scope guard.
- Typecheck: clean. Tests: identity contract 8/8 pass; live RLS suite skips
  without service role (runs in CI).

**Recommended next phase:** BC-2 planning — build the Association member adapter
(#1) before any domain migration.

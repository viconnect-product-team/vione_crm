# BC-0.2 — Global Identity Contract (FROZEN)

Status: **Frozen contract.** Documentation-only. No source, schema, migration,
RLS, grant, route or routeTree change was made in BC-0.2. All statements below
are grounded in BC-0.1 findings (`BC0_PLATFORM_INVENTORY.md`,
`BC0_DEPENDENCY_MATRIX.md`, `BC0_CALL_GRAPHS.md`, `BC0_BLOCKERS_AND_RISKS.md`).

---

## 1. Current identity reality (verified in BC-0.1)

| Fact                                                                                  | Evidence (BC-0.1)                                                                                                                                                                              |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication can succeed without a `members` row.                                   | `/m` guard (`src/routes/m.tsx`) checks only `supabase.auth.getUser()`; no member check.                                                                                                        |
| `handle_new_user` does **not** create a `members` row.                                | Trigger inserts `profiles` + `user_roles` + `memberships` only (Inventory §1).                                                                                                                 |
| `current_member_id()` can return NULL for a valid authenticated user.                 | SECURITY DEFINER fn resolves `members.user_id = auth.uid()` scoped to `current_association_id()`; NULL when no linked member row.                                                              |
| Business Cards require member identity.                                               | `saveBusinessCardFn` et al. call `resolveMemberId` (`src/lib/business-card.functions.ts`); RLS `member_id = current_member_id()`.                                                              |
| Networking + `net_*` RPCs require member identity.                                    | `net_send_request` / `net_accept_request` / `net_decline_request` / `net_remove_connection` resolve `current_member_id()` and `RAISE 'No member profile'` (`src/lib/networking.functions.ts`). |
| Marketplace requires member identity.                                                 | `marketplace.functions.ts` calls `resolveMemberId`; RLS `products_member_insert`.                                                                                                              |
| `card_settings`, `profiles`, `user_roles` are `auth.uid()`-owned / platform-oriented. | `card_settings.user_id = auth.uid()` (`src/lib/card.functions.ts`), `profiles.id = auth.uid()`, `user_roles` user/platform scoped.                                                             |
| Association domains correctly require member/association context.                     | Fees, renewals, identity pass, meetings, campaigns — `has_assoc_role` / `member` RLS (Dependency Matrix, D-class).                                                                             |

Full traces in `BC0_CALL_GRAPHS.md` A–J.

---

## 2. Identity concepts (formal definitions)

### A. Platform User

- **Backed by:** `auth.users.id`.
- Authenticated account on the unified platform.
- May exist with **zero** association memberships.
- May use Business Connect.
- May later join one or more associations or communities.

### B. Global User Profile (future, additive)

- Belongs to exactly one Platform User.
- **Contains only** platform-level data: display name, avatar, professional
  title, company display, industry, region, biography, locale, onboarding status.
- **Must NOT contain:** member code, membership level, fee status, association
  renewal, private association notes, official membership status.

### C. Association Member

- Existing `members` row.
- Formal membership inside one association; owns association-specific attributes
  and lifecycle.
- May optionally be linked to an auth user (`members.user_id`).
- Remains authoritative for all association functions.

### D. Community Member (future)

- Relationship between a Platform User and a self-created Business Community.
- **Not** an official association membership.
- Carries community role/status only.
- Must **never** create or reuse a fake `members` row.

### E. Business Card Owner

- Always resolves to a **Platform User**.
- May optionally link to: an Association Member, an Association, a Company, a
  Community context.

### F. Membership Identity Holder

- Always based on a valid association member + association-issued pass
  (`member_identity_passes`, D-class).
- Remains separate from Business Card ownership.

---

## 3. Architectural invariants (mandatory)

1. Platform User ≠ Association Member.
2. Global User Profile ≠ Association Member.
3. Community Member ≠ Association Member.
4. A Business Connect user must **never** receive a fake `members` row.
5. Association-only functions continue using member/association identity.
6. Business Connect functions use auth user identity by default.
7. Business Card ownership is ultimately user-based (`owner_user_id`).
8. Membership Card remains association-issued and member-based.
9. Business Card QR must **not** be treated as Membership Identity verification.
10. Platform roles, association roles, community roles and resource ownership stay separate.
11. Client input must never be trusted for `owner_user_id`, `member_id`,
    `association_id`, `community_id`, role or permission — all server-resolved.
12. Existing `/m/*` and Association Admin behavior must remain backwards compatible.

### Prohibited Patterns

```ts
// ❌ Creating a fake members row so a BC user can "own" a card / listing.
await supabaseAdmin.from("members").insert({ user_id, association_id: DEFAULT });

// ❌ Trusting client-supplied ownership.
saveCardFn({ owner_user_id: input.owner_user_id })      // spoofable
createListingFn({ member_id: input.member_id })         // spoofable

// ❌ Storing membership/association lifecycle on the global profile.
user_profiles: { member_code, fee_status, renewal_due }  // leaks D-class data

// ❌ Treating a Business Card QR scan as membership verification.
if (scannedCardId) grantMemberBenefits()                 // BC QR ≠ identity pass

// ❌ Letting an unrelated association moderate a global (unlinked) card.
policy: association admin can UPDATE any member_business_cards

// ❌ Big-bang rename/migration of member_business_cards → business_cards.
ALTER TABLE member_business_cards RENAME TO business_cards; -- breaks live RLS
```

```sql
-- ❌ Roles on the profile/member table (privilege-escalation risk).
ALTER TABLE user_profiles ADD COLUMN role text;  -- roles live in user_roles only
```

---

## 4. Target identity graph

```text
auth.users
├── user_profiles            (global, owner_user_id = auth.users.id)
├── business_cards           (global cards, owner_user_id)
├── saved_business_cards     (owner_user_id saves any card)
├── user_connections         (global user-to-user network)
├── community_members         (user ↔ community)
└── optional association memberships (memberships / members)

auth.users
└── members                  (0..N over time; may exist unlinked)
    └── associations
        └── official Membership Identity (member_identity_passes)
```

Clarifications:

- One user may link to **zero, one, or multiple** `members` rows over time.
- A `members` row may exist **without** a linked user account.
- Global resources use `owner_user_id`.
- Association resources remain association/member scoped.
- Community resources use community membership **plus** user ownership.

---

## 5. Identity contexts (contracts, not implemented)

### A. GlobalIdentityContext

```ts
{
  userId: string
  profileId?: string
  displayName?: string
  accountStatus: string
  onboardingStatus?: string
  associationMemberships: Array<{
    memberId: string
    associationId: string
    role?: string
    status?: string
  }>
}
```

- **Trusted source:** `requireSupabaseAuth` → `context.userId`; memberships from
  server-side query of `memberships`/`members`.
- **Nullable:** `profileId`, `displayName`, `onboardingStatus`;
  `associationMemberships` may be `[]`.
- **Failure:** invalid only when unauthenticated (401 via middleware).
- **Domains:** Business Connect, global profile, saved cards, global networking, community.
- **Forbidden usage:** never gate association-lifecycle actions (fees, renewals,
  identity pass) on this context alone.

### B. AssociationIdentityContext

```ts
{
  userId: string
  memberId: string
  associationId: string
  associationRole?: string
  memberStatus?: string
}
```

- **Trusted source:** `current_member_id()` + `current_association_id()` (server).
- **Nullable:** `associationRole`, `memberStatus`.
- **Failure:** explicit error / null outside association domains; existing
  `resolveMemberId` throws `"Tài khoản chưa được liên kết hồ sơ hội viên."`.
- **Domains:** `/m/*`, association admin, fees, renewals, membership identity, association networking/marketplace.
- **Forbidden usage:** never synthesized for BC users; never fabricated to satisfy a global feature.

### C. CommunityIdentityContext

```ts
{
  userId: string
  communityId: string
  communityMemberId?: string
  communityRole?: string
  membershipStatus?: string
}
```

- **Trusted source:** `requireSupabaseAuth` + server-resolved community role.
- **Nullable:** `communityMemberId`, `communityRole`, `membershipStatus`.
- **Failure:** explicit error when user is not a community member.
- **Domains:** future Business Communities.
- **Forbidden usage:** independent from `members`; never writes/reads the `members` table.

---

## 6. Helper strategy

See `IDENTITY_HELPER_MATRIX.md` for the full decision matrix. Existing helpers
(`requireSupabaseAuth`, `current_member_id`, `current_association_id`,
`resolveMemberId`, `resolveAssociationId`) remain unchanged. Future additive
helpers are proposed there.

---

## 7. Backwards-compatibility guarantees

- Existing Association users continue to use `/m/*` unchanged.
- `current_member_id()` behavior remains valid.
- Fees, renewals, Membership Identity remain member-scoped.
- Existing Business Cards remain readable/editable during transition.
- Existing networking flows continue to operate.
- No migration may silently detach cards/relationships from existing members.
- No profile backfill may overwrite association-owned member data.
- Association Admin must not gain moderation rights over unrelated global resources.

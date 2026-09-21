# BC-2.1A — Business Card Ownership Foundation

**Status:** Complete · **Date:** 2026-07-13 · **Type:** Additive, backward-compatible
**Prereqs:** BC-0, BC-1, BC-2.0 GO, PBM-1.0. **Scope:** foundation only — **no cutover**.

## What shipped

| Artifact                                                                                  | Kind               | Notes                                                                        |
| ----------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| `member_business_cards.owner_user_id`                                                     | column (migration) | `uuid NULL`, FK `auth.users(id) ON DELETE SET NULL`. No NOT NULL, no unique. |
| `mbc_owner_idx`, `mbc_owner_status_idx`, `mbc_owner_assoc_idx`, `mbc_pub_slug_status_idx` | indexes            | owner lookup paths + published public slug path.                             |
| `resolveBusinessCardOwnerContext`                                                         | resolver           | priority: `owner_user_id` → legacy member → unresolved.                      |
| `BusinessCard.ownerUserId`                                                                | internal DTO       | exposed on owner/preview DTOs only.                                          |
| `getPublicBusinessCardFn` public projection                                               | DTO                | `ownerUserId` forced to `null` — never leaked.                               |
| `src/__tests__/business-card-ownership.bc21a.test.ts`                                     | tests              | 5 cases, green.                                                              |

## Migration

Additive column + indexes only. GRANTs on `member_business_cards` already cover
the new column (table-level privileges inherit). **No RLS policy changes** —
legacy policies remain authoritative; no policy references `owner_user_id`.

Rollback (documented, run manually if reverting):

```sql
DROP INDEX IF EXISTS public.mbc_pub_slug_status_idx;
DROP INDEX IF EXISTS public.mbc_owner_assoc_idx;
DROP INDEX IF EXISTS public.mbc_owner_status_idx;
DROP INDEX IF EXISTS public.mbc_owner_idx;
ALTER TABLE public.member_business_cards DROP COLUMN IF EXISTS owner_user_id;
```

## Resolver priority (BC-2.1A)

1. explicit `owner_user_id` → `ownershipMode: "global_user"`
2. unique linked `members.user_id` → `"legacy_member"`
3. null / ambiguous / missing → `"unresolved"`

`owner_user_id` is unset for every legacy card, so behavior is **identical**
to before until BC-2.1B populates it.

## Compatibility guarantees

- `member_id` and `association_id` retained and untouched.
- Public URLs, slug, SEO, QR, Wallet, NFC — unchanged.
- Builder UX, routes, permissions — unchanged (legacy flow).
- Marketplace / Networking / Membership Identity — untouched.
- No RLS behavior change; global ownership **not active**.

## Verification

- Typecheck clean (`tsgo --noEmit`).
- Ownership tests (5) + identity-bridge tests (14) green.

## Deferred to BC-2.1B

- Deterministic backfill of `owner_user_id` (Category A only) + migration-run tracker.
- Owner-priority RLS policies alongside legacy (dual-write/read cutover).
- Create-card owner population.
- Removal of legacy compatibility paths (BC-11).

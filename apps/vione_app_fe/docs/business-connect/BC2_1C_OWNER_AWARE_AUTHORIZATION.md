# BC-2.1C — Owner-Aware Authorization & Create Flow

**Status:** Complete · **Date:** 2026-07-13 · **Type:** Additive, backward-compatible

## Objective

Activate `owner_user_id` as a valid authorization path for Business Card
operations while preserving all legacy member-based behavior, and ensure every
newly created Business Card receives `owner_user_id` from `auth.uid()`
server-side. No Business Connect UI for non-members yet — the domain is made
ownership-ready only.

## Ownership priority (FROZEN)

```
owner_user_id  →  unique legacy member  →  unresolved (deny)
```

Never guessed. Ambiguous/unlinked member → `unresolved` → denied. An
association admin is never treated as an owner (moderation ≠ ownership).

## What changed

### Database (migration)

- `member_id` / `association_id` made **nullable** on `member_business_cards`
  and child tables (`business_card_skills/services/needs`) to support global
  member-less cards. No column removed; no NOT NULL added to `owner_user_id`.
- `owns_business_card(_card_id)` now authorizes via
  `member_id = current_member_id()` **OR** `owner_user_id = auth.uid()`.
- `enforce_business_card_owner_immutable()` trigger blocks `owner_user_id`
  reassignment for everyone except platform admins.
- Owner-aware RLS added to `member_business_cards` (SELECT/INSERT/UPDATE/DELETE)
  and `business_card_leads` (via `owns_business_card(card_id)`). Legacy
  member policies retained; global INSERT requires
  `owner_user_id = auth.uid()` with null member/association.

### Server (`src/lib/business-card-authz.ts`)

- `requireBusinessCardOwner(supabase, userId, cardId)` — canonical throwing gate.
  Delegates to the identity-bridge resolver; authorizes `global_user` or
  `legacy_member`, denies `unresolved`.
- `canManageBusinessCard(...)` — non-throwing variant returning authz or `null`.
- `BC_AUTHZ_ERR` coded errors (`FORBIDDEN`, `UNRESOLVED`, `NOT_FOUND`).

### Server (`src/lib/business-card.functions.ts`)

- Added `scope: "association" | "global"` to card input. Client **never**
  supplies `owner_user_id`.
- `assertCardOwnerUnlocked(...)` is now the single mutation gate for
  save/status/primary/delete (replaces the removed member-only `assertCardAccess`).
- Create: sets `owner_user_id = auth.uid()`; global scope inserts a member-less
  card, association scope keeps the legacy member/association path.
- Update/delete queries scope by `id` only, relying on the ownership assertion
  plus owner-aware RLS (defense in depth).
- Public projection (`getPublicBusinessCardFn`) still nullifies `ownerUserId` —
  ownership never exposed; URLs and QR/NFC/Wallet/Membership Identity unchanged.

## Verification

- `tsgo --noEmit` clean.
- `business-card-ownership.bc21c.test.ts` (11) — authorization priority.
- Regression: bc21a (5), bc21b (18), identity-bridge (14), scoping unit (10) green.

## Non-goals (explicitly not done)

- No Business Connect UI for non-members, no Community / Global Networking.
- No public projection or URL change; no Builder UI redesign.
- No removal of `member_id`/`association_id` or legacy member policies.
- No `current_member_id()` compatibility removal.

# BC-2.2 — Global Business Card Builder Enablement

Architecture Version: Business Connect v1 — FROZEN
Status: Shipped

## Objective

Enable an authenticated **Platform User without an Association Member row** to
create, edit, preview, publish and manage a Digital Business Card through the
shared `BusinessCardService`. All existing Association Member Business Card
behavior is preserved. No Networking, Community, Marketplace globalization or
Saved Cards.

## What shipped

### Domain (shared service — single implementation)

- `business-card.service.ts`
  - `createGlobalDraft(supabase, userId)` — creates an owner-scoped draft
    (`owner_user_id = auth.uid()`, `member_id`/`association_id` = null),
    server-generated unique slug, public fields prefilled from the user's
    global `user_profiles` row. Never auto-publishes; never creates a member.
  - `listMyGlobalCards(supabase, userId)` / `getMyGlobalCard(...)` — owner-scoped
    reads (work on drafts).
  - Owner-scoped **single primary** enforcement: `setPrimary` and `saveCard`
    demote via the new owner path for `global_user` ownership.
- `business-card.repository.ts` — `listSummariesByOwner`, `findFullByIdForOwner`,
  `demotePrimaryByOwner`. Repository remains the ONLY module that queries
  `member_business_cards`.
- `publish-validation.ts` — pure, client-safe publish contract
  (`validateCardForPublish`). Requires display name, title-or-headline, valid
  slug, ≥1 visible CTA, valid visibility, valid URLs, active account, unlocked
  card. **No membership concern** (member code, association, level, identity
  pass) is required for a global card.

### Server functions (thin adapters)

- `global-builder.functions.ts` — `getGlobalBuilderEligibilityFn`,
  `listMyGlobalCardsFn`, `getMyGlobalCardFn`, `createGlobalCardDraftFn`.
- Create/update/publish/hide/archive/setPrimary/delete reuse the existing
  BusinessCard server functions with `scope: "global"`. `owner_user_id` is
  always derived from `auth.uid()` server-side; the client never supplies it.

### SDK

- `BusinessCardSDK` gains `globalEligibility`, `listGlobal`, `getGlobal`,
  `createGlobalDraft`, plus `archive`, `unpublish`, `setPrimary`.

### UI (mobile-first)

- `/connect` — layout with client-side auth gate.
- `/connect/cards` — card list + create (eligibility-gated).
- `/connect/cards/$cardId/edit` — builder with live preview and publish gating.
- `GlobalCardBuilder`, `GlobalCardPreview` components; all copy via i18n
  (`connect.*` keys, vi + en).

## Invariants preserved

- Existing Member Builder unchanged.
- Shared `BusinessCardService` is the only domain implementation.
- Public URL (`/b/$slug`) and public projection unchanged; `ownerUserId` never
  exposed publicly.
- Owner-aware authorization (BC-2.1C) governs all mutations; locked statuses
  (`suspended`, `rejected`) block edits.

## Verification

- Typecheck clean.
- `business-card-global-builder.bc22.test.ts` — 12 pure publish-validation cases.
- BC-2.1A / BC-2.1C ownership + scoping regression green (26 cases).
- i18n check green (vi + en for all `connect.*` keys).

## Out of scope (per phase)

Networking, Community, Marketplace globalization, Saved Cards.

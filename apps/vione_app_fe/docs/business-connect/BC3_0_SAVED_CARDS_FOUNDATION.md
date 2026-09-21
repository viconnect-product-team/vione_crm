# BC-3.0 — Saved Business Cards Foundation

**Architecture:** Business Connect v1 — Frozen. **Status:** GO.
**Scope:** domain schema, RLS, repository, service, SDK, server façade, search &
availability contracts, deterministic tests, docs. **No UI in this slice.**

## Design principle — references only

A Saved Card is a **relationship edge** from the owner (`auth.uid()`) to a
target Business Card, enriched with owner-private metadata. Profile data is
**never** duplicated or snapshotted; the target summary is resolved live via
`target_card_id` under the card's own RLS. A target that becomes private/removed
reports as `unavailable` — it never leaks.

## Additive alignment (reconciliation decision)

BC-3.0 was implemented as an **additive alignment** onto the already-live
`saved_business_cards` / `saved_card_collections` tables (chosen over a
destructive rename or a parallel schema). Nothing existing was renamed or
dropped; the earlier BC-2.4/2.5 layer keeps working unchanged.

### Canonical reference column

`saved_business_cards.target_card_id` is the canonical link to
`member_business_cards.id` (spec's `card_id`). Kept for back-compat.

## Schema delta (this migration)

**`saved_business_cards`** (additive columns)

- `source_metadata jsonb NOT NULL DEFAULT '{}'`
- `open_count bigint NOT NULL DEFAULT 0`
- `CHECK` constraint `saved_business_cards_source_contract` on `source`

**`saved_card_collections`** (additive columns)

- `normalized_name text NOT NULL` (backfilled `lower(trim(name))`)
- `system_key text` (backfilled from `slug` for system rows)
- `sort_order int NOT NULL DEFAULT 0`, `description text`, `archived_at timestamptz`
- Partial unique index `(owner_user_id, normalized_name) WHERE archived_at IS NULL`

**`saved_card_tags`** (new) — user-private tag catalog, unique per
`(owner_user_id, normalized_name)`.

**`saved_business_card_tags`** (new) — card↔tag junction, PK
`(saved_card_id, tag_id)`.

## Integrity guards

- Trigger `sc_guard_collection_owner` — a saved card cannot reference another
  user's collection (`SC_COLLECTION_OWNER_MISMATCH`).
- Junction RLS requires **both** sides owned by `auth.uid()`.

## Indexes

`(owner_user_id, open_count DESC)`, `(owner_user_id, last_opened DESC)`,
`(owner_user_id, saved_at DESC)`, `(target_card_id)`, tag catalog +
junction tag index.

## Layers

| Layer           | Module                                                                               |
| --------------- | ------------------------------------------------------------------------------------ |
| Contracts       | `saved-card.contracts.ts` (source, availability, tags, errors)                       |
| Tag repository  | `saved-card-tag.repository.ts`                                                       |
| Card repository | `saved-card.repository.ts`, `relationship.repository.ts`, `collection.repository.ts` |
| Service         | `saved-card.service.ts`, `saved-card-tag.service.ts`                                 |
| Server façade   | `saved-card.functions.ts` (`requireSupabaseAuth`)                                    |
| SDK             | `saved-card.sdk.ts` (`SavedCardSDK`) — the only UI entrypoint                        |

## Source contract

Canonical: `public_card`, `share_link`, `qr`, `nfc`, `wallet`, `association`,
`business_connect`, `manual_url`, `internal`, `unknown`. Legacy `profile`, `url`,
`import` remain valid at storage. `normalizeSavedCardSource()` coerces unknown
input to `unknown`.

## Search contract

`SavedCardSearchQuery` filters: free `text` (name/company/title/industry/tags),
`collectionId`, `tag`, `industry`, `location`, `association`, `favorite`,
`archived` (defaults to non-archived). Owner-scoped, in-memory over the owner's
edges.

## Error contract

`SC_COLLECTION_NOT_FOUND`, `SC_SYSTEM_LOCKED`, `SC_DUPLICATE_NAME`,
`SC_TAG_INVALID_NAME`, `SC_TAG_DUPLICATE`, `SC_TAG_NOT_FOUND`,
`SC_COLLECTION_OWNER_MISMATCH`, plus relationship `REL_*`.

## RLS / privacy

All saved-card, collection, tag, and junction rows are owner-scoped
(`owner_user_id = auth.uid()`, junction via ownership EXISTS). Grants:
`authenticated` (CRUD), `service_role` (ALL). No `anon` access.

## Tests

`src/__tests__/business-card-saved-foundation.bc30.test.ts` — source,
availability, and tag-normalization contracts (deterministic, no DB).

**STOP after BC-3.0 foundation. Do not begin BC-3.1.**

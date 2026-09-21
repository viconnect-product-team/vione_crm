# BC-2.5 — Relationship Intelligence Engine

Architecture Version: Business Connect v1 (Frozen)
Status: Shipped (additive, intelligence-only)

## Objective

Transform Saved Business Cards (BC-2.4) into an intelligent, owner-private
relationship graph. This phase adds **metadata and intelligence only**. It does
NOT add messaging, community, marketplace, CRM pipelines, social feeds, or AI.
Profile data is never duplicated — the live target summary is still resolved via
`target_card_id` under the card's own RLS.

## Relationship Graph

The owner→card edge (`saved_business_cards`) is enriched with:

- **Timeline fields** (stored): `saved_at` (first saved), `last_viewed_at`,
  `last_contact_at`, `last_scan_at`, plus derived `relationshipAgeDays`.
- **Private intelligence metadata** (owner-only): `company`, `industry`,
  `interest`, `meeting_place`, `event`, `referral`, `importance` (0–5),
  `labels`, `color`, `priority`, `birthday`, `anniversary`.
- **History** (`relationship_events`): append-only event log with owner-only
  RLS and a validated `event_type` set.

### Event types

`saved`, `viewed`, `shared`, `contact`, `scan`, `meeting`, `wallet`, `qr`,
`nfc`, `tag_updated`, `favorite`, `note_edited`, `metadata_updated`.

Recording `viewed`/`contact`/`scan`/`qr`/`nfc` also touches the matching
timeline timestamp on the edge.

## Metadata Model

All intelligence metadata is **private to the owner** (`owner_user_id =
auth.uid()`), enforced by RLS on both `saved_business_cards` and
`relationship_events`. Cross-user reads are impossible; the target card summary
remains subject to the card's own visibility.

## Relationship Score (deterministic, no AI)

`computeRelationshipScore` produces a bounded 0–100 integer with an explainable
breakdown and a tier (`dormant` < `new` < `active` < `strong`). Weighting is
simple and additive with per-signal caps:

| Signal       | Weight | Cap        |
| ------------ | ------ | ---------- |
| saved edge   | 8      | —          |
| favorite     | 12     | —          |
| private note | 6      | —          |
| view         | 3      | 5          |
| share        | 6      | 4          |
| meeting      | 15     | 3          |
| qr           | 4      | 4          |
| nfc          | 4      | 4          |
| wallet       | 5      | 3          |
| tag          | 2      | 5          |
| importance   | 4      | 5 (points) |

The function is pure and deterministic — identical inputs always yield identical
output. No machine learning.

## Smart Collections

`buildSmartCollections` derives dynamic groupings on read (never persisted):
`recent` (30-day window), `favorites`, `industry:*`, `tag:*`. `nearby` and
`aiSuggested` are architecture placeholders — always present but empty — to keep
future phases additive.

## SDK Surface

`BusinessCardSDK.relationships` adds:

- `recordEvent(targetCardId, type, metadata?)`
- `timeline(targetCardId)`
- `history(targetCardId?)`
- `collections()`
- `relationshipScore(targetCardId)`

All are owner-scoped via `requireSupabaseAuth`; RLS enforces the same.

## Future Intelligence (prepared, not implemented)

The graph is designed so networking, meetings, CRM, AI suggestions, affiliate,
community, and marketplace can build **on** these primitives without rewriting
`RelationshipService`. None are implemented in BC-2.5.

## Tests

`src/__tests__/business-card-relationship-intelligence.bc25.test.ts` — 12 pure
cases (age, deterministic score, caps, tiers, collections, event mapping).
`src/__tests__/business-card-relationship.bc24.test.ts` — 9 foundation cases
(regression). All green; typecheck clean.

## Acceptance

Relationship Graph is intelligent. No messaging. No CRM. No community. No
marketplace. Additive-only. STOP.

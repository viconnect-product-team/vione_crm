# BC-2.6 — Business Interaction Platform

Architecture Version: Business Connect v1 (Frozen)
Status: Shipped (additive, interaction layer only)

## Objective

Create the **Interaction Layer** that sits between the Relationship Graph
(BC-2.4/2.5) and Networking. Interactions are **immutable business events** on a
relationship edge. This phase adds interaction history and its contribution to
relationship intelligence — nothing else.

NO chat. NO messaging. NO CRM pipelines. NO community. NO marketplace. No
rewrite of `RelationshipService`. No duplication of relationship or profile data.

## Interaction Model

`business_interactions` (owner-private, RLS `auth.uid() = owner_user_id`):

| Field                         | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `id`                          | Interaction id                                       |
| `owner_user_id`               | Owner (auth.uid())                                   |
| `relationship_id`             | FK → `saved_business_cards.id` (the owner→card edge) |
| `interaction_type`            | One of the closed type set (below)                   |
| `occurred_at`                 | When the event happened                              |
| `title` / `note` / `location` | Event facts                                          |
| `metadata`                    | JSON extras (RPC-safe)                               |
| `created_at` / `updated_at`   | Timestamps                                           |

A validation trigger enforces the type set; the shared `update_updated_at_column`
trigger keeps `updated_at` fresh. Owner-only access is enforced by RLS **and** by
explicit `owner_user_id` filters in the repository (defense in depth). Because
the relationship edge is resolved through `RelationshipRepository` (owner-scoped),
interactions cannot be created against another user's or tenant's relationship.

## Interaction Types

`meeting`, `call`, `email`, `qr_scan`, `nfc_tap`, `wallet_save`,
`website_visit`, `referral`, `business_lunch`, `conference`, `event`, `demo`,
`proposal`, `contract`, `follow_up`, `other`.

## Interaction Service

`BusinessInteractionService`:

- `create(input)`
- `update(id, patch)`
- `delete(id)`
- `list(relationshipId?)` — one relationship or the whole graph
- `timeline(relationshipId)` — newest first + per-type counts
- `count(relationshipId)` — feeds the relationship score

## Timeline

The Relationship Timeline becomes **Interaction-aware**: `timeline()` returns the
ordered interactions (newest first) with `total` and `countsByType`. Derived on
read, never persisted (mirrors BC-2.5 smart collections).

## Relationship Intelligence

The deterministic score now uses **interaction count** as an additional signal
(`interactionCount`, weight 6, capped at 6 → max +36). The signal is optional and
backward-compatible: omitting it reproduces the BC-2.5 score exactly.
`RelationshipService.relationshipScore` fetches the owner-scoped interaction count
and passes it through — no rewrite of `RelationshipService` behavior beyond this
additive signal.

## SDK Surface

`BusinessCardSDK.interactions`:

- `create(input)`
- `update(id, patch)`
- `delete(id)`
- `list(relationshipId?)`
- `timeline(relationshipId)`

All are owner-scoped via `requireSupabaseAuth`; RLS enforces the same.

## Future Compatibility

The interaction primitive is designed so Meetings, Networking, CRM, AI,
Affiliate, and Analytics can build **on** it without rewriting the service. None
are implemented in BC-2.6.

## Tests

`src/__tests__/business-card-interaction.bc26.test.ts` — pure cases: row mapping,
type fallback, deterministic timeline (sort + counts), and interaction scoring
(raise, cap, backward compatibility). Typecheck clean.

## Acceptance

Relationship becomes Interaction-aware. No messaging. No CRM. No community. No
marketplace. Additive-only. STOP.

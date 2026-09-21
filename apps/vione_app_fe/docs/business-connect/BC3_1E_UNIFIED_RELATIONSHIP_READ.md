# BC-3.1E — Unified Relationship Read Experience

**Architecture Version:** Business Connect v1 — FROZEN
**Status:** Implemented (read-only, additive)

## Objective

Provide a single canonical, viewer-scoped read shape — `UnifiedRelationshipView`
— that composes the isolated relationship domains into one projection so every
consumer (public profile `/b/$slug`, network management, saved-card drawer)
reads identical data without re-implementing composition or the state machine.

## Composed domains

| Domain                      | Source                                           | Visibility         |
| --------------------------- | ------------------------------------------------ | ------------------ |
| Global connection state     | `resolveRelationshipState` (BC-3.1A/B)           | authenticated      |
| Saved-card private metadata | `RelationshipService.list` (BC-2.x)              | owner-of-edge only |
| Interaction summary         | `BusinessInteractionService.timeline` (BC-2.6)   | owner-of-edge only |
| Deterministic score         | `RelationshipService.relationshipScore` (BC-2.6) | owner-of-edge only |
| Public counterpart identity | published + public `member_business_cards`       | privacy-safe       |

## Layers

```text
UI / hooks
  └─ UnifiedRelationshipSDK.getBySlug(slug)          (client façade)
       └─ getUnifiedRelationshipBySlugFn             (auth server fn, RPC boundary)
            └─ getUnifiedRelationshipBySlug          (server-only orchestration)
                 ├─ resolveProfileTarget             (owner via Identity Bridge)
                 ├─ resolveRelationshipState         (authoritative state machine)
                 ├─ RelationshipService / Interaction / score
                 └─ composeUnifiedRelationship       (PURE fold — unit tested)
```

## Files

- `src/lib/global-network/unified-relationship.types.ts` — client-safe DTOs.
- `src/lib/global-network/unified-relationship.compose.ts` — pure IO-free fold.
- `src/lib/global-network/unified-relationship.server.ts` — server orchestration.
- `src/lib/unified-relationship.functions.ts` — authenticated server fn adapter.
- `src/lib/global-network/unified-relationship.sdk.ts` — client SDK façade.
- `src/__tests__/unified-relationship.bc31e.test.ts` — pure composition tests.

## Privacy & security guarantees

- Owner is resolved server-side from the slug; client-supplied ids are never trusted.
- `privateMetadata`, `interactions`, and `score` are present **only** for the
  viewer that owns the saved edge — never leaked to third parties.
- No `owner_user_id`, pair fields, blocker identity, mutation keys, or raw rows
  cross the boundary.
- `effectiveState` flows from the authoritative state machine; the composer
  never duplicates transition logic (saved-card is the only local fallback).
- Anonymous/self viewers short-circuit to fixed states with public data only.

## Testing

`unified-relationship.bc31e.test.ts` exercises the pure composer: anonymous/self
short-circuits, unavailable fallback, owner-only enrichment, enrichment omission
without a saved edge, and coarse score-tier derivation. All green.

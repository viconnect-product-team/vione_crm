# BC-Mobile-6A — Closure Report

Date: 2026-08. Status: COMPLETE.

## Delivered

- **Engine** (`relationship-intelligence.engine.ts`): pure deterministic
  signal/selection/ranking module — thresholds (≥45d reconnect, <7d suppress),
  dismissal expiry, missing-evidence silence, stable ordering.
- **Service** (`relationship-intelligence.service.ts`): DI composition across
  connections / saved cards / guests / moments with viewer-scoped ports.
- **Server** (`relationship-intelligence.server.ts` + `.functions.ts`):
  `bcRelationshipTodayRecommendationsFn`, `bcRelationshipPersonRecommendationFn`,
  `bcRelationshipDismissFn` — actor always from `requireSupabaseAuth`.
- **AI wording** (`relationship-intelligence.ai.server.ts`): strict JSON
  schema, grounding validation, 5s timeout, never throws, deterministic
  fallback.
- **UI**: `RelationshipSuggestions` (Home "V · Gợi ý hôm nay", ≤3 rows) and
  `PersonSuggestion` (Person Detail "V · Gợi ý", fail-closed); wired into
  `ExecutiveHome` + `PersonDetail`; dismiss snooze 7d; quiet error/empty
  states; VI+EN.
- **Migration**: `relationship_recommendation_dismissals` (RLS, grants,
  owner-scoped policies, upsert unique key).
- **Invalidation**: moment save + 5E accept/decline + dismiss refresh
  rel-intel queries.
- **Docs**: audit, architecture, threat model (this folder).

## Verification

- 47/47 tests pass across 4 suites: engine contract (thresholds, ranking,
  edge cases), privacy (DTO forbidden keys, cross-viewer, fail-closed,
  AI-input shape), AI security (schema, grounding, injection, never-throws),
  UI (cap 3, templates, dismiss, retry, quiet-fail, VI/EN, axe-clean).
- i18n keys registered vi+en (prebuild check passes).

## Deferred (documented in architecture §7)

Milestone-decay types beyond reconnect, dismissal management UI, push.

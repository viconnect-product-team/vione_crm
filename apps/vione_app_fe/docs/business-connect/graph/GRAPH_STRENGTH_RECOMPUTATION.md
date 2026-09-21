# GRAPH_STRENGTH_RECOMPUTATION.md — Recompute & Invalidation

Because v1 is **compute-on-read**, recomputation is implicit: every
`relationshipStrength(pair)` call re-derives the score from the current
signal set.

## API

- `computeRelationshipStrength(pair)` — synonym for `relationshipStrength`;
  always current.
- `recomputeRelationshipStrength(pair)` — same behavior in v1 (no cache).
- `invalidateRelationshipStrength(pair)` — no-op in v1; reserved for the
  snapshot escalation path.

## Concurrency

- Pure function on immutable observations → concurrency-safe by construction.
- No write side effects during scoring.

## Event coupling

- BC-4.2 outbox events are the future trigger for background snapshot
  recomputation. In v1, callers simply re-request; outbox events do not
  drive any strength work yet.

## Version handling

- Every result carries `scoringVersion`. Callers that request a specific
  version other than the current one receive `STRENGTH_VERSION_UNSUPPORTED`.
- Version bumps are additive; older versions are never silently rewritten.

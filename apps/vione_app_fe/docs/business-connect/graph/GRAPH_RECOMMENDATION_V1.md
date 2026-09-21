# GRAPH_RECOMMENDATION_V1 — BC-4.4

Version: `1.0.0` · Registry version: `1`

## Guarantees

- **Viewer-relative.** All candidates are RLS-filtered against the caller;
  hidden nodes collapse silently.
- **Deterministic.** Same viewer + same repository state → same page. No
  randomness, no wall clock in ordering.
- **Compute-on-read.** No score cache. Candidate pool bounded per query.
- **Explainable.** Every recommendation carries reason codes + counts +
  bounded example nodes drawn from the visible graph.
- **Registry-locked.** Weights, caps, and diversity limits change only via
  a new `RELATIONSHIP_RECOMMENDATION_VERSION`.

## Non-goals (v1)

- No cross-tenant discovery beyond what RLS already permits.
- No ML model / embeddings — deterministic hand-tuned scoring only.
- No implicit ingestion of unrelated behavioral logs.
- No hidden signals: every contribution is enumerable in the DTO.

# BC-6.0 — Smart Introduction Test Matrix

Pure-engine tests: `src/__tests__/smart-introduction.bc60.test.ts`.

Covered:

- Scoring: deterministic, bounded [0,1], weakest-link, path-length penalty,
  shared-context bonus, recency bonus, stale-hop penalty.
- Confidence: low/medium/high thresholds + 3-hop bar adjustment.
- Reasons: at least one per path, stable codes, `STRONG_*` inferred on
  strong hops, fallback yields `SHORTEST_TRUSTED_PATH`.
- Path identity: deterministic, version-bound, distinct chains → distinct
  ids.
- Ranking & diversity: score-desc / depth-asc / pathId-asc order; per-
  intermediary cap enforced; fully deterministic re-run.
- Privacy invariant: engine output chain is a subset of input chain;
  `applyDiversity` never invents paths.

Service-layer (`introduction.service.server.ts`) integration and
privacy/block/hidden-topology assertions are deferred to a Supabase-backed
harness (planned in BC-6.1) and are structurally guaranteed today by:

- RLS-filtered repository primitives (`neighborIds`, `batchNeighborIds`).
- Explicit blocked-set filter (`ConnectionService.listBlockedPersonNodeIds`).
- Fail-closed target validation collapsing hidden/absent/blocked cases into
  indistinguishable errors.

Regressions kept green: BC-4.4, BC-4.5, BC-5.0, BC-5.1, BC-5.2, graph
read/write, Business Connect UI. Typecheck + lint + i18n gates unchanged.

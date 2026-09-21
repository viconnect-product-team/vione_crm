# GRAPH_STRENGTH_TEST_MATRIX.md — BC-4.3 Test Coverage

Source: `src/__tests__/graph-strength.bc43.test.ts` (20 tests, all green).

## Matrix

| Area           | Assertion                                        | Result |
| -------------- | ------------------------------------------------ | ------ |
| Registry       | baseWeight ∈ [0,1] and perSignalCap ≤ baseWeight | ✅     |
| Registry       | Unknown signals ignored (score = 0)              | ✅     |
| Determinism    | Same input → identical score & contributions     | ✅     |
| Determinism    | Observation ordering irrelevant                  | ✅     |
| Determinism    | Duplicate observations merged, no double-count   | ✅     |
| Canonical      | Symmetric pair ordered lexicographically         | ✅     |
| Frequency      | First interaction contributes                    | ✅     |
| Frequency      | Diminishing returns; per-signal cap enforced     | ✅     |
| Frequency      | Single-model signal ignores count > 1            | ✅     |
| Recency        | Recent > old under exponential decay             | ✅     |
| Recency        | `none` decay is time-invariant                   | ✅     |
| Recency        | minResidual floor honored for ancient signals    | ✅     |
| Bounds         | Saturating every signal still clamps to [0,1]    | ✅     |
| Category       | Commercial cap not exceeded                      | ✅     |
| Tier           | Bands ordered & cover [0,1]                      | ✅     |
| Tier           | Empty relationship → very_weak / cold            | ✅     |
| Tier           | Realistic scenario → normal or strong            | ✅     |
| Directionality | Directional signal folded correctly              | ✅     |
| Explainability | Keys prefixed `strength.signal.`                 | ✅     |
| Privacy        | No raw persistence fields in output              | ✅     |

## Regression

- `graph-registry.bc41.test.ts` — 9/9 ✅
- `graph-verification.bc41v.test.ts` — 11/11 ✅
- `graph-writes.bc42.test.ts` — 15/15 ✅
- Typecheck (`tsgo --noEmit`) — clean ✅

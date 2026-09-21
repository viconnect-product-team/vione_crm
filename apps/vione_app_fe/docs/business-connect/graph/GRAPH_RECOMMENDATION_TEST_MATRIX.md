# GRAPH_RECOMMENDATION_TEST_MATRIX — BC-4.4

Suite: `src/__tests__/graph-recommendation.bc44.test.ts` (17 tests).

| Area               | Coverage                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Registry integrity | version constants, unique source kinds, weight bounds, unknown lookup                            |
| Determinism        | identical output for identical input; stable tie-break by id ASC                                 |
| Frequency model    | diminishing returns; hard cap above `frequencyCap`                                               |
| Category caps      | mutual + strong-mutual capped at `RECO_CATEGORY_CAPS.mutual`; extreme all-source stack still ≤ 1 |
| Unknown sources    | silently dropped, do not corrupt score                                                           |
| Diversity rerank   | ≤ 2 consecutive same-category; no-op when already diverse                                        |
| Cursor safety      | round-trip; mismatched source rejected; garbage rejected; kinds normalized                       |

Regression suites re-run green in the same batch:

- `graph-registry.bc41.test.ts` (9)
- `graph-writes.bc42.test.ts` (15)
- `graph-strength.bc43.test.ts` (20)
- `graph-verification.bc41v.test.ts` (11)

Total: **72 / 72 passing**.

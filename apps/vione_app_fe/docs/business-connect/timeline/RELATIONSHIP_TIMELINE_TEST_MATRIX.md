# RELATIONSHIP_TIMELINE_TEST_MATRIX

Primary suite: `src/__tests__/timeline.bc75.test.ts`.

| #   | Guarantee                                                           | Test                                                                                                              |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | `graph_timeline_events` remains the only timeline persistence layer | Static assertion: no `relationship_timeline_events` module or migration exists                                    |
| 2   | No parallel table/module is introduced                              | Directory scan under `src/lib/graph/relationship-timeline/` — only adapter files                                  |
| 3   | Pair identity is unordered and deterministic                        | `canonicalPairKey(a,b) === canonicalPairKey(b,a)`; stable across calls                                            |
| 4   | Pair identity is non-authority-bearing                              | Nil / empty ids resolve to `null`                                                                                 |
| 5   | DTO projection maps registry summary keys unchanged                 | Round-trip fixture                                                                                                |
| 6   | Metadata allowlist is preserved verbatim                            | Fixture with allowed + disallowed keys asserts we do not re-widen                                                 |
| 7   | Category derivation covers BC-4.1 kinds                             | Table-driven test over `CONNECTED_TO`, `MET`, `SAVED_CARD`, `WORKS_FOR`, `MEMBER_OF`, `ATTENDED`, extension slots |
| 8   | Ordering `occurred_at DESC, id DESC` reused                         | Adapter delegates untouched; asserted by inspecting adapter code                                                  |
| 9   | Cursor is opaque and re-passed unchanged                            | `listTimeline({cursor:X})` forwards `X` to graph SDK                                                              |
| 10  | Limit clamping `[1,100]`, default `30`                              | Numeric edge cases                                                                                                |
| 11  | SDK surface freeze                                                  | Snapshot of `Object.keys(RelationshipTimelineSDK)`                                                                |
| 12  | No authority-bearing inputs in the SDK signature                    | Type-level assertion (no `viewerId`, `userId`, `authToken` fields)                                                |
| 13  | UI groups reduce correctly by age                                   | Pure `groupEvents()` covered indirectly by adapter shape                                                          |

Regression suites (must remain green):

- `src/__tests__/graph-writes.bc42.test.ts` — timeline emission on edge
  writes.
- `src/__tests__/graph-registry.bc41.test.ts` — frozen registry.
- Full typecheck + lint.

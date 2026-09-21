# RELATIONSHIP_TIMELINE_UI_TEST_MATRIX

**Slice:** BC-7.5C
**Suite:** `src/__tests__/relationship-timeline-ui.bc75c.test.tsx` (11 tests, green)

| #   | Scenario            | Assertion                                                                                                       |
| --- | ------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Loading             | `aria-busy="true"` on `#bc-timeline-announcement`, loading card visible                                         |
| 2   | Error               | `role="alert"` renders, retry available                                                                         |
| 3   | Empty               | Neutral copy + "recorded" disclaimer, no absolute claim                                                         |
| 4   | Populated lifecycle | Delivery/Outcome/Meeting kinds render with `<ul role="list">`, high-importance accent, canonical CTA, axe-clean |
| 5   | Unknown kind        | `UNKNOWN_PRESENTATION` fallback, no CTA, no crash                                                               |
| 6   | Filter chips        | `aria-pressed` toggles; category filter applied                                                                 |
| 7   | Pagination          | `Load more` triggers `fetchNextPage`                                                                            |
| 8   | Refresh             | Refresh button calls `refetch`                                                                                  |
| 9   | N+1                 | 25 items rendered from a single hook invocation (no per-row fetch)                                              |
| 10  | Date grouping       | Two age-separated events produce two labelled `<section>`s, each with its own `<ul role="list">`                |
| 11  | Pair mode           | Pair hook drives data; empty state hides "Explore connections" CTA                                              |

## Regression coverage kept green

- `src/__tests__/timeline.bc75.test.ts` — SDK surface + visibility contract
- `src/__tests__/timeline-projection.bc75b.test.ts` — outbox → timeline projection

## Live projection verification (BC-7.5B pipeline)

End-to-end sanity from an authenticated shell:

1. Trigger a supported source lifecycle event (introduction delivery ack, meeting complete, outcome connected).
2. Confirm a matching `graph_outbox` row appears.
3. Wait ≤ 1 min for `relationship_timeline_projection_minutely`.
4. Confirm exactly one `graph_timeline_events` row with `dedupe_key = 'outbox:<event_id>'`.
5. Reload the pair route `/business-connect/connections/<counterpart-node-id>`; the event appears in the correct bucket, with the registry-driven icon, importance and CTA.
6. Manually re-invoke `/api/public/hooks/timeline-projection`; no duplicate row is created.

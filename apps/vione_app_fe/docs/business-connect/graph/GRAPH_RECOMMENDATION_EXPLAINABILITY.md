# GRAPH_RECOMMENDATION_EXPLAINABILITY — BC-4.4

Every `RecommendationDTO` includes an ordered list of `RecommendationReasonDTO`:

```
{
  code: RecommendationReasonCode,   // MUTUAL_CONNECTIONS, SHARED_COMPANY, ...
  summaryKey: string,               // i18n key: graph.recommendation.reason.<code>
  count?: number,                   // raw evidence count
  examples?: GraphNodeDTO[],        // up to RECO_MAX_REASON_EXAMPLES (3), visible only
  contribution?: number,            // rounded 0..1 score contribution
  priority: number                  // stable ordering; lower = shown first
}
```

Reasons are sorted by `priority ASC`, matching the frozen `dedupePriority`
column in the source registry. Consumers pattern-match on `code`, look up
copy via `summaryKey`, and render `examples` as their local product allows.

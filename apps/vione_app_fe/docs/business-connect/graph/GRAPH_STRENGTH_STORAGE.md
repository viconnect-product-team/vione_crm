# GRAPH_STRENGTH_STORAGE.md — Storage Strategy (v1)

**Strategy:** Compute-on-read.

## Rationale

- Scoring is pair-local and cheap (< a few ms for typical inputs).
- Repository loads a bounded slice of `graph_edges` and
  `graph_timeline_events` restricted by pair + lookback + RLS.
- Avoids a new denormalized table until observed hot-paths justify it.
- Viewer-relative privacy policy (see GRAPH_STRENGTH_PRIVACY) makes a
  shared materialized snapshot impossible without per-viewer sharding.

## Escalation path (deferred, requires a new scoring version)

If instrumentation shows read pressure, add:

```
graph_relationship_strength (
  source_node_id, target_node_id, scoring_version,
  score, tier, contribution_summary jsonb,
  calculated_at, source_watermark, registry_version,
  created_at, updated_at,
  UNIQUE (source_node_id, target_node_id, scoring_version)
)
```

Written by an outbox consumer reacting to `graph_outbox_events` (BC-4.2).
Not implemented in v1.

## Performance envelope

- Lookback: 730 days.
- Max edges per pair query: bounded by RLS scan + `LIMIT` in repository.
- Max timeline events per pair: bounded similarly.
- No full-graph scans, no cross-pair joins.

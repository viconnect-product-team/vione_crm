# GRAPH_STRENGTH_V1.md — BC-4.3 Relationship Strength Engine v1

**Scoring version:** `1.0.0`
**Registry version:** `1`
**Status:** FROZEN

## Purpose

Convert graph activity into a single, deterministic, explainable, viewer-safe
score for a pair of nodes.

## Guarantees

- Deterministic: same inputs + same scoring version → identical output.
- Bounded: `score ∈ [0, 1]`; tier ∈ {`very_weak`, `weak`, `normal`, `strong`, `champion`}.
- Explainable: every contribution reports raw/effective count, base weight,
  frequency & recency factors, capped contribution, and an i18n
  `explanationKey`.
- Versioned: any change to weights, decay, caps, or tier bands requires a
  new `RELATIONSHIP_STRENGTH_VERSION`.
- Privacy-safe: only signals visible to the viewer are considered; hidden
  signals cannot be inferred through count deltas or timestamps.
- No AI, no ML, no centrality, no recommendation.

## Non-Goals (deferred)

- BC-4.4 Recommendations
- Smart Introductions
- Graph centrality / PageRank
- AI scoring
- Predictive relationship health
- Strength UI surface
- Graph Explorer

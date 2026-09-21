# GRAPH_RECOMMENDATION_SCORING — BC-4.4

## Per-source contribution

```
contribution = baseWeight × freqFactor(count)
freqFactor(n)  = ln(1 + min(n, cap)) / ln(1 + cap)     // capped_log
freqFactor(_)  = 1                                      // single
```

`STRONG_MUTUAL` additionally multiplies by an optional viewer-visible
`strengthWeight ∈ [0,1]` derived from BC-4.3.

## Category caps

Contributions are grouped by `diversityCategory`. If the sum for a category
exceeds `RECO_CATEGORY_CAPS[category]`, all contributions in that category
are scaled proportionally so the sum equals the cap.

## Recency bonus

A single bounded bonus is added, driven by the most-recent evidence
timestamp on any source. Half-life 90 days, cap `RECO_RECENCY_BONUS_CAP`
(0.05). Absence of timestamps → 0 bonus, no penalty.

## Final score

```
score = clamp01( Σ cappedCategorySums + recencyBonus )
```

Sort key: `(score DESC, distinct-source-count DESC, first-source registry
order ASC, candidateId ASC)`.

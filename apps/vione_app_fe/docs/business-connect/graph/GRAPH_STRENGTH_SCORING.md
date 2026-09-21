# GRAPH_STRENGTH_SCORING.md — Deterministic Scoring Pipeline

For each observation `(signalKind, count, lastAt)`:

```
raw            = count
effective      = frequencyFactor(model, raw)          // single | capped_log
recency        = recencyFactor(model, lastAt, now)    // none | exponential
contribution   = baseWeight × effective × recency × sign
capped         = min(contribution, perSignalCap)
```

Then per category `C`:

```
categoryTotal_C = min( Σ capped_i (i∈C) , CATEGORY_CAPS[C] )
score           = clamp( Σ categoryTotal_C , 0, 1 )
tier            = tierFor(score)
```

## Frequency models

- `single`: `effective = min(raw, 1)` — signal counts at most once.
- `capped_log`: `effective = min(1 + ln(raw), signal.freqCap)` — diminishing
  returns; huge counts cannot dominate.

## Category caps (frozen v1)

| Category          | Cap  |
| ----------------- | ---- |
| identity_context  | 0.10 |
| direct_connection | 0.35 |
| interaction       | 0.20 |
| meeting           | 0.25 |
| introduction      | 0.15 |
| shared_context    | 0.15 |
| commercial        | 0.20 |
| continuity        | 0.10 |

Sum of caps > 1 by design; the final clamp to `[0,1]` is the global ceiling.

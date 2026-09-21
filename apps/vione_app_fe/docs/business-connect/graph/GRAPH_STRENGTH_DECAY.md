# GRAPH_STRENGTH_DECAY.md — Recency Decay

## Models (v1)

- `none` — recency factor = 1.0 always. Used for structural/continuous
  signals (CONNECTED_TO, WORKS_FOR, MEMBER_OF).
- `exponential` — `f = max(minResidual, 0.5 ^ (ageDays / halfLifeDays))`.

## Rules

- `now` is passed explicitly into `computeStrength` for determinism.
- Missing `lastAt` → decay treated as 1.0 (structural presence).
- `minResidual` is per-signal; guarantees decayed contributions never vanish
  to zero, keeping historical relationships explainable.
- No linear / step models in v1.

## Lookback

- Repository loads signals with a 730-day lookback window
  (`STRENGTH_LOOKBACK_DAYS`). Signals older than that are excluded from the
  input set entirely — decay does not extend beyond the lookback.

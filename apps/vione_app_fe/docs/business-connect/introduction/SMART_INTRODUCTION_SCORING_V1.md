# BC-6.0 — Smart Introduction Scoring v1

**Frozen contract.** Weights live in `src/lib/graph/introduction/registry.ts`
and change only via a version bump.

## Weights

| Factor                                  | Weight                                |
| --------------------------------------- | ------------------------------------- |
| relationshipTrust (weakest link × 0.55) | 0.55                                  |
| pathLengthPenaltyPerExtraHop            | −0.12 per hop over 2                  |
| sharedContext                           | +0.12 (any)                           |
| recency                                 | +0.08 (any recent hop)                |
| introductionHistory                     | +0.10 (prior success)                 |
| diversityAdjustment                     | +0.05 × min(1, (distinctReasons−1)/4) |
| staleHopPenalty                         | −0.08 per stale hop                   |

Final `score = clamp01(...)`.

## Weakest-link principle

`pathTrust = min(strength(hopᵢ))`. A strong→weak path cannot outrank a
strong→strong path of the same depth.

## Confidence thresholds

- `low` : score < 0.45
- `medium` : 0.45 ≤ score < 0.70
- `high` : score ≥ 0.70

3-hop paths use `score − 0.05` when mapping to confidence, so they are held
to a higher bar for `high`.

## Sort order (deterministic)

1. score DESC
2. depth ASC
3. confidence priority DESC (`high > medium > low`)
4. pathId ASC (lexicographic)

No randomization anywhere.

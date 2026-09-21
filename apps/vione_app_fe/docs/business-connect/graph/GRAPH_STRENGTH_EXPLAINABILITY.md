# GRAPH_STRENGTH_EXPLAINABILITY.md — Explanation Contract

Every `RelationshipStrengthResult` carries:

```ts
contributions: StrengthContributionRecord[]
explanationKeys: string[]   // i18n keys, prefixed "strength.signal.<KIND>"
```

## StrengthContributionRecord (public shape)

| Field              | Meaning                                            |
| ------------------ | -------------------------------------------------- |
| signalKind         | Registered signal kind                             |
| category           | Frozen category                                    |
| rawCount           | Observed count before frequency model              |
| effectiveCount     | Count after frequency model (single or capped_log) |
| baseWeight         | Registry base weight                               |
| frequencyFactor    | Effective frequency factor                         |
| recencyFactor      | Decay-derived factor (∈ [minResidual, 1])          |
| cappedContribution | Contribution after per-signal cap                  |
| explanationKey     | Stable i18n key, `strength.signal.<KIND>`          |

## Rules

- Never expose edge ids, node ids other than the requested pair,
  timeline event ids, raw metadata, message content, notes, or user PII.
- Explanation keys are **stable across scoring versions** unless a signal
  itself is renamed (which forces a new version).
- The `contributions` array is deterministic in order (sorted by
  `cappedContribution` desc, tiebreak by `signalKind`).

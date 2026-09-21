# GRAPH_STRENGTH_MODEL — Relationship Strength Contract

**BC-4.3 update:** the v1 engine implements this contract. See
`GRAPH_STRENGTH_V1.md`, `GRAPH_STRENGTH_SIGNALS.md`,
`GRAPH_STRENGTH_SCORING.md`, `GRAPH_STRENGTH_DECAY.md`,
`GRAPH_STRENGTH_PRIVACY.md`, `GRAPH_STRENGTH_STORAGE.md`,
`GRAPH_STRENGTH_RECOMPUTATION.md`, `GRAPH_STRENGTH_EXPLAINABILITY.md`,
and `GRAPH_STRENGTH_TEST_MATRIX.md`. Scoring version: **1.0.0**.

## Output

```ts
export type StrengthTier = "very_weak" | "weak" | "normal" | "strong" | "champion";

export interface RelationshipStrength {
  tier: StrengthTier;
  score: number; // 0..1, deterministic
  contributions: StrengthContributionBreakdown[];
  computedAt: string;
  version: string; // scoring contract version
}

export interface StrengthContributionBreakdown {
  source: StrengthSignalSource;
  weight: number; // 0..1
  count?: number;
  lastAt?: string;
}
```

## Inputs (signal sources)

```ts
export type StrengthSignalSource =
  | "meeting"
  | "repeat_meeting"
  | "message"
  | "save_card"
  | "shared_company"
  | "shared_association"
  | "shared_community"
  | "introduction"
  | "referral"
  | "purchase"
  | "attendance"
  | "checkin"
  | "custom";
```

## Per-Edge Contribution

Each edge registration declares:

```ts
export type StrengthContribution =
  | { contributes: false }
  | {
      contributes: true;
      source: StrengthSignalSource;
      baseWeight: number; // 0..1
      decayHalfLifeDays?: number; // optional time decay
      cap?: number; // max cumulative contribution
      sign?: 1 | -1; // negative for LEFT, block, etc.
    };
```

## Tier Bands (frozen defaults, tunable by contract version only)

| Tier      | Score range |
| --------- | ----------- |
| very_weak | 0.00 – 0.15 |
| weak      | 0.15 – 0.35 |
| normal    | 0.35 – 0.60 |
| strong    | 0.60 – 0.85 |
| champion  | 0.85 – 1.00 |

## Contract Guarantees

- Deterministic: same inputs → same score at a given `version`.
- No AI is required to satisfy the contract; AI is one additional signal
  bounded by its own `baseWeight`.
- Products never compute strength themselves; they consume
  `relationshipStrength(a, b)`.

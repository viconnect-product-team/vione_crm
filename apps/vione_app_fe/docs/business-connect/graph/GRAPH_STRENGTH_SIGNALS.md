# GRAPH_STRENGTH_SIGNALS.md — Frozen v1 Signal Registry

Only signals listed here contribute. Registered in `src/lib/graph/strength/registry.ts`.

| Signal       | Category          | Direction   | Base | FreqModel/Cap | Decay       | Half-life (d) | Residual |
| ------------ | ----------------- | ----------- | ---- | ------------- | ----------- | ------------- | -------- |
| CONNECTED_TO | direct_connection | symmetric   | 0.35 | single/1      | none        | –             | 1.00     |
| SAVED_CARD   | identity_context  | directional | 0.06 | single/1      | exponential | 180           | 0.25     |
| MET          | meeting           | symmetric   | 0.22 | capped_log/8  | exponential | 120           | 0.15     |
| INTRODUCED   | introduction      | directional | 0.14 | capped_log/4  | exponential | 240           | 0.25     |
| REFERRED     | commercial        | directional | 0.14 | capped_log/4  | exponential | 240           | 0.25     |
| MESSAGED     | interaction       | symmetric   | 0.16 | capped_log/20 | exponential | 60            | 0.10     |
| ATTENDED     | shared_context    | symmetric   | 0.08 | capped_log/6  | exponential | 180           | 0.20     |
| CHECKED_IN   | shared_context    | symmetric   | 0.05 | capped_log/6  | exponential | 180           | 0.20     |
| WORKS_FOR    | shared_context    | symmetric   | 0.08 | single/1      | none        | –             | 1.00     |
| MEMBER_OF    | shared_context    | symmetric   | 0.06 | single/1      | none        | –             | 1.00     |
| PURCHASED    | commercial        | directional | 0.12 | capped_log/5  | exponential | 365           | 0.30     |
| SOLD         | commercial        | directional | 0.12 | capped_log/5  | exponential | 365           | 0.30     |

## Rules

- Signal not in this table → **ignored** (does not contribute).
- Every registered signal has `perSignalCap ≤ baseWeight`.
- All signs are `+1` in v1. Negative contributions are supported by the
  contract but **not enabled** in v1.
- Directional signals credit only source→target for the requested pair.

# BC-9.1 Turn A — Relationship Memory Lifecycle

```
                +-------------+
                |  candidate  |
                +------+------+
                       |
           active <----+----> dismissed / expired
              |
              v
        superseded  ----> dismissed
```

## States

- **candidate.** Just proposed by extraction. NOT visible to intelligence.
- **active.** Owner-acknowledged (implicitly via corroboration threshold or
  explicitly via `accept` feedback). Visible to intelligence subject to
  sensitivity gating.
- **superseded.** Newer memory supersedes this one. Not visible to
  intelligence.
- **dismissed.** Owner rejected. Terminal. Cannot transition.
- **expired.** Time-based sink. Terminal. Cannot transition.

## Transition matrix

| From       | Allowed to                     |
| ---------- | ------------------------------ |
| candidate  | active, dismissed, expired     |
| active     | superseded, dismissed, expired |
| superseded | dismissed                      |
| dismissed  | ∅                              |
| expired    | ∅                              |

`assertTransition` throws `RELATIONSHIP_MEMORY_INVALID_TRANSITION` or
`RELATIONSHIP_MEMORY_TERMINAL_STATUS` on violation.

## Confidence dynamics

- `bumpConfidenceOnCorroboration(c, w)` — Bayesian-ish diminishing bump:
  `c + (1-c) * (w/2)`. Monotonic non-decreasing, bounded by 1.
- `decayConfidenceOnContradiction(c, w)` — `c - c * (w/2)`. Bounded by 0.

Rules are pure and deterministic. Turn B extraction uses the same functions.

## Merge

`mergeMemories(a, b)` requires matching `kind` + `canonical_key`. It picks
the higher-confidence memory as primary, preserves the oldest
`firstObservedAt`, the newest `lastObservedAt`, sums source counts, and
escalates sensitivity to the higher of the two.

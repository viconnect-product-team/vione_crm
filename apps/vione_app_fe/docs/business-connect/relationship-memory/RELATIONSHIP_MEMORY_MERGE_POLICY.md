# BC-9.1 Turn A — Merge & Conflict Policy

All merge/conflict logic lives in `memory-policy.ts` and is pure and
deterministic. No IO, no wall-clock, no random.

## Canonical key

`canonicalKey(kind, rawValue)`:

1. Lowercase and NFKD-normalize (strip diacritics).
2. Replace non-letter/non-digit chars with space.
3. Collapse whitespace and trim.
4. Prefix with `<kind>:`.

Guarantees identical keys for values that differ only in case,
punctuation, or accents.

## Confidence rules

- `clampConfidence(v)` — bound to `[0,1]`, rounded to 3 decimals to match
  the DB `NUMERIC(4,3)` precision.
- `bumpConfidenceOnCorroboration(c, w)` — `c + (1-c) * (w/2)`. Monotonic
  non-decreasing, asymptotically approaches 1, never exceeds it.
- `decayConfidenceOnContradiction(c, w)` — `c - c * (w/2)`. Monotonic
  non-increasing, never below 0.

## Merge

`mergeMemories(a, b)` throws when the two memories differ in `kind` or
`canonicalKey`. Otherwise:

- Primary = higher-confidence memory (ties → `a`).
- `canonicalValue` = shallow merge; primary overrides secondary keys.
- `confidence` = bump primary confidence with secondary as weight source.
- `sourceCount` = sum.
- `firstObservedAt` = earliest of the two.
- `lastObservedAt` = latest of the two.
- `sensitivity` = `maxSensitivity(a, b)` — escalates, never lowers.

## Shallow conflict detection

`detectShallowConflict(a, b)` returns true iff any shared top-level key
holds different JSON values. Used by Turn B to decide when to emit a
`contradicts` link instead of merging.

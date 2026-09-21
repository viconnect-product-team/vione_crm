# BC-9.1 Turn B2b-ii — Merge Runtime

The classifier (`merge-classifier.ts`) is pure and deterministic:

| Existing? | Shared key with different value? | Candidate adds new key? | Outcome                                                     |
| --------- | -------------------------------- | ----------------------- | ----------------------------------------------------------- |
| no        | —                                | —                       | `creates_new`                                               |
| yes       | yes                              | any                     | `conflicts_existing`                                        |
| yes       | no                               | yes                     | `enriches_existing`                                         |
| yes       | no                               | no                      | `duplicate` (also covers "supports" — provenance-only path) |

`supports_existing` in the frozen registry is the runtime alias for the
`duplicate + independent evidence` path: the RPC still increments provenance
and monotonic confidence but performs no material mutation.

## Enrichment allowlist

`enrichment-mergers.ts` exposes `RELATIONSHIP_MEMORY_ENRICHMENT_ALLOWLIST` per
memory kind. Generic recursive JSON merge is rejected; a non-allowlisted key
throws `RELATIONSHIP_MEMORY_INVALID_MERGE`.

Existing keys are NEVER overwritten by enrichment. The classifier routes any
conflicting key to the conflict path instead.

## Confidence

Monotonic. Delta per candidate depends on evidence strength
(`high` 0.15, `medium` 0.08, `low` 0.04) and is applied via
`c + (1 - c) * (delta / 2)` — approaches 1, never exceeds it, never decreases.

## Visibility

Final memory sensitivity = `GREATEST(candidate.visibilityClass,
existing.sensitivity, kind default)`. Automatic downgrade is impossible.
`supports_existing` and `enriches_existing` can only escalate.

## Version bumps

- `duplicate`: no version bump unless confidence changes materially.
- `supports_existing`: no version bump for provenance-only add.
- `enriches_existing`: `row_version` +1; guarded by `expectedVersion`.
- `conflicts_existing`: new candidate memory has `row_version = 1`; existing
  memory is untouched.
- `superseded`: old row +1 + `superseded_by_memory_id`; new row = 1.

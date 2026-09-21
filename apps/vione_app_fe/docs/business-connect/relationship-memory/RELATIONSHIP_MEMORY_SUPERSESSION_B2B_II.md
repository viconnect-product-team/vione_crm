# BC-9.1 Turn B2b-ii — Supersession

Automatic supersession is invoked explicitly by
`supersedeRelationshipMemory()` → RPC
`business_relationship_memory_supersede`. It is **not** triggered from the
merge classifier; the conflict path is the default when incompatible values
are observed.

## Preconditions (all must hold, checked inside the RPC)

- Receipt exists, `status = processing`, `claim_token` matches.
- Old memory belongs to the same owner (derived from receipt).
- Old memory status is not terminal (`superseded`/`dismissed`/`expired`
  block it).
- `expectedVersion` equals `row_version` of the old memory row (optimistic
  concurrency guard; stale worker fails with
  `RELATIONSHIP_MEMORY_VERSION_CONFLICT`).

## Atomic effect

- Insert a new active memory row (`row_version = 1`), carrying the
  candidate's structured value.
- `UPDATE` the old row → `status = superseded`,
  `superseded_by_memory_id = <new>`, `row_version = old + 1`, guarded by
  `WHERE row_version = p_expected_version` so concurrent supersession from
  another worker fails deterministically.
- Insert `supersedes` link (idempotent).

## Guarantees

- Old provenance is preserved (rows are not deleted).
- No last-write-wins: stale `expectedVersion` yields
  `RELATIONSHIP_MEMORY_VERSION_CONFLICT`.
- Failed supersession is safe to fall back to the conflict path — the caller
  simply re-applies the candidate through `applyRelationshipMemoryCandidate`.
- Cross-owner supersession is impossible: the RPC filters the old row by
  `owner_user_id = v_receipt.owner_user_id`.

Later turns will add policy-driven auto-supersession candidacy (authority
thresholds, chronology). B2b-ii ships the atomic primitive.

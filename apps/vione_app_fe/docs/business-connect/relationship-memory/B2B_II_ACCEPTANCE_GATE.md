# BC-9.1 Turn B2b-ii — Acceptance Gate Report

## Decision

**GATE: CLOSED / GO ✅**

All B2b-ii criteria met. Turn B1, B2a and B2b-i remain unmodified.

## Executive summary

Delivered a service-role-only, atomic candidate persistence path with
server-derived merge outcomes, deterministic classifier, allowlisted
enrichment mergers, idempotent provenance, DB-enforced link invariants,
and optimistic-concurrency-guarded supersession. Private notes remain
structurally impossible at the runtime AND DB layers. No provider or
AI dependency was introduced.

## Files changed

- `supabase/migrations/…B2b-ii…sql` — schema + two RPCs.
- `src/lib/business-connect/relationship-memory/apply-candidate.server.ts` — new server entrypoint.
- `src/lib/business-connect/relationship-memory/apply-result-dto.ts` — new safe DTO.
- `src/lib/business-connect/relationship-memory/merge-classifier.ts` — pure classifier.
- `src/lib/business-connect/relationship-memory/enrichment-mergers.ts` — allowlisted per-kind merge.
- `src/lib/business-connect/relationship-memory/errors.ts` — 7 new B2b-ii codes.
- `src/__tests__/relationship-memory-b2b-ii.bc91.test.ts` — 31 assertions.
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_PERSISTENCE_B2B_II.md`
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_MERGE_RUNTIME_B2B_II.md`
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_PROVENANCE_LINKS_B2B_II.md`
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_SUPERSESSION_B2B_II.md`
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_CONCURRENCY_B2B_II.md`
- `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_TEST_MATRIX_B2B_II.md`

## Migrations / RPCs

- `business_relationship_memory_apply_candidate(uuid, text, text, text, jsonb, integer)`
- `business_relationship_memory_supersede(uuid, text, uuid, integer, jsonb)`
- Helper `GREATEST_TEXT_SENSITIVITY(text, text)`
- Both RPCs: `SECURITY DEFINER`, `SET search_path = public, pg_temp`,
  `REVOKE` from `PUBLIC/anon/authenticated`, `GRANT EXECUTE TO service_role`.

## Persistence entrypoint

`applyRelationshipMemoryCandidate(sb, input)` — server-only. Accepts only
receipt id, claim token, extractor id/version, validated candidate,
optional `expectedVersion`. No owner arg. No merge-outcome arg.

## Canonical lookup

Indexed on `(owner, subject_type, subject_ref, memory_kind, canonical_key)`
via `bc_rm_memory_lookup_idx` plus scope-aware partial unique
`bc_rm_memory_active_unique`. No semantic-similarity lookup for identity.

## Merge classification

Deterministic five-way outcome derived by the RPC from candidate structured
value vs existing canonical value. Caller cannot supply the outcome.

## Behavior branches

- `creates_new`: inserts new memory as `candidate`, `row_version = 1`,
  sensitivity ≥ kind default.
- `duplicate`: no new row; monotonic confidence bump; provenance
  idempotent.
- `supports_existing`: implicit via the duplicate path when the source is
  independent — provenance-only append; confidence never decreases; can
  only escalate sensitivity.
- `enriches_existing`: allowlisted per-kind merge; guarded by
  `expectedVersion`; `row_version` +1.
- `conflicts_existing`: creates a separate candidate memory; existing row
  untouched; `contradicts` link created.
- `superseded` (explicit RPC): atomic old→superseded + new→active with
  supersedes link.

## Provenance / Links / Visibility / Sensitivity / Versioning

See dedicated docs. Uniqueness enforced by
`bc_rm_sources_identity_unique` and `bc_rm_link_unique`. Visibility is a
GREATEST over source, subject, existing; never broadens. Sensitivity never
downgrades. All mutating branches guard `row_version`.

## Database constraints (new/confirmed)

- `bc_rm_memory_scope_type`, `bc_rm_memory_row_version_positive`,
  `bc_rm_memory_superseded_not_self`.
- `bc_rm_memory_active_unique` (partial), `bc_rm_memory_lookup_idx`.
- `bc_rm_source_evidence_type`, `bc_rm_sources_identity_unique`.
- `bc_rm_link_kind` expanded.
- Existing: `bc_rm_source_reject_private_notes`, `bc_rm_link_not_self`,
  `bc_rm_link_unique`.

## Events / Audit

Safe events (`relationship_memory_*`) will attach in the worker turn using
the DTO — payload keys already whitelisted via `assertSafeApplyPayload`.

## Error contract

Adds `RELATIONSHIP_MEMORY_VERSION_CONFLICT`, `_INVALID_MERGE`,
`_PROVENANCE_CONFLICT`, `_LINK_CONFLICT`, `_VISIBILITY_ESCALATION`,
`_SENSITIVITY_DOWNGRADE`, `_SUPERSESSION_NOT_ALLOWED`. Unknown DB errors
map to `_INTERNAL_ERROR`.

## Concurrency results

DB-enforced. See `RELATIONSHIP_MEMORY_CONCURRENCY_B2B_II.md`.

## Performance results

- Canonical lookup uses `bc_rm_memory_lookup_idx` (indexed).
- One receipt row lock + at most two memory row locks per transaction.
- Provenance inserts collapse via unique index (no scan).
- Zero external network calls in the RPC.

## Test totals

- `src/__tests__/relationship-memory-b2b-ii.bc91.test.ts` — **31 pass / 0 fail**.
- Full BC-9.1 suite unaffected.

## Typecheck

`bunx tsgo --noEmit` — **clean**.

## Blocking defects

None.

## Non-blocking debt

- Full live-RPC roundtrip suite scheduled with the worker-integration turn.
- Auto-supersession policy (authority thresholds, chronology heuristics)
  scheduled for a later Turn B extension.
- Safe evidence snippets (`snippet_safe` population + hashing) deferred.
- Sensitivity-review workflow surface (UI) not in scope.

## Readiness for B2b-iii

Ready. `applyRelationshipMemoryCandidate` and
`supersedeRelationshipMemory` present a stable service surface for the
receipt-orchestration turn (B2b-iii) to consume without further schema
change.

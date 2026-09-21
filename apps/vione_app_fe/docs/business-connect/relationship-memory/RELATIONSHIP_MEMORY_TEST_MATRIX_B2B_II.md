# BC-9.1 Turn B2b-ii — Test Matrix

Test file: `src/__tests__/relationship-memory-b2b-ii.bc91.test.ts`
(31 assertions, all green; typecheck clean).

## Coverage summary

| Area                                                                                                                                           | Assertions |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| RPC hardening (SECURITY DEFINER, search_path, revokes, grants, receipt-derived owner, token check, unresolved subject, private-note rejection) | 7          |
| Merge classifier (creates_new, duplicate, empty-subset duplicate, enrichment, conflict, frozen outcome set)                                    | 6          |
| Enrichment mergers (allowlist coverage, additive merge, no-overwrite, non-allowlisted rejection, tenant/auth key rejection)                    | 5          |
| Safe result DTO (memoryRef, forbidden-key omission, `assertSafeApplyPayload`, freeze)                                                          | 4          |
| DB constraints (`row_version > 0`, `superseded_not_self`, provenance uniqueness columns, expanded link kinds, active-canonical unique)         | 4          |
| Error contract (all 10 B2b-ii codes registered)                                                                                                | 1          |
| Structural exclusions (SDK freeze, barrel export freeze, no private-note path in service, no owner argument, no provider call in service)      | 5          |

## Why unit + structural coverage instead of live RPC roundtrips

The RPC executes as `service_role` only. All merge outcomes are derived
from pure logic that lives in `merge-classifier.ts` and
`enrichment-mergers.ts` and is fully unit-tested. The RPC itself is a
faithful translation of that logic plus DB-enforced invariants (unique
indexes, CHECK constraints, `FOR UPDATE`/`WHERE row_version = expected`
guards) that are asserted structurally by scanning the migration SQL.
Live RPC roundtrip tests will be added by the worker-integration turn once
`applyRelationshipMemoryCandidate` is wired into the receipt orchestrator.

## Not covered by B2b-ii tests (deferred to worker-integration turn)

- End-to-end receipt claim → apply → complete pipeline.
- Retry orchestration on partial failure.
- Cross-worker race replay against a real DB.

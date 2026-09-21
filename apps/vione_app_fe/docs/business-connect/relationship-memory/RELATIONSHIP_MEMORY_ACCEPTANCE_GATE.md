# BC-9.1 Turn A — Turn A Acceptance Gate

**Status:** CLOSED / GO ✅
**Scope:** Foundation only — schema, registries, policies, repository,
read-only SDK, tests, documentation. No AI, no extraction, no UI.

## Deliverables

| #   | Item                 | Location                                                            |
| --- | -------------------- | ------------------------------------------------------------------- |
| 1   | Schema migration     | `supabase/migrations/*_business_relationship_memory_foundation.sql` |
| 2   | Frozen registry      | `src/lib/business-connect/relationship-memory/registry.ts`          |
| 3   | DTOs                 | `src/lib/business-connect/relationship-memory/types.ts`             |
| 4   | Error contract       | `src/lib/business-connect/relationship-memory/errors.ts`            |
| 5   | Eligibility gate     | `src/lib/business-connect/relationship-memory/eligibility.ts`       |
| 6   | Memory policy        | `src/lib/business-connect/relationship-memory/memory-policy.ts`     |
| 7   | Server repository    | `src/lib/business-connect/relationship-memory/repository.server.ts` |
| 8   | Read-only server fns | `src/lib/business-connect/relationship-memory/functions.ts`         |
| 9   | SDK + barrel         | `src/lib/business-connect/relationship-memory/{sdk,index}.ts`       |
| 10  | Policy tests         | `src/__tests__/relationship-memory-policy.bc91.test.ts`             |
| 11  | Security tests       | `src/__tests__/relationship-memory-security.bc91.test.ts`           |
| 12  | Docs (8 files)       | `docs/business-connect/relationship-memory/`                        |

## Gate criteria

- [x] Four tables created with `FORCE ROW LEVEL SECURITY`, owner-only
      policies, and explicit `GRANT`s for `authenticated` + `service_role`.
- [x] `business_meeting_private_notes` blocked at three layers (DB CHECK,
      runtime guard, structural repo scan).
- [x] `RELATIONSHIP_MEMORY_SDK_METHODS` frozen and covers the whole SDK.
- [x] Registry + terminal-status list frozen.
- [x] Confidence math bounded and monotonic (proven by tests).
- [x] Lifecycle transitions reject terminal moves and illegal edges.
- [x] Merge escalates sensitivity, preserves oldest first-observed and
      newest last-observed, and sums source counts.
- [x] Barrel does not export server-only modules.
- [x] No AI, no extraction, no mutation server functions in Turn A.

## Not in Turn A

- Extractors, provider adapters, or LLM prompt integration.
- Mutation SDK (accept/reject/merge/forget).
- UI or hooks.
- BC-9.0 intelligence integration (comes in Turn C / BC-9.2).

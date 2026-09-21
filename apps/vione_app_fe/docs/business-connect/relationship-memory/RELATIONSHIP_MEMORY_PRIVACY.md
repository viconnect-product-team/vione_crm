# BC-9.1 Turn A — Relationship Memory Privacy Model

## Hard invariants

1. **Private meeting notes are excluded.** `business_meeting_private_notes`
   MUST NOT enter the memory pipeline, ever, under any path.
2. **Cross-owner reads are impossible.** RLS + `FORCE ROW LEVEL SECURITY`
   plus explicit `owner_user_id` filters in the repository.
3. **Anon has no access.** No `TO anon` policies exist on any of the four
   tables; the Data API returns a permission error for unauthenticated calls.
4. **Sensitivity escalates but never lowers** during merge.

## Three-layer enforcement of the private-notes ban

| Layer      | Mechanism                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database   | `business_relationship_memory_sources.source_domain` CHECK constraint (`<> 'private_meeting_notes'` AND `IN (allowlist)`).                                                                                             |
| Runtime    | `assertSourceDomainEligible` / `assertSourceRefNotBlocked` in `eligibility.ts`.                                                                                                                                        |
| Structural | `relationship-memory-security.bc91.test.ts` scans every source file in the domain and fails the build if `business_meeting_private_notes` or `private_meeting_notes` appears outside `registry.ts` / `eligibility.ts`. |

## Sensitivity tiers

`public_ok < standard < sensitive < restricted`.

Intelligence context builders (BC-9.0) request a maximum tier; the memory
visibility gate (`isMemoryVisibleToIntelligence`) hides any memory whose
sensitivity exceeds the requested tier AND any memory whose status is not
`active`.

## Owner review

- `last_reviewed_at` / `last_reviewed_by` track owner acknowledgement.
- Feedback rows are append-only and owner-scoped.
- `request_forget` is a reserved feedback kind; Turn B will honor it by
  transitioning the memory to `dismissed` and deleting source rows.

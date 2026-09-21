# Meeting Outcome — Test Matrix (BC-7.9 Turn A)

## Domain (`src/__tests__/meeting-outcome.bc79.test.ts`)

1. Registry — 10 types / 2 statuses / version = 1.0.0.
2. Registry — allowed transitions only.
3. Policy — eligibility (`in_progress`, `completed` only).
4. Policy — organizer-only create / update / finalize; participant read; unrelated denied.
5. Policy — `validateOutcomeTransition` guards.
6. Policy — `derivePermissions` composition.
7. Error mapping — every stable code maps back to itself; unknown → `INTERNAL_ERROR`.
8. SDK freeze — exactly the 4 Turn A methods, `Object.isFrozen`.
9. Service — valid create returns draft DTO w/ no uid leak.
10. Service — one outcome per meeting.
11. Service — idempotent create by `clientRequestId` (single event).
12. Service — invalid outcome type rejected.
13. Service — summary length bound (2000).
14. Service — ineligible meeting state rejected.
15. Service — update bumps version by exactly 1.
16. Service — stale expectedVersion → `VERSION_CONFLICT`.
17. Service — finalize + idempotent duplicate finalize (single event, no double bump).
18. Service — finalized outcome update denied.
19. Service — event `mutation_key`s stable and unique across lifecycle.
20. Service — `getOutcome` DTO redacts `recorded_by_user_id`.

## Security (`src/__tests__/meeting-outcome-security.bc79.test.ts`)

- `requireSupabaseAuth` present; no `client.server` / `supabaseAdmin` in outcome server code.
- Repository has no direct `.insert / .update / .delete` writes.
- SDK / functions never accept `recorded_by_user_id`.
- DTO surface excludes raw audit fields.
- Turn A documentation files exist.

## Concurrency notes (harness limits)

The service harness deterministically models the RPC contract for:

- two concurrent updates at the same `expectedVersion` → one succeeds, one raises `VERSION_CONFLICT`;
- update vs finalize serialization → deterministic terminal state;
- duplicate finalize → single `finalized` state and single event;
- duplicate create with same `clientRequestId` → one canonical row.

True DB-level concurrency probes (e.g. parallel session interleaving under
`FOR UPDATE`) require a live DB fixture that the current CI harness does not
run. This is called out honestly and tracked in Deferred Scope for BC-7.9 F/gate.

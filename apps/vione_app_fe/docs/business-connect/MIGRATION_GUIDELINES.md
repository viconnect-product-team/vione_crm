# Migration Guidelines (FROZEN — BC-0.5)

Documentation-only. Mandatory rules for every BC-1…BC-11 migration. A migration
that violates any MUST/MUST-NOT is rejected at Gate D.

## Every migration MUST be

- **Additive** — add tables/columns/functions; never remove in the same step that
  something still depends on.
- **Backward compatible** — Association Hub (`/app`) and Member PWA (`/m`) keep
  working unchanged.
- **Idempotent** — safe to re-run (`IF NOT EXISTS`, guarded backfills).
- **Rollback safe** — a documented, tested down-path that leaves prior behavior intact.

## Every migration MUST include

- **GRANT** for every new `public` table (per public-schema-grants: SELECT/INSERT/
  UPDATE/DELETE to `authenticated`, ALL to `service_role`, `anon` only if a policy
  allows it).
- **RLS** enabled on every new table.
- **POLICY** matching the frozen authorization model (A/B/C/D, ADR-BC-004).
- **Indexes** for every new foreign key and query path.
- **Tests** — RLS/scope tests + regression on existing surfaces.
- **Audit** — audit rows for sensitive mutations (create/edit/publish/delete/role).

## Every migration MUST NEVER

- Rename production tables.
- Break Association Hub or Member PWA.
- Require downtime.
- Remove a compatibility path before cutover is confirmed (parity verified).
- Introduce raw `TO anon` grants on business tables (ADR-BC-005) — public reads go
  through safe server-fn/RPC projections.
- Create fake `members` rows or fake identity (GLOBAL_IDENTITY_CONTRACT).

## Ordering & structure (per public-schema-grants)

1. `CREATE TABLE public.<t>` → 2. `GRANT` → 3. `ENABLE ROW LEVEL SECURITY` →
2. `CREATE POLICY`. Re-read SQL before submit: a GRANT must exist for every new table.

## Backfill rules

- Backfill only **unique, valid** mappings (e.g. card `owner_user_id` from a single
  valid member→user link); report the rest for manual review — never guess.
- Backfills are guarded and idempotent; keep legacy columns until cutover.

## Cutover

- Compatibility columns/policies stay live until output parity is confirmed
  (e.g. `getPublicBusinessCardFn` parity before removing anon card policies).
- Removal of legacy paths is its own reversible step (BC-11).

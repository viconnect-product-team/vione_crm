# GRAPH_WRITE_SECURITY_TESTS.md — BC-4.2

## Static (Vitest, contract-level)

- `src/__tests__/graph-writes.bc42.test.ts` — 15 tests: metadata allowlist,
  scalar-only projection, dedupe determinism, error normalization, SDK write
  surface, registry write compatibility, telemetry payload allowlist.
- `src/__tests__/graph-verification.bc41v.test.ts` — regressed for the new
  BC-4.2 methods; still covers DTO redaction, telemetry allowlist, and
  import-boundary rules.
- `src/__tests__/graph-registry.bc41.test.ts` — inverse pairing, alias
  collisions, deterministic manifest hash.

## Database (psql, migration-time)

- Grants verified: `authenticated` has SELECT-only on graph tables; no
  INSERT/UPDATE/DELETE. `anon` has no grants. Timeline & outbox tables have
  no `authenticated` privileges beyond SELECT (timeline) / none (outbox).
- All BC-4.2 RPCs are `SECURITY DEFINER`, `SET search_path = public`,
  `REVOKE FROM PUBLIC, anon`, and grant EXECUTE only to the roles listed in
  `GRAPH_WRITE_RPCS.md`.

## Authenticated E2E — acknowledged debt

The managed psql role is `BYPASSRLS`, so an in-sandbox authenticated matrix
cannot be run without an external browser session harness. The BC-4.1V
report already flagged this. BC-4.2 keeps the same posture: the RLS/grant
audit is proven in-migration; the full authenticated-user matrix is deferred
to the platform E2E harness slice.

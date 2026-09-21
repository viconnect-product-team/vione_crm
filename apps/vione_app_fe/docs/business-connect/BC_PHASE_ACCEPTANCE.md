# BC Phase Acceptance Criteria (FROZEN — BC-0.5)

Documentation-only. Applies to every phase BC-1…BC-11. A phase is releasable only
when all seven checklists pass and the relevant gate (IMPLEMENTATION_GATES) is
signed off.

## Definition of Ready (DoR) — before starting a phase

- Prior phase's DoD complete; dependencies met (IMPLEMENTATION_ROADMAP).
- Schema/functions/routes designed and reviewed against ADRs.
- Migration plan drafted per MIGRATION_GUIDELINES (additive, rollback-safe).
- Test plan drafted (RLS/scope, e2e, a11y, regression).
- Gate D inputs present.

## Definition of Done (DoD) — before release

- Objective met; acceptance from roadmap satisfied.
- All new tables have GRANT + RLS + POLICY + indexes.
- Audit logging present for sensitive mutations.
- No regression on `/app` (Association) or `/m` (Member PWA).
- Docs updated; ADR added if any decision changed.

## Required Tests

- RLS/scope tests for every new resource (personas P0–P11 as applicable).
- e2e for the phase's user flow.
- a11y (aria-live/role/aria-pressed/keyboard) for new surfaces — matches existing
  a11y contract gate.
- Regression suite for Association + Member surfaces.

## Security Checks

- Public reads via safe RPC/server-fn projection only (no raw anon grants).
- Server-resolved identity; client input untrusted.
- No cross-scope role bleed; no PII in public projections.
- Security backlog items for the phase addressed or explicitly deferred.

## Architecture Checks

- Dependency direction downward only; no Core/Shared importing product code.
- Domain placed with its single owner (DOMAIN_BOUNDARY_MATRIX).
- No fake members/identity; Business Card ≠ Membership Identity.
- Split domains keep infra-in-Core / composition-above.

## Rollback Check

- Down-path documented and rehearsed in preview.
- Compatibility retained until parity confirmed.
- Rollback leaves Association/Member behavior intact.

## Performance Check

- Indexes on new FKs and query paths.
- No N+1 in new server functions; realtime channels scoped.
- Load smoke within thresholds before pilot (Gate F).

---

# Gate Sign-off Log

## Gate A — Architecture Approved

| Field              | Value                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status             | ✅ Approved                                                                                                                                                                                                        |
| Date               | 2026-07-13                                                                                                                                                                                                         |
| Architecture owner | Product owner                                                                                                                                                                                                      |
| Required docs      | ENTERPRISE_ARCHITECTURE_SPECIFICATION.md ✅<br>PLATFORM_ARCHITECTURE_FREEZE.md ✅<br>ADR-BC-001 … ADR-BC-010 ✅<br>PLATFORM_CAPABILITY_MATRIX.md ✅<br>DOMAIN_BOUNDARY_MATRIX.md ✅<br>RESOURCE_SCOPE_MATRIX.md ✅ |
| Tests required     | none (docs-only gate)                                                                                                                                                                                              |
| Decision           | Architecture frozen per BC-0.5; BC-1 may now begin.                                                                                                                                                                |

**Signature record:** Gate A approved; BC-1 unblocked.

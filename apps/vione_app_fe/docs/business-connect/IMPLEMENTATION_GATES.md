# Implementation Gates (FROZEN — BC-0.5)

Documentation-only. No phase advances without passing its gate. Sign-off is
recorded in the phase's acceptance record (`BC_PHASE_ACCEPTANCE`).

## Gate A — Architecture Approved

- **Required docs:** ENTERPRISE_ARCHITECTURE_SPECIFICATION, PLATFORM_ARCHITECTURE_FREEZE,
  all ADR-BC-001…010, capability + boundary + scope matrices.
- **Required tests:** none (docs).
- **Sign-off:** Architecture owner. **Blocks:** BC-1 start.

## Gate B — Identity Approved

- **Required docs:** GLOBAL_IDENTITY_CONTRACT, IDENTITY_HELPER_MATRIX, ADR-BC-001/002/003.
- **Required tests:** identity resolution (member/non-member), no-member login,
  owner-only RLS on `user_profiles`.
- **Sign-off:** Identity + Security owners. **Blocks:** BC-2.

## Gate C — Security Approved

- **Required docs:** ADR-BC-004/005/006, SECURITY_MATRIX, SECURITY_TEST_PLAN,
  PUBLIC_ACCESS_HARDENING_PLAN, SECURITY_BACKLOG.
- **Required tests:** persona matrix P0–P11, public projection parity, RLS/GRANT
  audit for every new table.
- **Sign-off:** Security owner. **Blocks:** any public-exposure or anon-policy change.

## Gate D — Implementation Approved

- **Required docs:** MIGRATION_GUIDELINES, IMPLEMENTATION_ROADMAP, phase DoR.
- **Required tests:** migration additive/idempotent/rollback rehearsal in preview.
- **Sign-off:** Eng lead. **Blocks:** merging a phase's schema/functions.

## Gate E — Internal Demo

- **Required docs:** phase DoD checklist.
- **Required tests:** e2e + a11y for the phase's surface; regression on `/app`, `/m`.
- **Sign-off:** Product + Eng. **Blocks:** pilot exposure.

## Gate F — Pilot

- **Required docs:** rollback runbook, pilot scope, risk sign-off.
- **Required tests:** load/perf smoke, monitoring/alerts live, data-safety checks.
- **Sign-off:** Product + Ops + Security. **Blocks:** production.

## Gate G — Production

- **Required docs:** full acceptance record, closed security backlog for the phase.
- **Required tests:** full security suite, perf thresholds met, backup/rollback verified.
- **Sign-off:** Ops + Security + Product. **Blocks:** GA.

## Gate ↔ phase mapping

- A: before BC-1. B: after BC-1, before BC-2. C: continuous, hard-required before
  BC-11 anon-policy removal. D: before each phase's code merge. E/F/G: per phase
  release.

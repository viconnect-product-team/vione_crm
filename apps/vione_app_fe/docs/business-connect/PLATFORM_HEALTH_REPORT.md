# PLATFORM HEALTH REPORT — Baseline PBM-1.0

**Snapshot date:** 2026-07-13 · **Commit:** `611afd5` · **Architecture:** Business Connect v1

Scores are 1–10, derived only from measurable repository facts. Unmeasured factors are flagged and do not inflate scores.

## Scorecard

| Dimension                  | Score   | Trend basis                                                   |
| -------------------------- | ------- | ------------------------------------------------------------- |
| Architecture               | 9       | Frozen spec, 10 ADRs, 3-layer contract, layer diagram         |
| Security                   | 8       | 54/54 RLS, 180 policies, 6 anon, 28 SECURITY DEFINER helpers  |
| Maintainability            | 8       | Layered modules, 59 scoped services, generated route tree     |
| Testability                | 7       | 27 tests (unit/RLS/E2E/a11y/security); coverage not measured  |
| Performance                | 6       | 134 indexes, query-loader prefetch; no bundle/runtime metrics |
| Scalability                | 8       | Scope model, 5 realtime tables, additive migration policy     |
| Developer Experience       | 8       | Build gates (i18n/a11y/typecheck), playbook, strict TS        |
| AI Readiness               | 8       | Real gateway provider, audit, tested tools/memory/guardrails  |
| Business Connect Readiness | 7       | Gate A approved; BC-1 identity refactor pending               |
| **Overall**                | **7.7** | Well-governed, ready to build                                 |

## Detailed rationale

**Architecture (9)** — Full BC-0 freeze (BC-0.1→0.6), 10 ADRs, capability + boundary + scope matrices. Deduction: identity/`members` coupling still to be resolved in BC-1.

**Security (8)** — Every public table has RLS; only 6 anon policies, all mapped to public projections per ADR-BC-005. 28 SECURITY DEFINER functions centralize authorization. Deduction: live payment path and some session-gated flows unverified in CI.

**Maintainability (8)** — 59 `.functions.ts` services + 7 `.server.ts` privileged helpers keep concerns separated; 137 lib files signal future pruning need.

**Testability (7)** — Coverage spans unit, RLS, E2E, accessibility (axe) and security guardrails, but total coverage % is Not Measured.

**Performance (6)** — Strong DB indexing and TanStack Query prefetch, but no bundle-size, chunk, or runtime measurement exists yet. Two polling hooks noted.

**Scalability (8)** — ResourceScope model, realtime on 5 tables, and additive/idempotent migrations support growth.

**Developer Experience (8)** — Prebuild gates fail on missing i18n keys and a11y regressions; generated routes and strict build reduce drift.

**AI Readiness (8)** — Real provider (`google/gemini-3-flash-preview`) live and audited; tools/memory/workflow/knowledge/guardrails all tested. Streaming behavior unverified.

**Business Connect Readiness (7)** — Architecture frozen and Gate A signed; implementation phases BC-1…BC-11 not yet started.

## Recommended focus before/within BC-1

1. Establish bundle + runtime performance measurement (raise Performance score).
2. Add coverage reporting to CI (raise Testability score).
3. Execute BC-1 identity separation to remove the last architecture deduction.

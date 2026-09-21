# PLATFORM RELEASE BASELINE — PBM-1.0

**This document declares the official immutable baseline of the ViOne Business Connect platform, captured immediately after Gate A and before BC-1.**

## Release header

| Field                | Value                                           |
| -------------------- | ----------------------------------------------- |
| Baseline ID          | PBM-1.0                                         |
| Release Name         | ViOne Platform — BC-0 Baseline                 |
| Architecture Version | Business Connect v1                             |
| Architecture Status  | Frozen (BC-0.1 → BC-0.6)                        |
| Gate Status          | Gate A — Architecture Approved (2026-07-13)     |
| Date                 | 2026-07-13                                      |
| Git Branch           | `edit/edt-be8b109e-9b37-43c5-bce6-36c16277049a` |
| Git Commit           | `611afd55527b2b26b9488415e49594140bc18e4f`      |
| Git Tag              | Not Measured                                    |
| Repository Root      | `/dev-server`                                   |

## What this baseline is

- The factual, frozen snapshot every future release compares against.
- Documentation only — no code, migration, DB, server function, route, or UI changes were made.

## Baseline contents (all in `docs/business-connect/`)

1. `PLATFORM_BASELINE_MANIFEST_v1.0.md` — full 17-section manifest
2. `PLATFORM_HEALTH_REPORT.md` — 10-dimension health scorecard
3. `PLATFORM_METRICS_BASELINE.md` — immutable comparison keys
4. `PLATFORM_TECH_DEBT_REGISTER.md` — accepted debt register
5. `PLATFORM_RELEASE_BASELINE.md` — this declaration

## Frozen confirmations

Architecture ✅ · Identity ✅ · Scope ✅ · Capability ✅ · Migration strategy ✅ · Engineering playbook ✅

## Headline metrics

54 tables · 81 routes · 109 components · 59 server-function modules · 34 DB functions (28 SECURITY DEFINER) · 180 policies · 134 indexes · 98 migrations · 27 tests · 2 storage buckets · 5 realtime tables · 5 extensions (pgvector absent).

## Health & readiness

- Overall Health: **7.7 / 10**
- Business Connect Readiness: **7 / 10** (Gate A signed; BC-1 not started)

## Change control

This baseline is immutable. Any deviation from the frozen architecture requires a new ADR and Gate A re-approval. The next baseline snapshot (PBM-1.1) is captured at the end of BC-1 and MUST compare against the keys in `PLATFORM_METRICS_BASELINE.md`.

## Sign-off

- Baseline captured: 2026-07-13
- Basis: Gate A — Architecture Approved (recorded in `BC_PHASE_ACCEPTANCE.md`)

---

### Return values

- Platform Baseline Version: **PBM-1.0**
- Architecture Version: **Business Connect v1**
- Health Score: **7.7 / 10**
- Business Connect Readiness: **7 / 10**
- Recommended next phase: **BC-1 — Global Identity**

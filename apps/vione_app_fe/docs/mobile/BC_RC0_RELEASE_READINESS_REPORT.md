# BC-RC0 — Release Readiness Audit Report

**Project:** Business Connect PWA
**Phase:** RELEASE CANDIDATE — RC0 (Audit Baseline)
**Mode:** AUDIT-FIRST / READ-ONLY (no product code changed; feature freeze respected)
**Date:** 2026-08-12
**Verdict:** **CONDITIONALLY READY — NOT PILOT-READY**

---

## 1. Executive summary

Business Connect has a strong engineering baseline: 24 mobile phase gates (0A–7B) plus platform gates (BC-2.x, 3.x, 4.x, 8.0F, 9.0, 9.1) are engineering-closed with test evidence, migrations are disciplined (169 files, zero destructive ops, GRANT+RLS co-located), live RLS policies are tightly scoped, the client/server boundary holds, and the production build, typecheck, and i18n gates are green.

However, RC0 found **1 S0 security issue, 2 S2 release-blocking issues, 6 S3 issues, and 8 S4 debt items**, and **all 7 device/browser UAT gates remain OPEN**. The automated test baseline has degraded since the last closures (41 failing tests; 27 of them are genuine harness/contract drift, not staging limitations). The lint gate is red (362 errors, mostly formatting drift).

**The app is NOT pilot-ready today.** It becomes pilot-ready after a narrow, fix-only RC1 pass (Section 10) and completion of the open UAT gates.

## 2. Audit method

- Read-only exploration of `src/routes/`, `src/lib/`, `src/components/business-connect/`, `supabase/migrations/`, `docs/`.
- Four parallel investigation tracks: (A) gate inventory across all closure/audit docs, (B) route & product-surface inventory, (C) mock/TODO/legacy audit, (D) backend/migrations/RLS/storage/public-endpoint audit.
- Local gates executed: `bun run check-i18n`, `bunx tsgo --noEmit`, full `bunx vitest run` (163 files), `bun run lint`, `bun run build`.
- Live database RLS verification via read-only policy query (current policies, not just migration text).
- No product code, migrations, or configs were modified. Only the five RC0 documents were written.

## 3. Automated verification evidence (RC0 baseline)

| Gate | Result | Detail |
|---|---|---|
| Typecheck (`tsgo --noEmit`) | **PASS** | 0 errors |
| Production build (`bun run build`) | **PASS** | Nitro/Worker build completes; client+server bundles emitted |
| i18n (`check-i18n`) | **PASS** | 3,685 keys, vi+en complete |
| Lint (`bun run lint`) | **FAIL** | 362 errors / 155 warnings — 358 are `prettier/prettier` formatting drift; 4 minor (`prefer-const`, 2× `no-control-regex` in text-normalization modules, `no-useless-escape`) |
| Unit/integration tests (`vitest run`) | **PARTIAL** | **2,591 passed / 41 failed / 101 skipped** (163 files). Breakdown below. |
| Staging e2e (RLS/renewal/multi-tenant) | **NOT RUN** | 14 tests across 13 `*.e2e` files refuse to run against the production host by design (`requireStagingSupabase` guard works correctly). No staging environment is configured. |

### Failing-test classification (41 total)

| Category | Count | Files | RC0 classification |
|---|---|---|---|
| Staging-guarded e2e (refuses prod host — guard working as designed) | 14 | `renewal-*.e2e` (7), `rls-*.e2e` (3), `platform-identity`, `networking-invite`, `multi-tenant-rls`, `company-history-networking`, `business-cards-scoping` | **S4** — staging environment not provisioned; not a product defect |
| jsdom server-fn harness drift (`ERR_INVALID_URL` — components gained new server-fn dependencies after their suites were frozen) | 15 | `bcm1a` (9), `bcm1b` (5), `bcm2d` (1) | **S2** — automated regression evidence for 1A/1B/2D is currently red |
| UI-test selector/mock drift | 10 | `recommendation-ui.bc45` (4), `business-connect-overview.bcuit` (3), `business-connect-navigation.bcuit` (1, i18n hydration), `bcm0b` (1), `bcm4b` (1) | **S2** — harness drift; BC-4.5 and shell/scan regression evidence red |
| Server-fn runtime-context drift (`No Start context found`, import timeout flake) | 2 | `business-connect-ai-policy.bc90` (1), `business-connect-ai-security.bc90` (1) | **S2** — BC-9.0 contract evidence red |
| **Real contract violations** | 3 | `graph-verification.bc41v` (1 — `person-journey.server.ts` + `connection/service.server.ts` import `graph.repository.server` directly), `relationship-memory-ui-security.bc91` (1 — `RelationshipMemoryExplorer.tsx` bypasses the barrel), `api-auth-guardrails` (7 → 2 genuine unauthenticated endpoints + 5 allowlist-governance gaps) | **S0/S4** — see issues registry |

## 4. Gate inventory summary

Full inventory is in `BC_RC0_RELEASE_READINESS_MATRIX.md`. Headline facts:

- **24 BC-Mobile gates (0A→7B)**: all engineering CLOSED/GO with test evidence (44–178 tests per phase). Every phase 4B→7B carries an explicit "engineering complete — device/browser UAT open" caveat.
- **Platform gates**: BC-2.1A–2.7 (ownership/capability), BC-3.0/3.1A–F (networking), BC-4.0/4.1A (meetings), BC-8.0F (Work Hub, CLOSED/GO), BC-9.0 (AI runtime, CLOSED/GO), BC-9.1 Turns A–C1 (Relationship Memory, CLOSED/GO), P0-A1 (member PWA, GO with 1 tracked violation).
- **Feature freeze** is active since BC-Mobile-7B (`BC_MOBILE_RELEASE_GATES.md`); frozen: Community Feed, Community AI, Opportunity Matching, Event Recommendations, Marketplace, Referral, Invitation, Chat, AI Chat, Follow, new domains.
- **Docs gap**: `BC_MOBILE_3B_GUEST_GATE.md` is referenced by the 3B architecture doc but does not exist (S4).

## 5. Route & product-surface findings

- **Three parallel surface trees exist**: `/connect-app/*` (current mobile PWA — LIVE, auth-guarded), `/business-connect/*` (desktop — still linked from sidebar), `/connect/*` (legacy — routable but **not linked from any nav**; orphaned). Pilot messaging must name exactly one entry surface (see Pilot Scope).
- **`/business-connect/*` layout has no `beforeLoad` auth guard** — anonymous visitors get app chrome before data calls fail (data itself remains protected by server-fn auth + RLS). S3.
- **Public surfaces are correctly engineered**: `/c/$token` (always noindex, fail-closed), `/b/$slug`, `/company/$slug`, `/h/$slug`, guest-contact + VCF API endpoints (rate-limited, validated, no enumeration).
- **Metadata gaps**: the 4 BC-Mobile-7B community routes (events list/detail, opportunities list/detail) have **no `head()` at all**; `/connect-app/me/card` and `/card/$code` lack a `robots` policy. All are behind auth or low-risk, but they break the per-route head/noindex convention. S3.
- No duplicate-URL collisions in the generated route tree.

## 6. Backend, RLS, storage & security findings

**Verified live RLS (queried current policies, not just migration text):**

- `events`, `event_registrations`, `opportunities`, `opportunity_interests`: **properly scoped** — selects restricted to association members; writes restricted to association admins, platform admins, or the owning member/poster. An early migration's permissive `USING (true)` policies were **superseded by later tightening migrations**. No open-RLS issue in the current database.
- Identity/NFC/moments/connections/guest-contact tables: owner-scoped; writes via SECURITY DEFINER RPCs where anonymous submission is required.
- Migrations: 169 files, zero `DROP TABLE`/`TRUNCATE`, rehearsed rollback pattern for the ownership backfill.
- Storage: `relationship-moments` bucket policies are owner-folder-isolated; signed URLs used for private buckets. Bucket **creation is not tracked in migrations** (dashboard-managed, undocumented — S4).
- Client/server boundary: clean — no `.sdk.ts` imports server modules.

**Security issues found (full detail in `BC_RC0_OPEN_ISSUES.md`):**

| ID | Severity | Issue |
|---|---|---|
| RC0-S0-01 | **S0** | `analyzeCardImage` + `recommendOptimalTemplate` are `createServerFn` endpoints **without `requireSupabaseAuth`** that forward image payloads to the AI gateway — anonymous, publicly callable AI-spend/abuse vector. |
| RC0-S2-01 | **S2** | `/api/public/hooks/outcome-consumer` and `/api/public/hooks/timeline-projection` "authenticate" with the **public anon apikey** (shipped to browsers) — effectively unauthenticated internal job triggers. `notification-runtime` does it correctly with a dedicated cron secret. |
| RC0-S3-06 | S3 | `/api/public/identity/$token/contact` writes via direct service-role admin client instead of the SECURITY DEFINER RPC pattern used by its card-based sibling (rate-limited + validated, but inconsistent). |
| RC0-S3-04 | S3 | `bookDemoSlot` / `getDemoAvailability` are intentionally public but have **no rate limiting** (spam vector on a PII-inserting endpoint). |

## 7. Mocks, TODOs, placeholders

- **No production-reachable mock/fake data inside Business Connect scope.** The mock AI engine (`ai-mock-answer-engine.ts`, `MockAiProvider`) belongs to the separate generic `/ai` assistant and is not reachable from Business Connect's AI path.
- **Zero literal TODO/FIXME/HACK markers** in BC scope; deferred work is expressed through typed `"soon"` states with truthful i18n copy (V-action sheet, meetings timeline, "coming soon" tabs) — legitimate, labeled phased rollout, not stubs.
- Legacy strangler migration (`src/lib/business-card.functions.ts` → scoped `business-card.sdk.ts`) is incomplete: 6+ importers still on the legacy flat file. S4.

## 8. Device, browser, accessibility & UAT status

- **All 7 UAT gates OPEN** (register: OCR/device, physical NFC, public card device, two-user handshake, 6A/6B/6C interactive, 7A interactive, 7B interactive). See `BC_RC0_DEVICE_BROWSER_MATRIX.md`.
- Visual evidence to date is **DOM-test-only** at 375/390/430/480 px (Chromium via Playwright in sandbox). No physical-device, no Safari/Firefox, no iOS PWA-install evidence exists anywhere in the repo.
- Accessibility: axe-based checks exist for several phases (e.g. 5C axe-clean); no full-app WCAG sweep on the assembled product.

## 9. Verdict

**CONDITIONALLY READY — NOT PILOT-READY.**

- Engineering baseline: **strong** (architecture, RLS, migrations, boundaries, canonical domains).
- Release blockers: **1× S0** (anonymous AI endpoints), **2× S2** (anon-key-authenticated internal hooks; red automated-test baseline incl. 3 real contract violations).
- UAT: **0/7 device gates complete** — pilot cannot start regardless of code fixes.
- Scope ambiguity: three parallel surface trees; pilot entry surface must be declared.

## 10. RC1 fix-only scope (permitted under feature freeze — release-blocking only)

1. **RC0-S0-01**: add `requireSupabaseAuth` (+ per-user rate limit) to `analyzeCardImage` and `recommendOptimalTemplate`.
2. **RC0-S2-01**: switch `outcome-consumer` and `timeline-projection` hooks to the cron-secret pattern used by `notification-runtime`.
3. **RC0-S2-02**: repair the test harness (extend stale mocks to new server-fn deps; fix i18n hydration in bcuit suites; raise/import-timeout fix for bc90), fix the 3 real contract violations (graph import boundary, RM barrel import, guardrail allowlist update).
4. **RC0-S3-01**: add `head()` with `robots: noindex` to the 4 BC-Mobile-7B routes; add robots policy to `me/card` and `/card/$code`.
5. **RC0-S3-05**: run `eslint --fix` for the 358 prettier errors; resolve the 4 minor lint errors (or document intentional `no-control-regex`).

Everything else stays untouched until post-pilot. No new features, no new surfaces, no refactors beyond this list.

## 11. Sign-off

| Role | Decision |
|---|---|
| Engineering baseline | APPROVED (with RC1 fix-only scope above) |
| Security | BLOCKED on RC0-S0-01, RC0-S2-01 |
| Automated verification | BLOCKED on RC0-S2-02 (baseline red), lint red |
| Device/UAT | BLOCKED — 7 gates open |
| **Overall RC0** | **CONDITIONALLY READY — NOT PILOT-READY** |

# BC-RC0 — Open Issues Register

Severity model: **S0** security/data isolation · **S1** broken core contract/data corruption · **S2** production reliability/deployment blocker · **S3** UX/consistency/polish · **S4** tech debt/docs/observability.
Nothing is downgraded because it is inconvenient. "Pilot blocker" = must close before pilot start.

## S0 — Security

| ID | Issue | Evidence | Pilot blocker | RC1 action |
|---|---|---|---|---|
| RC0-S0-01 | `analyzeCardImage` and `recommendOptimalTemplate` (`src/lib/card-ai.functions.ts`) are `createServerFn` POST endpoints **without `requireSupabaseAuth`** that forward image payloads to the AI gateway using the server AI key. Server functions are publicly callable HTTP RPCs regardless of UI usage — anonymous AI-spend/quota-hijack + prompt-injection vector. Used by legacy `AiCardImportModal.tsx`. | `api-auth-guardrails.test.ts` failures (2 of 7); direct source read | **YES** | Add `requireSupabaseAuth` + per-user rate limit; confirm legacy modal still behind auth-guarded `/connect` tree |

## S2 — Reliability / deployment blockers

| ID | Issue | Evidence | Pilot blocker | RC1 action |
|---|---|---|---|---|
| RC0-S2-01 | `/api/public/hooks/outcome-consumer` and `/api/public/hooks/timeline-projection` accept the **public Supabase anon apikey** as their auth credential. The anon key ships to browsers, so these internal job triggers are effectively unauthenticated (unauthorized execution of outcome consumer / timeline projection with service-role privileges; batch-clamped and idempotent, but unauthorized). `notification-runtime` already demonstrates the correct pattern (dedicated `NOTIFICATION_RUNTIME_CRON_SECRET` + timing-safe compare). | Source read of both hooks; backend audit | **YES** | Switch both hooks to a cron-secret env var + timing-safe comparison, mirroring `notification-runtime` |
| RC0-S2-02 | **Automated test baseline is red**: 27 non-staging failures across 14 files — jsdom server-fn harness drift (`ERR_INVALID_URL`: bcm1a ×9, bcm1b ×5, bcm2d ×1), UI selector/mock drift (recommendation-ui.bc45 ×4, bcuit overview ×3, bcuit navigation ×1 [i18n hydration], bcm0b ×1, bcm4b ×1), BC-9.0 Start-context drift + import-timeout flake (×2). Regression evidence for phases 1A/1B/2D/4B/4.5/9.0 is currently not green. | Full `vitest run` log | **YES** | Repair harnesses (extend mocks to new server-fn deps, fix i18n hydration, isolate Start-context tests); re-run to green |

## S3 — UX / consistency / polish

| ID | Issue | Evidence | Pilot blocker | RC1 action |
|---|---|---|---|---|
| RC0-S3-01 | 4 BC-Mobile-7B routes have **no `head()`** (title/robots): `community/$communityId/events`, `/events/$eventRef`, `/opportunities`, `/opportunities/$opportunityRef`. `/connect-app/me/card` has head but no `robots`; `/card/$code` has no `robots` policy (inconsistent with `/b`, `/c`, `/company`). All auth-guarded or low-risk, but breaks the per-route metadata convention. | Route audit; direct file read | YES (cheap, metadata-class fix permitted pre-pilot) | Add `head()` with `robots: noindex` per convention |
| RC0-S3-02 | `/business-connect/*` desktop layout has **no `beforeLoad` auth guard** (unlike `/connect-app`, `/connect`, `/m`) — anonymous users see app chrome before data calls fail. Data remains protected (server-fn auth + RLS). | Route audit §1 | No (desktop tree excluded from pilot) | Post-pilot hardening or declare intentional |
| RC0-S3-03 | **Three parallel surface trees**: `/connect/*` is routable but linked from no navigation (orphaned legacy); `/business-connect/*` and `/connect-app/*` both live. Product ambiguity for release messaging. | Route/mock audits | No — resolved by Pilot Scope declaration | Declare `/connect-app` as sole pilot entry (done); decide legacy retirement post-pilot |
| RC0-S3-04 | `bookDemoSlot` / `getDemoAvailability` (intentionally public demo-booking) insert PII via admin client with **no rate limiting** — spam vector. Not a pilot surface. | Source read | No | Add IP rate limit (post-pilot or opportunistic) |
| RC0-S3-05 | **Lint gate red**: 362 errors / 155 warnings — 358 `prettier/prettier` formatting drift concentrated in mobile components/tests, plus `prefer-const` ×1, `no-control-regex` ×2 (text normalization in `vcard.ts`, `guest-contact*`, `assoc-scope.server.ts`, `business-card-authz.ts`, `business-card-nfc.ts` — likely intentional stripping), `no-useless-escape` ×1. Drift accumulated after BC-Mobile-7B reported lint clean. | `bun run lint` | YES (gate must be green; autofix only) | `eslint --fix` + suppress/justify control-regex with comments |
| RC0-S3-06 | `/api/public/identity/$token/contact` writes guest contacts via **direct service-role admin client** instead of the SECURITY DEFINER RPC (`share_guest_contact`) used by the card-based sibling. Rate-limited + server-validated + returns no content, but inconsistent pattern widens the admin-key footprint. | Backend audit | No | Align to RPC pattern post-pilot |

## S4 — Tech debt / docs / observability

| ID | Issue | Evidence | RC1 action |
|---|---|---|---|
| RC0-S4-01 | `graph-verification.bc41v` contract violation: `lib/business-connect/mobile/person-journey.server.ts` and `lib/connection/service.server.ts` import `graph.repository.server` directly, bypassing the graph service/SDK boundary (server-to-server; no client leak). | Failing test | Route both through the sanctioned graph entrypoint; restore test |
| RC0-S4-02 | `relationship-memory-ui-security.bc91` contract violation: `RelationshipMemoryExplorer.tsx` imports past the public RM barrel. | Failing test | Import via barrel only; restore test |
| RC0-S4-03 | `api-auth-guardrails` PUBLIC_ALLOWLIST governance drift: 5 intentional-public functions not recorded (`getPublicBusinessCardFn`, `listPublicProfileSlugsFn`, `getDemoAvailability`, `bookDemoSlot`, `getMockModeStatusFn`). Guardrail test red until allowlist updated with audit notes. | Failing test (5 of 7) | Add to allowlist with per-endpoint justification |
| RC0-S4-04 | `BC_MOBILE_3B_GUEST_GATE.md` referenced by `BC_MOBILE_3B_GUEST_ARCHITECTURE.md` but **missing** — 3B closure evidence undocumented. | Gate inventory | Either author the gate doc retroactively or amend the reference |
| RC0-S4-05 | Storage bucket creation not tracked in migrations (dashboard-managed); only `relationship-moments` policies are in SQL. Source-of-truth undocumented. | Backend audit | Document bucket inventory + settings |
| RC0-S4-06 | 14 staging-dependent e2e tests (RLS, renewals, multi-tenant, identity) refuse to run — no staging Supabase environment configured. Guard works correctly (refuses production host). | Test log (`requireStagingSupabase`) | Provision staging env or formally defer with sign-off |
| RC0-S4-07 | Legacy `src/lib/business-card.functions.ts` → scoped `business-card.sdk.ts` migration incomplete (6+ importers on legacy path). Strangler-fig in progress, no tracked intent. | Mock/legacy audit | Confirm ownership; schedule or accept |
| RC0-S4-08 | **7 UAT gates open** (device/browser/NFC/two-user/6A-6C/7A/7B) — see `BC_RC0_DEVICE_BROWSER_MATRIX.md`. No physical-device evidence exists in the repo for any surface. | Release gates register | Execute UAT plan; capture evidence per gate |
| RC0-S4-09 | No source-tracked security headers: generated `_headers` only sets `cache-control` for `/assets/*`; no CSP, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy` (camera/NFC policy notably absent given the app uses both). | `dist/client/_headers` build output | Define a headers policy (at minimum `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` allowing camera/NFC/serial where needed) before public launch |

## Summary

| Severity | Count | Pilot blockers |
|---|---|---|
| S0 | 1 | 1 |
| S1 | 0 | 0 |
| S2 | 2 | 2 |
| S3 | 6 | 2 (S3-01, S3-05) |
| S4 | 9 | 0 (S4-08 is a UAT program, tracked separately) |

**Pilot start requires: all S0 + S2 closed, S3-01/S3-05 closed, and UAT program (S4-08) complete.**

## Cập nhật RC1 (2026-08-11)
- S0-01 — REMEDIATED IN RC1 / VERIFIED IN RC1 (card-ai-auth.rc1, api-auth-guardrails).
- S2-01 — REMEDIATED IN RC1 / VERIFIED IN RC1 (hooks-cron-auth.rc1, pg_cron anon job đã gỡ).
- S2-02 — REMEDIATED IN RC1 / VERIFIED IN RC1 (baseline xanh; 16 suite live-DB ENV_DEFERRED_TO_RC2).
- S3/S4 — không đổi.

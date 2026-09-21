# BC-RC0 — Release Readiness Matrix (canonical)

One row per functional area. Evidence is quoted from closure docs and RC0 verification; verdicts are not rewritten. Legend: ✅ proven · ⚠️ partial/degraded · ❌ missing/red · ➖ not applicable.

| # | Area | Phase gates | Engineering evidence | Automated tests (RC0) | Device/browser | Staging | Security | Docs | Pilot verdict |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mobile foundation & shell (5-tab IA) | 0A, 0B | ✅ 68/68 + 18 shell tests at closure | ⚠️ `bcm0b` 1 failing (drift) | ⚠️ DOM-only widths | ➖ | ✅ | ✅ | READY after RC1 test repair |
| 2 | Executive Home | 1A, 1B | ✅ 26 + 21 tests at closure | ❌ `bcm1a` 9 + `bcm1b` 5 failing (harness drift, `ERR_INVALID_URL`) | ⚠️ DOM-only 375–480px; no live screenshot (2B signed_out note) | ➖ | ✅ auth not bypassed | ✅ | **BLOCKED** until RC1 harness repair |
| 3 | Network list / person detail / timeline | 2A–2D | ✅ 26+25+34+28 at closure | ⚠️ `bcm2d` 1 failing; suites otherwise green | ⚠️ DOM-only | ➖ | ✅ fail-closed resolver, sanitizers | ✅ | READY after RC1 |
| 4 | Meeting Moments | 2E | ✅ 28/28 | ✅ | ❌ untested on device | ➖ | ✅ owner-scoped media RLS | ✅ | UAT OPEN |
| 5 | Guest contact exchange | 3B | ⚠️ closure gate doc **missing** (`BC_MOBILE_3B_GUEST_GATE.md` referenced, absent) | ✅ covered indirectly (5D/7B privacy suites) | ❌ | ➖ | ✅ rate-limited, SECURITY DEFINER RPC | ⚠️ S4 docs gap | READY w/ docs gap noted |
| 6 | Card scan OCR → review → save | 4A, 4B | ✅ 43 + 34 at closure; CONDITIONAL PASS | ⚠️ `bcm4b` 1 failing | ❌ device/browser UAT OPEN | ➖ | ⚠️ **RC0-S0-01**: legacy AI endpoints unauthenticated | ✅ | **BLOCKED** (S0 + UAT) |
| 7 | Me / digital identity | 5A | ✅ 15/15 | ✅ | ❌ | ➖ | ✅ no SECURITY DEFINER on public path | ✅ | UAT OPEN |
| 8 | NFC transport + tag registry | 5B, 5C | ✅ 32 + 35, axe-clean | ✅ | ❌ physical tag write/tap untested | ➖ | ✅ NDEF = share URL only | ✅ | UAT OPEN (hardware) |
| 9 | Public digital card `/c/$token` | 5D | ✅ engineering closed | ✅ | ❌ device rendering/save-contact untested | ➖ | ✅ always noindex, fail-closed, rate-limited contact | ✅ | UAT OPEN |
| 10 | Connection handshake | 5E | ✅ engineering closed | ✅ 32/32 (7B regression) | ❌ live two-account UAT OPEN | ➖ | ✅ opaque token resolution | ✅ | UAT OPEN |
| 11 | Relationship intelligence | 6A | ✅ 47/47 at closure | ✅ (7B regression 74/74 w/ 6B/6C) | ❌ interactive UAT OPEN | ➖ | ✅ threat model, injection tests | ✅ | UAT OPEN |
| 12 | Relationship actions | 6B | ✅ 16/16 | ✅ | ❌ | ➖ | ✅ truthful handoffs only | ✅ | UAT OPEN |
| 13 | Relationship personalization | 6C | ✅ audit frozen | ✅ | ❌ | ➖ | ✅ fail-closed recs / fail-open prefs | ✅ | UAT OPEN |
| 14 | Community foundation | 7A | ✅ 12/12 + 31/31 regression | ✅ | ❌ interactive UAT OPEN | ➖ | ✅ allowlist telemetry | ✅ | UAT OPEN |
| 15 | Community events & opportunities | 7B | ✅ 46/46 + regressions; CONDITIONAL PASS | ✅ incl. viewer-cache isolation (A→B→A, late-response race) | ❌ device UAT OPEN | ➖ | ✅ live RLS verified scoped (admin/poster/member) · ⚠️ 4 routes missing head()/noindex (S3) | ✅ | UAT OPEN + metadata fix in RC1 |
| 16 | Work Hub (unified read model) | BC-8.0F | ✅ CLOSED/GO | ✅ | ➖ desktop surface | ➖ | ✅ auth on every fn, PII allowlist | ✅ | Out of mobile pilot scope |
| 17 | Meetings domain | BC-4.0/4.1A | ✅ closed (platform) | ⚠️ not re-run per-suite this RC; no failures observed in full run | ➖ | ⚠️ staging-dependent e2e exists | ✅ | ✅ | Out of mobile pilot scope |
| 18 | Smart introductions | BC-6.x family | ✅ closed | ⚠️ hooks auth weakness **RC0-S2-01** (outcome-consumer) | ➖ | ➖ | ⚠️ S2 | ✅ | **BLOCKED** on S2-01 |
| 19 | AI runtime | BC-9.0 | ✅ CLOSED/GO, 52 tests | ❌ 2 failing (Start-context drift + import timeout) | ➖ | ➖ | ⚠️ evidence red | ✅ | **BLOCKED** until RC1 harness repair |
| 20 | Relationship memory | BC-9.1 A–C1 | ✅ CLOSED/GO, 275 tests | ⚠️ 1 failing (barrel import violation — real, S4) | ➖ | ⚠️ live-Postgres HNSW/RLS proofs deferred (documented) | ✅ | ✅ | READY after RC1 |
| 21 | Global networking / connections | BC-3.0/3.1A–F | ✅ closed, RLS test report | ⚠️ RLS e2e staging-guarded | ➖ | ❌ staging not provisioned | ✅ live RLS participant-scoped | ✅ | READY w/ staging caveat |
| 22 | Business card platform | BC-2.1A–2.7 | ✅ closed, rehearsed backfill rollback | ⚠️ `business-cards-scoping.e2e` staging-guarded | ➖ | ❌ | ✅ owner-scoped | ✅ | READY w/ staging caveat |
| 23 | Notifications orchestration | platform | ✅ docs complete | ✅ | ➖ | ➖ | ⚠️ `timeline-projection` hook auth (RC0-S2-01) | ✅ | **BLOCKED** on S2-01 |
| 24 | i18n (vi default + en) | all | ✅ | ✅ 3,685 keys, gate green | ➖ | ➖ | ➖ | ✅ | READY |
| 25 | Accessibility | per-phase | ⚠️ axe evidence per phase only | ⚠️ no assembled-app sweep | ❌ | ➖ | ➖ | ✅ checklist exists | PARTIAL — sweep in pilot prep |
| 26 | PWA installability | 0B/manifest | ✅ manifest + icons present | ➖ | ❌ no install test on iOS/Android | ➖ | ➖ | ✅ | UAT OPEN |
| 27 | Public surfaces (`/c`,`/b`,`/company`,`/h`, guest APIs) | 5D, BC-2.3 | ✅ | ✅ | ❌ device | ➖ | ✅ rate-limited, no enumeration, noindex correct | ✅ | UAT OPEN (device only) |
| 28 | Legacy trees `/connect/*`, `/business-connect/*` | pre-mobile | ✅ functional | ⚠️ `/business-connect` lacks `beforeLoad` guard (S3); `/connect` orphaned from nav (S3) | ➖ | ➖ | ✅ data protected by RLS/server auth | ✅ | **EXCLUDED from pilot** (declare entry surface) |

## Cross-cutting gates

| Gate | Status | Evidence |
|---|---|---|
| Typecheck | ✅ PASS | `tsgo --noEmit` 0 errors |
| Build | ✅ PASS | nitro production build |
| Lint | ❌ FAIL | 362 errors (358 prettier drift + 4 minor) — RC0-S3-05 |
| Unit/integration tests | ⚠️ PARTIAL | 2,591/2,632 non-skipped passing; 27 non-staging failures (RC0-S2-02) |
| Staging e2e | ❌ NOT RUN | 14 tests guard-refused (no staging env) — RC0-S4-06 |
| Device/browser UAT | ❌ 0/7 | `BC_MOBILE_RELEASE_GATES.md` register |
| Feature freeze | ✅ ACTIVE | since BC-Mobile-7B |

## RC1 FINAL EVIDENCE (append-only, không sửa giá trị RC0)
- Local baseline: 2644 PASS / 101 skip / 0 lỗi chạy được cục bộ.
- Lint: 0 error (45 warning trong baseline tech-debt). tsgo PASS. i18n PASS (3685 key). Build PASS.
- Environment-deferred: 16 suite live-DB E2E → RC2.
- Verdict: BC-RC1 PASS. RC2 UNLOCKED.

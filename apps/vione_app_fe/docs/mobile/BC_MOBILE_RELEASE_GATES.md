# Business Connect — Mobile Release Gate Register (cumulative)

Commercial-release readiness tracker. Engineering closures are recorded in
each phase's closure report; this register tracks ONLY the outstanding
user-acceptance / device gates that remain open for commercial release.
Prior phase verdicts are not rewritten here — see the closure reports.

## Phase verdicts (engineering)

| Phase | Verdict | Evidence |
|---|---|---|
| BC-Mobile-4B Card Scan | CLOSED | `BC_MOBILE_4B_CLOSURE_REPORT.md` |
| BC-Mobile-5A Me / Identity | CLOSED | `BC_MOBILE_5A_CLOSURE_REPORT.md` |
| BC-Mobile-5B NFC Transport | CLOSED | `BC_MOBILE_5B_CLOSURE_REPORT.md` |
| BC-Mobile-5C NFC Tag Registry | CLOSED (engineering) | `BC_MOBILE_5C_NFC_TAG_REGISTRY.md` |
| BC-Mobile-5D Public Card | CLOSED (engineering) | `BC_MOBILE_5D_PUBLIC_CARD.md` |
| BC-Mobile-5E Connection Handshake | CLOSED (engineering) | `BC_MOBILE_5E_CONNECTION_HANDSHAKE.md` |
| BC-Mobile-6A Relationship Intelligence | CLOSED (engineering) | `BC_MOBILE_6A_CLOSURE_REPORT.md` |
| BC-Mobile-6B Relationship Actions | CLOSED (engineering) | `BC_MOBILE_6B_CLOSURE.md` |
| BC-Mobile-6C Personalization | CLOSED (engineering) | `BC_MOBILE_6C_PERSONALIZATION_AUDIT.md` |
| BC-Mobile-7A Community Foundation | CLOSED (engineering) | `BC_MOBILE_7A_CLOSURE_REPORT.md` |
| BC-Mobile-7B Community Events & Opportunities | CONDITIONAL PASS — engineering complete, UAT open | `BC_MOBILE_7B_CLOSURE_REPORT.md` |

## Outstanding UAT gates (commercial release blockers)

| Gate | Scope | Status |
|---|---|---|
| STAGING ENVIRONMENT | Dự án Supabase staging tách biệt + frontend staging + USER_A/B/C (BC-INFRA-STG-01) | OPEN |
| OCR / device / browser | Card scan on physical devices & target browsers | OPEN |
| Physical NFC | Real tag write + tap on physical devices | OPEN |
| Public Card device | Public card rendering/save-contact on devices | OPEN |
| Two-user Connection | Live two-account handshake UAT | OPEN |
| Relationship Intelligence | 6A/6B/6C interactive UAT | OPEN |
| Community | 7A directory/profile/connect interactive UAT | OPEN |
| Community Events/Opportunities | 7B list/detail, register, check-in handoff, interest, account-switch spot check on device | OPEN |

## Feature freeze

**BUSINESS CONNECT V1.0 FEATURE FREEZE = ACTIVE** (since BC-Mobile-7B
closure).

Not started without explicit release-governance approval: Community Feed,
Community AI, Opportunity Matching, Event Recommendations, Marketplace,
Referral, Invitation, Chat, AI Chat, Follow, new business domains.

## RC1 CLOSURE (2026-08-11)
- [x] RC1 security closure — S0-01 AI endpoint auth (PASS)
- [x] RC1 internal-job closure — S2-01 cron secret (PASS)
- [x] RC1 test baseline green — 0 lỗi chạy được cục bộ
- [x] RC1 lint green — 0 error
- [x] tsgo / i18n / production build PASS
- [ ] Device & browser matrix (OPEN → RC2)
- [ ] Staging authenticated E2E / UAT (OPEN → RC2)

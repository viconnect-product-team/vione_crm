# BC-Mobile-1A — Executive Home Acceptance Gate

**Date:** 2026-08-09
**Status:** PASSED

## Delivered

| Requirement | Evidence |
|---|---|
| Real data contracts verified BEFORE UI | `docs/business-connect/mobile/BC_MOBILE_1A_HOME_DATA_CONTRACT.md` — every source verified against source code, marked LIVE_REUSABLE / NOT_USED / NOT_AVAILABLE |
| Thin client-safe composition hook | `src/hooks/use-business-connect-home.ts` — aggregates identity, Work Hub, unread count; no backend, no RLS bypass, no mocks |
| Greeting (localized daypart + name) | `ExecutiveHome.tsx` `Greeting` — `bc.mobile.home.greeting.{morning,afternoon,evening}` + authenticated display name |
| Today section, max 3 items | `selectTodayItems` — frozen category precedence, server order, `dedupeKey` dedupe, cap 3 |
| Empty / Loading / Error states | Quiet skeleton (`role="status"`), retryable core error (`role="alert"`), independent Today degradation, "All quiet today" empty state |
| Single global V via context | `src/hooks/use-v-sheet.ts` + `VSheetContext.Provider` in the 0B shell — Home CTA opens the ONE global sheet, no second implementation |
| Identity-scoped query keys | `bcMobileHomeKeys.home(viewerUserId)` — account switch ⇒ new key ⇒ no cross-account cache |
| Notification badge only when true | `NotificationBell` — badge from real unread count only; `null` (source unavailable) ⇒ NO badge |
| Privacy boundary | Composition touches identity + Work Hub + unread count only; no relationship-memory, no private notes, no score internals |
| No dashboard patterns | No KPI tiles, charts, carousels, news feed, FAB, or fake activity |
| i18n | 16 new keys under `bc.mobile.home.*`, vi + en; zero hardcoded strings |

## Test evidence

`src/__tests__/business-connect-mobile-home.bcm1a.test.tsx` — 26 tests, all passing:
- 6 Today-selection policy tests (precedence, cap 3, dedupe, no fabrication, secondary fill, kind mapping)
- 2 greeting / query-key contract tests
- 3 TodayItem semantics tests (link vs static, non-color urgency text cue)
- 8 Executive Home state tests (skeleton, greeting, list, empty, core error retry, partial degradation, badge truthfulness ×2)
- 1 V-integration test (empty-state CTA opens the ONE global sheet, no navigation)
- 2 axe audits (populated + empty states, zero violations)
- 4 structural boundary tests (no server fns / .server imports, no mock imports, eslint coverage, contract doc exists)

Regression: `business-connect-mobile-shell.bcm0b.test.tsx` — 18/18 still passing after the shell context change.

**Total: 44/44 passing.**

## Structural notes

- `src/routes/connect-app.index.tsx` no longer renders any placeholder copy (`bc.mobile.placeholder.*`); the route renders `ExecutiveHome` inside `MobilePage` with `noindex` head metadata.
- The eslint BC-mobile boundary (`eslint.config.js`) now covers both new hooks — `.server` modules, the privileged client, and mock data cannot enter this graph at lint time.
- Pre-existing build blocker fixed in passing: `account-settings.tsx` navigation to `/voting` now supplies the route's required search params.

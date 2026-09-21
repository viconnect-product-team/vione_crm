# BC-Mobile-0A — Foundation Audit + Mobile IA Freeze

**Status:** CLOSED / GO
**Date:** 2026-08-09
**Scope:** Audit + architecture foundation only. No runtime production code changed. No backend/schema behavior changed.

Frozen mobile IA: **Trang chủ · Network · V · Cộng đồng · Tôi** (Home · Network · V · Community · Me). The center **V** is a signature global interaction button, not a route tab.

---

## 1. Current architecture

TanStack Start v1 (React 19, Vite 7, Cloudflare Worker target) + Lovable Cloud (Supabase) backend.

| Layer | Location | Notes |
|---|---|---|
| Root providers | `src/routes/__root.tsx:10,154,217-225` | `QueryClientProvider` (single `makeQueryClient`), `ThemeProvider` (light/dark/contrast), Lang context, `registerServiceWorker()` at `:158`, manifest link at `:112` |
| Server-fn auth | `src/start.ts`, `src/integrations/supabase/auth-attacher.ts` | `functionMiddleware: [attachSupabaseAuth]` — bearer token attached client-side |
| Auth middleware | `src/integrations/supabase/auth-middleware.ts` | `requireSupabaseAuth` for protected server fns |
| i18n | `src/lib/i18n.ts` (8167 lines) | Single typed `translations` object, `TKey`, `LangContext`, `useT()`, `useFmt()`; VI default + EN; guard script `scripts/check-i18n.mjs` |
| Theme | `src/lib/theme.tsx`, `src/styles.css` | Semantic tokens (`--background`, `--primary`, …) + legacy `--vba-*` alias layer (`src/styles.css:247-260`) that maps VBA names onto semantic tokens |
| PWA | `vite.config.ts` (VitePWA), `src/lib/register-sw.ts`, `public/manifest.webmanifest` | See §10 |

**Provider reuse verdict:** the mobile shell must NOT add its own QueryClient, auth, theme, or i18n provider — all are already at `__root`. Confirmed safe.

## 2. Current `/m` (Member PWA) architecture

**Route tree — 22 files, all live:**

```text
src/routes/m.tsx                 root layout: ssr:false, beforeLoad → supabase.auth.getUser(),
                                  redirect /auth (preserves deep-link via search.redirect);
                                  wraps everything in <MemberScreen>; daily renewal reminder
src/routes/m.index.tsx           member home
src/routes/m.card.tsx            member identity card + QR
src/routes/m.notifications.tsx   notifications (a11y contract: aria-live, role=list, aria-pressed)
src/routes/m.messages.tsx        messages
src/routes/m.events.tsx          events
src/routes/m.history.tsx         activity history
src/routes/m.library.tsx         content library
src/routes/m.members.tsx         member directory
src/routes/m.news.tsx            news
src/routes/m.opportunities.tsx   opportunities
src/routes/m.perks.tsx / m.perks.$id.tsx
src/routes/m.products.tsx        marketplace
src/routes/m.profile.tsx         profile
src/routes/m.renew.tsx / .pay / .result / .history / .audit
src/routes/m.checkin.tsx         event check-in
src/routes/m.business-cards.tsx  saved business cards
```

**Shell:** `src/components/member/MemberShell.tsx`
- `MemberScreen` — 480px-constrained mobile container + `OfflineBanner` (navigator.onLine)
- `MemberHeader` — sticky top bar, back via `window.history.back()`
- `MemberTabBar` — fixed bottom nav, 5 tabs: Home `/m`, Notifications `/m/notifications`, center gold QR button `/m/card`, Messages `/m/messages`, Profile `/m/profile`. Styled with `--vba-*` variables and `.vba-gold-grad`.

**Data layer:** `src/lib/member-app/*.functions.ts` (12 modules) via barrel `src/lib/member-app.functions.ts`; fetched client-side on mount via `src/hooks/use-server-data.ts` (no protected loaders — SSR would 401). Association coupling lives in `src/lib/member-app/shared.ts: resolveAssociationId` (RPC `current_association_id` → `members` → `memberships` fallback).

**Auth guard pattern (reusable):** `ssr: false` + `beforeLoad` with `supabase.auth.getUser()` + `redirect({ to: "/auth", search: { redirect: location.href } })`. Identical pattern already used by `src/routes/connect.tsx:8-15`. This is the pattern to clone for `/connect-app`.

## 3. Current Business Connect architecture

**Route surfaces:**
- `/business-connect/*` — `src/routes/business-connect.tsx` layout (AppShell + top tab nav, `ssr:false`): index, my-card, saved-cards, connections (+`$personNodeId`), meetings (+index, `$meetingId`), memory, notifications, relationship-timeline, introductions.* (inbox/requests/deliveries/outcomes/analytics/`$targetPersonNodeId`).
- `/connect/*` — `src/routes/connect.tsx` layout (own lightweight header, auth guard, `ssr:false`): cards.index, cards.`$cardId`.edit, meetings.`$section`, network.connections / network.requests.incoming / network.requests.sent / network.notifications, calendar-settings.
- `/b/$slug` — public business card view (`getPublicBusinessCardFn`, public, no auth).
- `/h/$slug` — association landing; `/company/$slug` — company profile.

**Backend contracts (all FROZEN for BC-Mobile-0, all reusable from a mobile shell):**

| Domain | Entry point | Auth | Notes |
|---|---|---|---|
| Platform identity | `src/lib/identity/platform-identity.functions.ts` | `requireSupabaseAuth` ×5 | `user_profiles`, association contexts |
| Global network | `GlobalNetworkSDK` (`src/lib/global-network/network.sdk.ts`) via `src/hooks/use-global-network.ts` | authed fns | Hook is the ONLY sanctioned UI path; privacy-safe `CounterpartSummary` |
| Network notifications | `src/hooks/use-network-notifications.ts` | authed | optimistic mark-read |
| Business cards | `src/lib/business-card/business-card.sdk.ts`, `saved-card.sdk.ts`, `profile-connect.sdk.ts` | authed fns | saved cards, collections, tags |
| Meetings | `MeetingWorkspaceSDK` (`src/lib/meeting/workspace/sdk.ts`) — frozen read-only; mutations in MeetingSDK / MeetingCalendarSDK | authed | summary/list/detail/timeline |
| BC notifications | `NotificationOrchestrationSDK` via `src/hooks/use-bc-notifications.ts` | authed | React Query, frozen PII-free query keys, 30+ kinds |
| Relationship memory | `src/lib/business-connect/relationship-memory/` + `src/hooks/use-relationship-memory*.ts` | authed | private notes excluded (see §11) |
| Intelligence (AI) | `src/lib/business-connect/intelligence/sdk.ts`, `model-routing.ts`, `redaction.ts` | authed | governed, private-note exclusion frozen |
| Viewer identity | `src/hooks/use-viewer-user-id.ts` | local supabase auth | client-side user id, null-safe |
| Unread badge | `src/hooks/use-unread-notifications.ts` | authed fn | `vba.notif.lastSeenAt` localStorage seen-marker |

**Member-app functions** (`src/lib/member-app/*`) are association-scoped; they are NOT the Business Connect data path for `/connect-app` except where explicitly member-card related.

## 4. Legacy coupling matrix

| Finding | Evidence | Class |
|---|---|---|
| `--vba-*` CSS variables | Defined `src/styles.css:247-260` as **aliases over semantic tokens**; consumed by 36 files (all `/m/*`, `b.$slug`, `card.$code`, `company.$slug`, install, member components) | SAFE_REUSE (alias layer is theme-safe) — but new BC shell must use new `--bc-*` tokens, never `--vba-*` |
| `.vba-app` / `.vba-gold-grad` classes | `src/styles.css`, MemberShell, install | LEGACY_COMPAT |
| VBA branding (names, copy) | `public/manifest.webmanifest`, `src/routes/install.tsx`, landing | MUST_REPLACE only at PWA cutover (§10); untouched this turn |
| `MemberTabBar` hardcoded tabs | `src/components/member/MemberShell.tsx:81-87` | LEGACY_COMPAT — `/connect-app` gets its own nav; do not refactor shared file |
| Hardcoded `CURRENT_USER_ID` | `src/lib/networking-data.ts` → consumed by `src/routes/network.tsx:41,336,465,536,1028`, `opportunities.tsx:38,74,482,508`, `opportunities.$id.tsx:29` | MUST_REPLACE — but confined to legacy **admin** networking screens still on mock data; NOT in the `/connect-app` reuse path. No action this turn |
| Mock `*-data.ts` modules | 8 modules blocked by ESLint `no-restricted-imports` (`eslint.config.js:12-19,46`); residual importers: `fees.tsx`, `fees.$invoiceId.tsx`, `segments.tsx`, `news.tsx`, `renewal.tsx`, `network.tsx`, `opportunities*.tsx` (all admin screens) | LEGACY_COMPAT — none are importable from `/connect-app` (ESLint enforces) |
| localStorage canonical state | `vba.notif.lastSeenAt` (`use-unread-notifications.ts:5`), `vba.renewal.reminderCheckedAt` (`m.tsx:24`), theme/locale/prefs keys | SAFE_REUSE — all are UI prefs/seen-markers, not business state |
| `resolveAssociationId` association assumption | `src/lib/member-app/shared.ts` | LEGACY_COMPAT — member-app domain only; `/connect-app` must use platform-identity fns instead |
| `.server` / service-role imports in client graph | grep of `src/routes/`, `src/components/`, `src/hooks/`: **zero** client imports of `client.server` or `*.server`; only dynamic `await import()` inside `/api/public/hooks/*` server handlers | SAFE_REUSE (boundary is clean) |
| `MockModeBanner` | mounted once in `__root.tsx` | SAFE_REUSE |

**No BLOCKER-class findings.**

## 5. Target route architecture (FROZEN)

```text
src/routes/connect-app.tsx             layout: ssr:false, auth guard (clone of connect.tsx pattern),
                                        renders BusinessConnectMobileShell + <Outlet/>
src/routes/connect-app.index.tsx       Trang chủ / Home        — placeholder surface (0B)
src/routes/connect-app.network.tsx     Network                 — placeholder surface (0B)
src/routes/connect-app.community.tsx   Cộng đồng / Community   — placeholder surface (0B)
src/routes/connect-app.me.tsx          Tôi / Me                — placeholder surface (0B)
```

Reserved (not created in 0B): `/connect-app/network/$personId`, `/connect-app/community/$communityId`, `/connect-app/me/card`.

Legacy `/m/*`, `/connect/*`, `/business-connect/*` remain fully functional — no deletes, no redirects.

## 6. Target component architecture (FROZEN)

Boundary validated against repo convention: `src/components/business-connect/` already holds domain UI with subfolders (`introduction/`, `meeting/`, `notification/`, `relationship-memory/`, `timeline/`, `work-hub/`). A `mobile/` subfolder is the consistent placement — it keeps BC mobile UI inside its domain, out of the association-coupled `src/components/member/` and the admin `src/components/dashboard/`.

```text
src/components/business-connect/mobile/
  BusinessConnectMobileShell.tsx   480px container, offline banner (reuse pattern, own tokens)
  BusinessConnectTopBar.tsx        contextual title/actions, NO back-by-history default
  BusinessConnectBottomNav.tsx     exactly: Home · Network · V · Community · Me
  MobilePage.tsx                   page padding/scroll/empty-state scaffold
  VButton.tsx                      center global action button (champagne accent)
  VActionSheet.tsx                 action sheet for V capabilities
```

Rules: no new QueryClient/auth/theme/i18n providers; reuse `useT`/`useFmt`, `useViewerUserId`, domain hooks (`use-global-network`, `use-bc-notifications`, MeetingWorkspaceSDK façade). New `--bc-*` design tokens added to `src/styles.css` (Executive Minimal Luxury palette, §7) alongside — not replacing — `--vba-*`.

## 7. Design direction (FROZEN, tokens deferred to 0B)

Executive Minimal Luxury. Palette: `#071A2E` BC Navy, `#04111F` Deep Navy, `#F7F5F0` Ivory, `#FFFFFF` Surface, `#C9A35B` Champagne, `#E8D7B2` Soft Champagne, `#101828` Primary Text, `#667085` Secondary Text, `#E8E6E1` Border. Whitespace-first, max one dominant CTA per view, large readable type, restrained icons. Token registration (`--bc-*`) is safe to land with the shell in 0B.

## 8. Bottom nav contract (FROZEN)

Exactly five slots: **Home · Network · V · Community · Me**. Notifications and Messages are NOT tabs (they live behind top-bar affordances in 0B+). AI, QR, NFC are not tabs — they are V actions.

## 9. V capability matrix

| V action | Existing real flow | Verdict |
|---|---|---|
| Present QR | `QrCanvas` (`src/components/member/QrCanvas.tsx`), card preview at `/m/card`, `GlobalCardPreview` (`src/components/connect/GlobalCardPreview.tsx`) | PARTIAL — components reusable; BC-card presentation flow not wired to mobile shell yet |
| NFC | `src/lib/business-card-nfc.ts`, `src/hooks/use-nfc-scanner.ts` | PARTIAL — writer/scanner primitives exist; no BC mobile entry point |
| Scan QR | `src/hooks/use-qr-scanner.ts`, check-in `Scanner.tsx`, `FastScanModal.tsx` | LIVE_REUSABLE — scanner primitives work; target resolution (BC card vs member check-in) must branch in 0B+ |
| Scan Business Card | `src/lib/card-scan.ts` + `AiCardImportModal.tsx` (Gemini vision import, live provider) | LIVE_REUSABLE |
| Save Meeting Moment | meetings domain exists (`business_meetings`, outcomes, follow-ups); no moment-capture flow | NOT_IMPLEMENTED |

No missing business functionality built this turn.

## 10. PWA audit + migration matrix

Current state (`public/manifest.webmanifest`, `vite.config.ts`, `src/lib/register-sw.ts`, `src/routes/install.tsx`):

| Field | Current | Required for BC mobile PWA | Risk |
|---|---|---|---|
| name / short_name | "VBA — Hội viên…" / "VBA Hội viên" | Business Connect / ViOne naming | Installed apps cache name at install — existing installs keep old name |
| start_url | `/m` | `/connect-app` | **start_url is install-cached on iOS/Android — existing installs still land on `/m`; `/m` must stay live** |
| scope | `/` | keep `/` (covers both) | none |
| display / orientation | `standalone` / `portrait` | keep | none |
| theme/background | `#0a1834` (VBA navy) | `#071A2E` BC Navy | cosmetic, safe |
| icons | `/app-icon-192.png`, `/app-icon.png` (VBA-branded, both exist) | BC/ViOne official assets — **do not fabricate**; keep VBA icons until assets delivered | replacing without official art is forbidden |
| SW registration | `register-sw.ts` — PROD-only, refuses iframe/lovable previews, `?sw=off` kill switch, unregisters stale `/sw.js` in refused contexts | unchanged — fully compliant | none |
| Offline strategy | Workbox `generateSW`: NetworkFirst navigations (`vba-html`, 3s timeout, denylist `~oauth`+`/api/`), CacheFirst hashed assets (`vba-assets`), runtime cache for Supabase GETs | strategy reusable; cache names `vba-*` cosmetic | none |
| install page | `/install` VBA-branded QR install instructions | new BC install page later; keep `/install` | none |

**Cutover implication:** the safest path is a **second manifest** (e.g. `/manifest-bc.webmanifest`) linked only from `/connect-app` routes' head(), leaving the VBA manifest untouched for existing installs. Manifest swap decision belongs to a later turn with official assets.

## 11. Security structural audit

| Boundary | Evidence | Verdict |
|---|---|---|
| Service-role isolation | No client-reachable `client.server`/`*.server` imports; admin client only via `await import()` inside `/api/public/hooks/*` handlers | reusable as-is |
| Server-fn auth | `requireSupabaseAuth` middleware + `attachSupabaseAuth` client bearer (`src/start.ts`) | reusable as-is |
| Private relationship notes | `relationship-memory/eligibility.ts:19` excludes `business_meeting_private_notes`; `embedding-profile.ts` private-first provider rule; `candidate.ts:65-67` leakage regex (`private_note`, tokens, auth ids) | reusable as-is |
| AI context governance | `intelligence/context-policy.ts`, `redaction.ts`, BC-9.0 freeze (private notes excluded) | reusable as-is |
| RLS | all mobile-relevant fns run as the caller (RLS); no client-supplied user ids — identity from `context.userId` | reusable as-is |
| User-id source | `use-viewer-user-id.ts` derives from local session, never from route input | reuse pattern |

New risk introduced by `/connect-app`: **none structurally** — it is a presentation layer over authed fns. Standing rule for 0B+: no route param may be used as a user identifier in a query; counterpart data only via privacy-safe DTOs (`CounterpartSummary`).

## 12. Files proposed for BC-Mobile-0B

```text
src/routes/connect-app.tsx                          NEW
src/routes/connect-app.index.tsx                    NEW (placeholder)
src/routes/connect-app.network.tsx                  NEW (placeholder)
src/routes/connect-app.community.tsx                NEW (placeholder)
src/routes/connect-app.me.tsx                       NEW (placeholder)
src/components/business-connect/mobile/BusinessConnectMobileShell.tsx   NEW
src/components/business-connect/mobile/BusinessConnectTopBar.tsx        NEW
src/components/business-connect/mobile/BusinessConnectBottomNav.tsx     NEW
src/components/business-connect/mobile/MobilePage.tsx                   NEW
src/components/business-connect/mobile/VButton.tsx                      NEW
src/components/business-connect/mobile/VActionSheet.tsx                 NEW
src/styles.css                                      EDIT (append --bc-* tokens only)
src/lib/i18n.ts                                     EDIT (append bcapp.* keys, vi+en)
src/__tests__/business-connect-mobile-shell.bcm0b.test.tsx              NEW (nav contract, no-mock, a11y)
```

No edits to: `__root.tsx`, `src/start.ts`, manifest, `register-sw.ts`, `vite.config.ts`, any `.server.ts`, any migration.

## 13. Baseline proof (this turn changed no runtime code)

- Typecheck (`tsgo --noEmit`): **1 pre-existing error** — `src/routes/account-settings.tsx:88` (`/voting` navigate missing required `search`). Unrelated to this audit; present before BC-Mobile-0A.
- Structural tests: **68/68 passing** across `platform-identity.contract`, `identity-bridge.contract`, `member-pwa-no-mock-imports.p0a1`, `security-hardening`, `test-env-guard`.

## 14. Blockers

None.

- Current mobile architecture mapped (§2)
- Legacy dependencies identified, no BLOCKER class (§4)
- Production backend reuse map exists (§3)
- Target routes frozen (§5)
- Target shell boundary frozen and validated against repo convention (§6)
- PWA cutover implications known, incl. install-cached `start_url` (§10)
- No backend/schema behavior changed

**BC-Mobile-0A — CLOSED / GO.** Stop here; BC-Mobile-0B requires a new instruction.

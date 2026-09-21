# BC-Mobile-1B — Executive Home Visual Gate

**Verdict: BC-Mobile-1B — CLOSED / GO**

Scope: visual and interaction polish of `/connect-app` Home only. All
BC-Mobile-1A runtime and data contracts are frozen and unchanged.

## Explicitly unchanged (1A contracts)

- `useBusinessConnectHome()` data semantics, source APIs, query-key scoping
- Work Hub priority ordering (`overdue → needs_action → due_soon → upcoming → waiting → recent`)
- Max 3 Today items (`BC_MOBILE_HOME_MAX_TODAY_ITEMS === 3`)
- Unread-count logic (badge only from live count; `null` → no indicator; `>9` → `9+`)
- V sheet architecture (one global sheet via `VSheetContext`)
- Auth guard, backend, database, RLS — untouched
- No new Home sections: exactly one `<section>` (Today). No KPI cards, charts,
  carousels, quick-action grids, feeds, or AI dashboard elements.

## Changed components

| File | Change |
| --- | --- |
| `ExecutiveHome.tsx` | Header, greeting, Today list, empty/error states, skeleton, V text action |
| `TodayItem.tsx` | Editorial row, overdue dot, press scale |
| `src/styles.css` | `--bc-mobile-ivory` token (was referenced but undefined — latent 1A bug), `bc-home-enter` 160ms transition + reduced-motion override |
| `src/lib/i18n.ts` | `bc.mobile.home.empty.cta` copy → "Mở V để kết nối" / "Open V to connect" |
| `bcm1a.test.tsx` | Two assertions updated for the new CTA copy |
| `bcm1b.test.tsx` | NEW — 21 visual/structural contract tests |
| `bcm0b.test.tsx` | Prettier formatting only (pre-existing lint error fixed) |

## Visual hierarchy

- **Header**: 40px circular avatar (plain crop, no ring; navy initials fallback)
  in a 44px touch target; quiet outline bell (`strokeWidth 1.6`) in a 44px
  target; unread indicator is a tiny 16px champagne badge (micro accent,
  legible on both light and dark token sets).
- **Greeting**: daypart line is secondary (14px muted); name is primary
  (28px semibold, navy/dark text, no gold). Compact top offset (`mt-5`) keeps
  Today above the fold on 390×844.
- **Today**: 12px uppercase muted section heading, 32px whitespace before the
  list, hairline `divide-y` separators. No container card, no per-item
  elevated cards, no colored row backgrounds.
- **Today rows**: icon chip (40px, `surface-2`) → one-line primary (15px
  medium, truncated) → one-line context (13px muted: text urgency cue ·
  time · counterpart). Chevron only when routable. Genuinely overdue rows add
  a 6px danger dot alongside the text cue — never whole-row color. Gold never
  signals urgency.
- **V home entry**: secondary text action ("Mở V để kết nối") with a small
  champagne-ring V marker. No second floating gold button; opens the single
  global V sheet.
- **Empty state**: whitespace-first (no card, no dashed border, no shadow) —
  calm `CircleCheck` icon in a soft circle, title, one-line body, subtle V
  text action.

## Spacing decisions

- Page horizontal padding: 20px (`MobilePage`, frozen shell scale)
- Greeting top: 20px; greeting → Today: 32px (`mt-8`)
- Today rows: 16px vertical (`py-4`), 14px icon gap (`gap-3.5`)
- Dividers: `var(--bc-mobile-border)` hairline, low contrast in both modes

## Motion

- `bc-home-enter`: 160ms ease-out fade/rise on content state change
- Actionable rows: `active:scale-[0.99]`, 150ms
- Everything disabled under `prefers-reduced-motion` (dedicated media query
  plus existing `.bc-app` guard)

## Loading

Shell and bottom nav stay interactive. Skeleton mirrors the final layout:
greeting lines + two divided Today rows, `aria-busy`, `motion-reduce:animate-none`.

## Dark mode proof

Home consumes only `--bc-mobile-*` tokens; the `.dark .bc-app` override block
covers every surface token used (bg, surface, surface-2, text, muted, border,
accent, danger). No pure-black backgrounds. Structural test asserts the dark
token set exists and contains no `#000`. axe re-run under `class="dark"`.

## Responsive proof

480px shell frame preserved (`max-w-[480px]`, no sidebar, no bezel). Layout
uses only fluid primitives (flex, truncate, `min-w-0`) — no fixed widths that
could break 375/390/430/480px. Structural tests assert the frame and the
spacing scale.

## Accessibility

- axe: populated state (badge + list + V action) — **0 violations**
- axe: empty state under dark tokens — **0 violations**
- Unread indicator has accessible meaning via aria-label ("N chưa đọc")
- Non-actionable Today rows are static content, never fake buttons
- Visible focus rings on all interactive elements; reduced motion respected

## Tests

- `business-connect-mobile-home-visual.bcm1b.test.tsx` — **21 tests, all pass**
  (structure/no-dashboard-regression, header/greeting contract, item semantics,
  state visuals, motion/spacing/dark/responsive, axe)
- `business-connect-mobile-home.bcm1a.test.tsx` — **26 tests, all pass** (re-run)
- `business-connect-mobile-shell.bcm0b.test.tsx` — **18 tests, all pass** (re-run)

## Typecheck / lint

- `bunx tsgo --noEmit` — **0 errors**
- eslint on all touched files — **0 errors** (one pre-existing
  react-refresh warning in `VActionSheet.tsx` from BC-Mobile-0B, untouched
  per frozen V sheet architecture)

## Screenshots

Not captured: no authenticated session is available in this environment
(`LOVABLE_BROWSER_AUTH_STATUS=signed_out`). Per the 1B spec, auth was not
bypassed and no fake session was injected; the 65 passing tests above are the
authoritative proof.

## Gate

BC-Mobile-1B — **CLOSED / GO**: Executive Minimal Luxury achieved, 1A
data/runtime semantics unchanged, max 3 Today items unchanged, no additional
business sections, no dashboard-density regression, no mock data, shell + Home
regressions pass, axe pass, typecheck clean, lint clean (0 errors).

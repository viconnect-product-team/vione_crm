# BC-Mobile-0B — Design System + Mobile Shell + 5-Tab Navigation

Status: CLOSED / GO (pending user instruction for BC-Mobile-0C).
Scope of this turn: design tokens, shell components, frozen 5-position bottom
navigation, V button + truthful action sheet, placeholder routes, i18n, tests,
ESLint structural gates. **No** business logic, data fetching, connection
lists, home feeds, NFC/QR flows, or card rendering.

## Design system (new, parallel — legacy untouched)

All tokens live in `src/styles.css` under the `.bc-app` scope and are consumed
ONLY by `src/components/business-connect/mobile/*` (enforced by test +
ESLint). They never replace or alias the legacy `--vba-*` layer.

| token | light | dark | role |
|---|---|---|---|
| `--bc-mobile-bg` | `#F7F5F0` | `#04111F` | page background (warm off-white → navy deep) |
| `--bc-mobile-surface` | `#FFFFFF` | `#071A2E` | nav bar, top bar, sheet |
| `--bc-mobile-surface-2` | `#FBFAF7` | `#0B2238` | icon chips, badges, hover |
| `--bc-mobile-navy` | `#071A2E` | `#071A2E` | V button body, high-emphasis brand |
| `--bc-mobile-navy-deep` | `#04111F` | `#04111F` | deepest surface step |
| `--bc-mobile-text` | `#101828` | `#F5F3EE` | primary text |
| `--bc-mobile-muted` | `#667085` | `#9AA7B5` | secondary text / inactive tabs |
| `--bc-mobile-border` | `#E8E6E1` | `#1D3448` | hairline borders |
| `--bc-mobile-accent` | `#C9A35B` | `#D3B273` | champagne accent (V glyph, eyebrow, focus ring) |
| `--bc-mobile-accent-soft` | `#E8D7B2` | `#3A3222` | V button ring, offline banner |
| `--bc-mobile-success` | `#2F7D5B` | `#4CAF8B` | future success states |
| `--bc-mobile-danger` | `#B42318` | `#E0604F` | future destructive states |
| `--bc-mobile-radius-card` | `16px` | `16px` | card radius |
| `--bc-mobile-radius-sheet` | `24px` | `24px` | V sheet top radius |
| `--bc-mobile-shadow-nav` | soft navy | soft black | nav elevation (restrained) |
| `--bc-mobile-shadow-v` | soft navy | soft black | V button elevation (strongest shadow, still subtle) |
| `--bc-mobile-nav-h` | `64px` | `64px` | nav height contract |
| `--bc-mobile-safe-{top,right,bottom,left}` | `env(safe-area-inset-*)` | same | iPhone notch / home-indicator / landscape insets |

Language: Executive Minimal Luxury — warm neutrals, deep navy, restrained
champagne. One accent only. V owns the strongest (still soft) shadow; selected
tabs never compete with V. Dark + high-contrast variants provided; light and
dark body/foreground pairs meet WCAG AA. `prefers-reduced-motion` disables
drawer/sheet animation within `.bc-app`.

## Shell components (`src/components/business-connect/mobile/`)

| file | responsibility |
|---|---|
| `BusinessConnectMobileShell.tsx` | 480px mobile viewport, `.bc-app` token scope, offline banner, V sheet open state |
| `BusinessConnectBottomNav.tsx` | frozen 5-position grid: Home · Network · **V** · Community · Me; TanStack `<Link>` tabs with automatic `aria-current` |
| `BusinessConnectTopBar.tsx` | title / back / left / right slots; notifications NOT hardcoded (Home specializes later) |
| `MobilePage.tsx` | padding + safe-area + bottom-nav clearance scaffold |
| `VButton.tsx` | 56px navy/champagne signature; aria-label; never navigates |
| `VActionSheet.tsx` | Vaul drawer listing the 5 frozen capabilities with truthful states |

## Routes (new, additive)

| route | file | content |
|---|---|---|
| `/connect-app` | `connect-app.tsx` | auth-guarded layout (`ssr:false`, same pattern as `/m`), BC manifest link, shell + `<Outlet />` |
| `/connect-app` (index) | `connect-app.index.tsx` | Home placeholder ("Business Connect" + crafting subtitle) |
| `/connect-app/network` | `connect-app.network.tsx` | placeholder |
| `/connect-app/community` | `connect-app.community.tsx` | placeholder + explicit "coming soon" badge (never fakes communities) |
| `/connect-app/me` | `connect-app.me.tsx` | placeholder |

Every route has its own `head()` (title / description / og). Legacy `/m/*`,
`/business-connect/*`, `/connect/*` unchanged — MemberShell integrity is
asserted in tests.

## PWA

`public/manifest-bc.webmanifest` — name/short_name "Business Connect",
`start_url: /connect-app`, `theme_color: #071A2E`, `background_color: #F7F5F0`,
linked from the `/connect-app` route head only. No service-worker or offline
behavior changes (out of scope this turn).

## i18n

28 keys under `bc.mobile.*` (nav, V, sheet, 5 capabilities + descriptions,
placeholders, offline, back), all in VI + EN. Guarded by
`scripts/check-i18n.mjs`; type-safe through `TKey`.

## V action states (truthful)

| capability | backend primitive (0A) | in-shell destination | state this turn |
|---|---|---|---|
| Present QR | partial (`QrCanvas`, `/m/card`) | not yet | coming soon |
| NFC tap | partial (`use-nfc-scanner`) | not yet | coming soon |
| Scan QR | live-reusable (`use-qr-scanner`) | not yet | coming soon |
| Scan business card | live-reusable (AI import modal) | not yet | coming soon |
| Save meeting moment | not implemented | not yet | coming soon |

Rationale: no capability has a safe mobile-shell destination yet; ejecting the
user into a desktop surface would break the mobile promise. Each state is a
typed `VActionStatus = "available" | "soon"`; flipping to `available` is a
one-line change when BC-Mobile-1+ wires the destination.

## A11y

- Single labelled nav landmark (VI/EN); `aria-current="page"` on the active
  tab only.
- V button: accessible name, 56px (>52px contract), focus-visible champagne
  ring, no dead-end (opens sheet).
- V sheet: labelled dialog (title + description), 44px+ rows, named close
  button, dismisses via close button and Escape (keyboard path tested).
- axe-core audit passes on the shell.

## Tests & gates

`src/__tests__/business-connect-mobile-shell.bcm0b.test.tsx` (16 tests):

- UI: nav order/labels EN+VI, V center position, aria-current semantics,
  V ≥52px target, sheet capabilities + "coming soon" in EN+VI, close/Escape,
  non-navigation of V, axe audit.
- Structural: 6 frozen files exist; no `*.server` / service-role / mock
  imports and no `--vba-*` references in the BC mobile layer; tokens +
  safe-area registered in `styles.css`; 5 routes exist with `head()`; BC
  manifest shape; MemberShell untouched.
- ESLint (`eslint.config.js`): new `no-restricted-imports` boundary block for
  `src/components/business-connect/mobile/**` and `src/routes/connect-app*`
  (server modules, privileged server client, mock modules).

## Explicitly NOT done this turn

Connection lists, home feed, community backend, NFC/QR in-shell flows, card
rendering, notifications bell, deep-link convergence with `/m/*`, any change
to legacy shells/routes/tokens.

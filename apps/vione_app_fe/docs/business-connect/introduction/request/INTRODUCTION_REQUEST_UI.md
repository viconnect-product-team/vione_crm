# BC-6.2 — UI Surfaces

## Smart Introduction path card (`BestPathCard`)

- For `depth === 2` and non-blocked, non-already-connected pages, renders
  `RequestIntroductionButton`. The button is hidden for 3-hop paths so
  unsupported flows never leak into the UI.
- Uses `aria-label` naming the intermediary.

## Request dialog (`RequestIntroductionDialog`)

- shadcn `Dialog` (focus-trap + focus restore included).
- Optional plain-text note, 500-char max, live counter announced via
  `aria-live="polite"`.
- Submit calls `useSendIntroductionRequest` → `IntroductionRequestSDK.sendRequest`.
  Idempotency key derives from `pathId` + timestamp.
- Errors surface as `role="alert"` with i18n keys under `bc.introReq.err.*`.

## Workspace (`/business-connect/introductions/requests`)

- Two tabs — Incoming, Sent — via shadcn `Tabs`.
- Incoming rows show Accept / Decline while pending.
- Outgoing rows show Cancel while pending.
- Loading state via `aria-live="polite"`, empty state via dashed block copy.
- Route is `ssr: false` with `robots: noindex`.

## Invalidation matrix

| Action  | Invalidates                                                   |
| ------- | ------------------------------------------------------------- |
| send    | `['intro-request','outgoing']`, `state(pathId)`               |
| accept  | `['intro-request','incoming']`, `detail(id)`, `state(pathId)` |
| decline | `['intro-request','incoming']`, `detail(id)`, `state(pathId)` |
| cancel  | `['intro-request','outgoing']`, `detail(id)`, `state(pathId)` |

Never invalidates the whole app cache.

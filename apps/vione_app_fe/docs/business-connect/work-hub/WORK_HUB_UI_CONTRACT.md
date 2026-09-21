# Work Hub — UI Contract (BC-8.0)

## Route

`/business-connect` → `WorkHubPage`. This route replaces the former
Business Connect overview and is the single operational hub.

## Composition

- `WorkHubSummaryCards` — six counters, wired to `WorkHubSummaryDTO`.
- `WorkHubCategorySection` — one per non-empty category, in
  `WORK_HUB_CATEGORY_ORDER`.
- `WorkHubItemCard` — renders a single `WorkHubItemDTO`. Uses i18n
  keys from the DTO. Navigates via `<Link to>` + params; never
  constructs URLs by hand.

## Accessibility

- `aria-live="polite"` region wraps the summary/list, `aria-busy`
  tracks loading.
- Error state uses `role="alert"` with a retry button.
- All interactive elements have visible focus styles and keyboard
  activation (Enter / Space).

## i18n

All labels resolve through `useT()` — no hardcoded strings. VI/EN keys
for every category, urgency, item kind, and action live in
`src/lib/i18n.ts`.

## Freeze

UI depends only on `WorkHubItemDTO` / `WorkHubSummaryDTO`. Additional
fields require a version bump.

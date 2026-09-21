# Accessibility contract checklist (member screens)

Applies to list-based member (`/m/*`) screens. Enforced by CI via
`*a11y*.e2e.test.tsx` (see `.github/workflows/deploy.yml`).

## List regions

- The scrollable list container has `role="list"`, `aria-live="polite"`,
  `aria-busy={loading}`, and an `aria-label`.
- Each row is a `role="listitem"`. When the row is a `<button>`/`<a>`, wrap it
  in a `<div role="listitem">` — `listitem` is not an allowed role on
  interactive elements (axe `aria-allowed-role`).

## Announcements

- A visually-hidden (`sr-only`) `role="status"` `aria-live="polite"` element
  reports the current item count and flips to a loading message while fetching.
- `data-testid="<screen>-announcement"` is used by the e2e tests.

## i18n

- Announcement copy uses `m.<screen>.announce.count` / `.loading` keys, present
  in both `vi` and `en`. Guarded by `scripts/check-i18n.mjs` at prebuild.

## Screens covered

- Notifications — `src/routes/m.notifications.tsx`
- Events — `src/routes/m.events.tsx`
- Members — `src/routes/m.members.tsx`
- Messages — `src/routes/m.messages.tsx`

## Automated audits

Each suite runs `axe-core` (via `jest-axe`) after load. `color-contrast` and
`region` rules are disabled in jsdom (no layout engine / single-root render).

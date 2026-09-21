# BC-3.1C — Privacy & Accessibility Review

## Privacy

- **Counterpart projection is PUBLIC-only.** `resolvePublicCounterpartsFn`
  reads `member_business_cards` gated by `public_mode`/`status` and returns
  only: display name, headline, company name, avatar URL, public card slug.
  No email, phone, private notes, or internal ids beyond `userId` leak.
- **No client-supplied identity.** All participant scoping is server-resolved
  via `requireSupabaseAuth`; the client never passes its own user id.
- **Error opacity.** Only stable `NETWORK_*` domain codes cross the boundary;
  raw Postgres/RLS text is never surfaced (see error-messages.ts).
- **Profile links** point at the public route `/b/$slug` only when a public
  slug exists; otherwise the "View profile" affordance is omitted.

## Accessibility

- **Live regions.** Refresh status uses `role="status"` + `aria-live="polite"`;
  the list carries `aria-busy` during background refresh.
- **Semantic lists.** Rows render as `<ul>`/`<li>` with an `aria-label`ed list.
- **Keyboard.** All actions are real `<button>`/`<Link>` elements with
  `focus-visible:ring-2 focus-visible:ring-ring`; no click-only `div`s.
- **Icon-only avatars** use `aria-hidden` on the fallback glyph and `alt=""`
  on decorative images.
- **Destructive confirmation.** Disconnect is confirmed before mutating.
- **Contrast.** Only design-system tokens (`text-foreground`,
  `text-muted-foreground`, `bg-card`, `bg-muted`) — no arbitrary low-contrast
  colors.
- **State clarity.** Loading (skeleton), empty (section-specific copy), and
  error (retry) states are all distinct and announced.

## Result

No private data paths in the UI; the surface meets the project a11y checklist
(keyboard, live regions, semantic structure, contrast).

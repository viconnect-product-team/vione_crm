# BC-3.1 — Saved Business Cards Library UI

**Architecture:** Business Connect v1 — Frozen
**Prerequisite:** BC-3.0 Saved Business Cards Foundation — GO
**Scope:** UI + client integration only. No schema, RLS, contract, or networking changes.

## Data access boundary

All reads/mutations flow through `SavedCardSDK` via the client hooks in
`src/hooks/use-saved-cards.ts`. No component, hook, or route touches
`saved_business_cards`, `saved_card_collections`, `saved_card_tags`,
`saved_business_card_tags`, or `member_business_cards` directly.

```
route/components → use-saved-cards hooks → SavedCardSDK → server functions → RLS
```

Canonical card data is never copied into local state as a new source of truth —
the SDK result set is the only source, refined client-side for sort/section.

## Files

| File                                                   | Role                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `src/lib/business-card/saved-card.search.ts`           | Canonical route-search contract, zod schema, normalizers, single default object |
| `src/hooks/use-saved-cards.ts`                         | Query keys, SDK query mapping, client refinement, read + mutation hooks         |
| `src/components/business-connect/SavedCardItem.tsx`    | Card tile/row (grid + list), favorite toggle, action menu                       |
| `src/components/business-connect/SavedCardDialogs.tsx` | Notes, Tags, Move, Remove, Create-collection dialogs                            |
| `src/routes/connect.saved-cards.tsx`                   | `/connect/saved-cards` library screen                                           |
| `src/__tests__/saved-cards-library.bc31.test.ts`       | Deterministic contract + refinement tests                                       |

## Capabilities delivered

- View saved cards (grid/list toggle)
- Search + filter (text, tags, availability, source, sort)
- Sections: All, Favorites, Recent, Frequently viewed, Archived
- Custom collections sidebar + move-to-collection
- Favorite / unfavorite (`aria-pressed`)
- Archive / restore
- Add/remove private tags
- Edit private notes
- Remove saved reference (owner edge only; canonical card untouched)
- Open tracking via `SavedCardSDK.recordOpen`
- Inaccessible cards render a safe "unavailable" placeholder — no private fields leaked

## Privacy invariants

Private notes and tags appear only inside the owner-authenticated library and
its dialogs. They never enter:

- the URL / route search params (only approved search input is keyed)
- the page `<title>`
- share/public card views (`/b/$slug`)
- telemetry / analytics payloads

## Availability mapping

The frozen contract exposes a binary `available | unavailable`
(`availabilityOf`). The UI maps every unresolvable target to the "unavailable"
placeholder and hides all interaction except archive/restore/remove.

## Accessibility

- Section + view + favorite controls expose `aria-pressed`
- Result list uses `role="list"`; live count via `aria-live="polite"`
  (`data-testid="sc-announcement"`)
- `aria-busy` on the results region during refetch/mutation
- Icon-only buttons carry `aria-label`; tags removable via keyboard

## Out of scope (per spec)

No schema/RLS/RPC/authorization changes, no AI, offline sync, QR/NFC, CRM, or
networking logic. STOP after BC-3.1.

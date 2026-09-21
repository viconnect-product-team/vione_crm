# BC-Mobile-2B — Network Visual Polish Gate

**Date:** 2026-08-09
**Scope:** Visual and interaction polish of `/connect-app/network` over the FROZEN BC-Mobile-2A runtime/data contract. No runtime, data, privacy, or navigation behavior changed.

**Verdict: BC-Mobile-2B — CLOSED / GO**

---

## 1. Runtime freeze proof (2A unchanged)

| Frozen behavior | Proof |
|---|---|
| Page size 25 | `BC_MOBILE_NETWORK_PAGE_SIZE === 25` asserted; `listAccepted` called with `{ limit: 25, offset: 0|25 }` |
| Debounce 300ms | `BC_MOBILE_NETWORK_SEARCH_DEBOUNCE_MS === 300` asserted; rapid typing → exactly one server search with final term |
| Bounded search fallback (4 pages / 100) | `BC_MOBILE_NETWORK_SEARCH_MAX_PAGES === 4` asserted |
| Search backend path | saved-card server search `{ text }` + client fallback on loaded connections (test: "search backend path unchanged") |
| DTO whitelist | exact 10-field key set asserted for both connection and saved-card DTOs |
| Privacy gate | notes/tags/labels/importance/priority/firstMetAt absent from DTO; "SECRET NOTE" never serialized or rendered |
| Inclusion / dedupe / connection priority | hook file untouched this turn (`src/hooks/use-business-connect-network.ts` — zero diff) |
| Viewer-scoped query keys | hook untouched; 2A account-switch test still passes |
| Route behavior | both route files untouched; row still targets `/connect-app/network/$personId` |

**Files changed (2B):** `src/components/business-connect/mobile/NetworkHome.tsx`, `src/components/business-connect/mobile/NetworkPersonRow.tsx`, `src/lib/i18n.ts` (+1 key: `bc.mobile.network.search.clear`), `src/__tests__/business-connect-mobile-network-visual.bcm2b.test.tsx` (new).
**Files deliberately untouched:** the network hook, both route files, `src/styles.css` (existing tokens sufficed), V sheet, shell.

## 2. Before → after UX summary

| Element | 2A | 2B |
|---|---|---|
| Title | 28px semibold, mt-5 | 28px semibold, mt-4 (more compact above the fold) |
| Search | 44px pill, surface only, native-only clear | 48px rounded-2xl with hairline border; explicit clear (✕) button appears only while a query exists, accessible name VI/EN |
| Person row | 44px avatar, 15px name, no trailing affordance, scale(0.99) press | 48px avatar, 16px semibold name (dominant), subtle visual-only chevron, min-height 76px, quiet background + scale(0.995) press at 150ms, reduced-motion safe |
| Load-more | text button | quiet muted text button in a reserved 52px slot (no layout jump on append) |
| Search-empty | message only | message + quiet "Xóa tìm kiếm" reset action (query stays visible until cleared) |
| Skeleton | 44px avatar bars, py-4 | mirrors final layout exactly: 48px avatar bars, min-height 76px rows |

## 3. List hierarchy (verified by tests)

1. **Name** — 16px semibold, `text-[var(--bc-mobile-text)]` — dominant.
2. **Title · Company** — 13px muted, single line, dangling `·` never rendered (title-only / company-only / neither cases tested).
3. **Context** — 12px muted, exactly ONE line per person, never a pill/chip, no colored background.

Divider: hairline `divide-[var(--bc-mobile-border)]`, no per-person card wrapper (structural source test: no Card import, no `shadow-`, no swipe/translateX behavior).

## 4. Avatar behavior

- Real avatar: clean circular crop (`rounded-full object-cover`), `alt=""` so screen readers hear only the row's accessible name (no duplicate announcement).
- Fallback: initials (first+last word) on restrained `--bc-mobile-surface-2` neutral surface — no random bright colors (test asserts no `bg-{red,blue,green,amber,purple,pink}-*` classes), no gold rings, no online-status dot.

## 5. Search treatment

Integrated into the page: 48px, soft neutral surface + hairline border, 15px input, search icon, focus-within 2px navy ring (accessible). No gold border, no heavy shadow, no oversized pill. Clear button: 36px circular ghost, `aria-label` "Xóa tìm kiếm"/"Clear search", only rendered while `term` is non-empty. Label `<label for="bc-network-search">` retained (sr-only).

## 6. Responsive proof

Stress fixture (28+ char name, 60+ char executive title, 60+ char company) renders with `truncate` on all three text lines — no horizontal overflow, no row-height explosion (min-height 76px, lines clamp). Viewport discipline inherited from the frozen 480px shell; row geometry is width-independent (flex + min-w-0), valid at 375/390/430/480px. Truncation classes asserted in tests.

## 7. Dark mode

No new color values introduced — every surface uses existing `--bc-mobile-*` tokens, which already define `.dark`/`.hc` variants (bg `#04111f`, surface-2 `#0b2238`, border `#1d3448` — no pure black slabs, no bright borders). Dark-surface render + axe test passes; pressed state (`active:bg-surface-2`) and fallback avatars resolve through tokens in both modes.

## 8. Accessibility

- axe = 0 on populated, empty, search-empty, and dark surfaces.
- Each row: exactly ONE link with `aria-label={name}`; chevron `aria-hidden`; zero nested buttons (tested).
- Search: sr-only label, clear button accessible name, `role="search"`.
- Focus: visible 2px navy ring on rows, clear button, load-more.
- Reduced motion: `motion-reduce:transition-none`, `motion-reduce:active:scale-100`, `motion-reduce:animate-none` (skeleton) — asserted.
- Contrast: text hierarchy uses only `--bc-mobile-text`/`--bc-mobile-muted` on ivory/deep-navy surfaces (AA pairs from the frozen token set).

## 9. Forbidden surfaces — verified absent

No tabs, filter chips, A–Z rail, KPI/count cards, connection-strength scores, heatmaps, sorting UI, quick-call/WhatsApp/Zalo buttons, follow-up buttons, more-menus, company filters, intelligence line (2A had none — still absent). Structural source tests guard NetworkHome/NetworkPersonRow against future reintroduction.

## 10. Tests

- New shard `src/__tests__/business-connect-mobile-network-visual.bcm2b.test.tsx`: **25/25 pass** (runtime freeze ×5, editorial row ×8, search ×2, content states ×4, forbidden surfaces ×3, i18n+axe ×2).
- Regression: 0B shell + 1A home + 1B home visual **65/65 pass**; 2A contract shard **26/26 pass**. Mobile suite total: **116/116**.

## 11. Typecheck + lint

- `tsgo --noEmit`: **0 errors**.
- `eslint` on all changed files: **0 errors, 0 warnings**.

## 12. Known limitations (unchanged from 2A)

- Connection search beyond the 100 most-recent records may miss deeper matches (no server contract exists) — documented in the 2A data contract, not patched with fabricated results.
- Saved-card library has no pagination contract (bounded by ownership, fetched once per term).
- Person Detail remains the reserved placeholder (BC-Mobile-2C+).

## 13. Screenshot evidence / limitation

**Not captured.** `LOVABLE_BROWSER_AUTH_STATUS = signed_out` in this session — no managed session exists, and `/connect-app/network` correctly redirects to `/auth` (verified: unauthenticated navigation lands on the login page, proving the auth wall holds). Per the 2B rules, auth was not bypassed and no fake production data was seeded. Visual verification is covered by 25 rendered-DOM tests including four axe surfaces; a 390px populated screenshot should be captured in a future session with an active sign-in.

---

**Exit gate checklist:** visibly simpler than a CRM list ✓ · name has highest hierarchy ✓ · search fast and clear ✓ · context secondary ✓ · zero new features ✓ · 2A runtime/semantics unchanged ✓ · privacy unchanged ✓ · regressions pass ✓ · axe = 0 ✓ · tsgo = 0 ✓ · lint = 0 ✓

**BC-Mobile-2B — CLOSED / GO**

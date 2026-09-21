# BC-Mobile-2A — Network Gate

**Status: CLOSED / GO** · Verdict: Network list contract, UI, and privacy boundary proven by 26/26 tests.

## Scope shipped

| Area | Evidence |
|---|---|
| Live data contract | `GlobalNetworkSDK.connections.listAccepted` (offset/limit, `updated_at desc`) ∪ `SavedCardSDK.search` (server text search). Documented in `BC_MOBILE_2A_NETWORK_DATA_CONTRACT.md`. |
| Inclusion rule | Accepted connections ∪ non-archived saved cards. Dedupe by public card slug — connection wins. No directory/tenant results. |
| Normalized DTO | `BcMobileNetworkPerson` — whitelist only: personId (`u:` / `c:`), relationshipId/kind, displayName, avatarUrl, headline, companyName, context, cardSlug, sortAt. No notes/tags/embeddings/AI internals. |
| Screen | `NetworkHome` — 28px title, quiet rounded search, editorial rows with hairline dividers (44px avatar, name, title · company, 1 context line). |
| Search | Server search for saved cards; truthful bounded fallback for connections (filters loaded pages, auto-fetches up to 4 pages / 100 records). 300ms debounce, diacritic-insensitive fold. |
| Pagination | Offset infinite loading, 25/page, "Xem thêm" load-more; short page ends the list. |
| States | Skeleton (title + search remain, role=status), elegant empty with "Mở V" action, quiet error without raw backend detail + retry. |
| Navigation | Rows link to `/connect-app/network/$personId` placeholder with back control and neutral "soon" state. |
| i18n | VI + EN via `bc.mobile.network.*` keys. |
| A11y | axe 0 violations on populated and empty states; role=searchbox, role=status, aria-live rows region. |

## Test proof

`src/__tests__/business-connect-mobile-network.bcm2a.test.tsx` — **26/26 passing**:

- **DTO (3):** exact whitelist keys, private-field exclusion (notes/tags/labels/importance never in DTO, never serialized), null-timestamp context.
- **Inclusion (2):** slug dedupe (connection wins), recency-desc ordering.
- **Search (3):** case/diacritic fold, display-safe field matching, viewer-scoped query keys.
- **Screen (12):** live render, notes never rendered, empty state + Mở V, loading skeleton, error + retry, server search + bounded fallback, single debounced server call, empty-search state, bounded pagination, row navigation href, account-switch refetch under new viewer key, EN render.
- **A11y (1):** axe populated + empty.
- **Structural (5):** no `.server` / `client.server` / `service_role` / mock `*-data` imports in hook, 2 components, 2 routes.

## Guardrails preserved

- No mutation verbs — read-only surface; Mở V is a UI affordance only.
- Account-switch isolation via viewer-scoped query keys (`["bc-mobile","network", viewerKey, …]`).
- Error UI never leaks raw backend messages.

## Regression

Mobile suite (0B shell, 1A home, 1B visual, 2A network) green; no changes to frozen BC-Mobile-0A/0B/1A/1B surfaces.

**BC-Mobile-2A — CLOSED / GO**

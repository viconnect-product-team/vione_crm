# BC-Mobile-2A — Network Data Contract Verification

**Date:** 2026-08-09
**Scope:** Verification of real, callable, client-safe data boundaries for `/connect-app/network` BEFORE any UI was written. Every row below was verified against source (call chain + input authority + output shape), not inferred from names.

## Verified contracts

| Need | Existing source | Callable boundary | Input | Output | Pagination | Search | Viewer scope | Status |
|---|---|---|---|---|---|---|---|---|
| Established relationships (accepted connections) | Global Business Networking (BC-3.1A/B) | `GlobalNetworkSDK.connections.listAccepted` → `listConnectionsFn` (`src/lib/global-network.functions.ts:152`) → `GlobalConnectionService.listConnections` (`service.ts:283`) → `GlobalConnectionRepository.listAccepted` | `{ limit?: 1..100, offset?: >=0 }` (zod-validated) | `GlobalConnectionDTO[]` (direction-aware, participant-scoped; no pair internals) | **Offset** (`repository.ts:29-31`, default 50, max 100), ordered `updated_at desc` (`repository.ts:173`) | none | `requireSupabaseAuth` + `requireGlobalNetworkUser(context.userId)`; RLS as caller | **LIVE_REUSABLE** |
| Counterpart public identity (name, avatar, title, company, card slug) | Global Networking counterpart projection (BC-3.1C) | `GlobalNetworkSDK.counterparts.resolvePublic` → `resolvePublicCounterpartsFn` | `{ userIds: string[] }` (batch) | `CounterpartSummary[]` — `displayName/avatarUrl/headline/companyName/primaryCardSlug` only (`types.ts:129-136`) | n/a | n/a | authed fn; public-safe projection | **LIVE_REUSABLE** |
| Saved-card relationships (owner's relationship edges, BC-2.4) | Saved Cards organization layer (BC-3.0/3.1) | `SavedCardSDK.search` → `searchSavedCardsFn` (`saved-card.functions.ts:110`) → `SavedCardService.search` (`saved-card.service.ts:188`) | `SavedCardSearchQuery { text?, favorite?, archived?... }` | `SavedCard[]` — edge + live `target` summary (`SavedCardTarget`: displayName, professionalTitle, companyName, avatarUrl, slug, unavailable) | none (caller's own library, bounded by ownership) | **server-side text** over name/company/title/industry/tags/notes (owner-only rows) | authed fn; owner = `context.userId`; RLS as caller | **LIVE_REUSABLE** |
| Server-side search across connections | — | — | — | — | — | — | — | **NOT_AVAILABLE** — no search predicate exists on the connections repository/service/fn chain. Truthful bounded fallback (below). |
| Intelligence line (recommendations, BC-4.5) | `RelationshipGraphSDK.recommendConnections` via `use-recommendations.ts` | requires `sourceNodeId` (person node resolution) | cursor page | `RecommendationPageDTO` | cursor | n/a | authed | **NOT_USED** — recommendation DTO is *discovery* (people you may know), not Network (people you have a relationship with). Rendering it above the Network list would blur the frozen Network/discovery boundary (spec §12/§16). Omitted. |
| Person detail data | — | `/connect-app/network/$personId` placeholder route only | — | — | — | — | — | **DEFERRED** to BC-Mobile-2C+ |
| Private relationship memory / notes display | relationship-memory domain, `SavedCard.notes` | — | — | — | — | — | owner-only | **NOT_AVAILABLE** to the list UI by design (privacy freeze). Notes are never mapped into the mobile DTO. |
| Viewer user id (query-key scoping) | `useViewerUserId` (`src/hooks/use-viewer-user-id.ts`) | local session | — | `string \| null` | — | — | client session only, never route input | **LIVE_REUSABLE** (cache-key scoping only) |

## Network inclusion rule (FROZEN)

A person is in the viewer's Network iff at least one of these LIVE, viewer-scoped relationship edges exists:

1. **Accepted Global Business Network connection** (`GlobalNetworkSDK.connections.listAccepted`) — a two-way established Business Connect relationship, OR
2. **Non-archived saved business card** (`SavedCardSDK.search({ archived: false })`) — the viewer's own relationship edge to a person's live card (BC-2.4: "a Saved Card is a RELATIONSHIP EDGE").

**Dedupe:** when a saved card's `target.slug` equals a connection counterpart's `primaryCardSlug`, both edges point at the same person → the **connection** row is kept (richer, two-way semantic) and the saved-card row is dropped.

**Explicitly excluded:** same-tenant users, association members, directory/search results, viewed profiles, pending incoming/outgoing requests (not yet established), declined/cancelled/disconnected/blocked pairs, archived saved cards.

## Composition decision

One thin client-safe hook — `useBusinessConnectNetwork()` (`src/hooks/use-business-connect-network.ts`):

- **Sources:** the two LIVE_REUSABLE contracts above, composed client-side (an adapter over existing safe contracts — no backend change).
- **Normalized DTO:** `BcMobileNetworkPerson` — `personId` (opaque, URL-safe: `u:<counterpartUserId>` for connections, `c:<targetCardId>` for saved cards), `relationshipId`, `relationshipKind`, `displayName`, `avatarUrl`, `headline`, `companyName`, `context { kind, at } | null`, `cardSlug`, `sortAt`. No notes, no tags, no embeddings, no scores, no raw records.
- **Ordering (deterministic):** relationship recency desc — connection: `respondedAt ?? createdAt`; saved card: `savedAt`; tie-break `displayName` locale-compare, then `personId`. No hidden "strength" computation.
- **Context line (max 1):** `connected` → "Kết nối {rel}" from `respondedAt ?? createdAt`; `saved_card` → "Đã lưu {rel}" from `savedAt`. Omitted entirely when no timestamp exists. No meeting context (would require per-person meeting composition) and no AI prose in 2A.
- **Pagination:** connections via offset `useInfiniteQuery`, page size 25 (`hasMore` = page full). Saved cards have no pagination contract; the caller's library is inherently bounded by ownership and is fetched once per search term. No unbounded fetch.
- **Search (truthful):** saved cards → real server-side search (`SavedCardSDK.search({ text })`, viewer-scoped). Connections → no server contract exists (`NOT_AVAILABLE`): bounded fallback filters the loaded pages client-side (diacritic-folded, name/title/company) and auto-extends up to **4 pages = 100 most-recent connections** while a term is active. Beyond 100, deeper matches may be missed — documented limitation, never patched with fabricated or global-directory results. Debounce 300ms.
- **Cache isolation:** query keys are viewer-scoped — `["bc-mobile","network",viewerId,"connections"]` and `["bc-mobile","network",viewerId,"saved-cards",term]`. Account switch ⇒ new keys ⇒ no cross-account Network. Cursors (page params) live inside the viewer-scoped infinite query and can never leak across viewers.
- **Degradation:** both sources failing with no data ⇒ quiet error + retry. One source failing ⇒ the other still renders (React Query retains last good data). Never falls back to mocks.

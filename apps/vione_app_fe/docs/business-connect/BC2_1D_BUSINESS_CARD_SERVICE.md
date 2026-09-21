# BUSINESS_CARD_SERVICE — Business Logic Layer (BC-2.1D)

`src/lib/business-card/business-card.service.ts` (+ `lead.service.ts`,
`interaction.service.ts`, `relationship.service.ts`) is the **single home for
Business Card business logic**. Server functions are thin adapters that bind
auth context + input validation and call the service; no domain logic is
duplicated in the function layer.

## Responsibilities

- Owner resolution + mutation gate (`resolveOwner`, `assertOwnerUnlocked`).
- Reads / projection (`listMyCards`, `getMyCard`, `getMyGlobalCard`,
  `getPreviewBySlug`, `getPublicBySlug`, `listPublicProfileSlugs`).
- CRUD orchestration (`saveCard`, `createGlobalDraft`).
- Status transitions (`setStatus`, `publish`, `hide`, `setPrimary`,
  `deleteCard`).
- Visibility normalization + theme resolution (via `business-card.share`).
- Lead + analytics logic in `LeadService` (`listMyLeads`, `updateStatus`,
  `sendReply`, `processWorkflow`, `getStats`).

## Rules

- Imports NO `*.server` file at module scope, so it is safe to import from
  `*.functions.ts`. Server-only clients (admin / anon publishable) are loaded
  lazily inside methods.
- Never queries tables directly — all persistence goes through
  `BusinessCardRepository` / `LeadRepository` / sibling repositories.
- No UI, no framework types.

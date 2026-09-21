# BC-8.0 — Unified Work Hub Architecture

Status: **CLOSED / GO ✅**
Version: `1.0.0` (see `WORK_HUB_PRIORITY_VERSION`)
Location: `src/lib/business-connect/work-hub/`
Route: `/business-connect` (replaces the previous overview)

## Purpose

The Work Hub is a **read-model + action-routing layer** across every
Business Connect domain (Connection, Introduction, Meeting, Follow-up,
Calendar, Relationship Timeline). It never owns lifecycle state,
never persists a new source of truth, and never mutates canonical
records itself.

## Non-goals

- ❌ New database tables for hub items.
- ❌ Duplicating domain state or caching business rules.
- ❌ Recomputing meeting/introduction/connection semantics that already
  exist in their canonical services.
- ❌ Cross-domain mutations. All mutations route into the owning surface.

## Domain layout

| File                   | Responsibility                                                     |
| ---------------------- | ------------------------------------------------------------------ |
| `types.ts`             | Frozen enums, DTOs, priority tiers, page-size bounds, time windows |
| `errors.ts`            | `WorkHubError` + frozen error codes                                |
| `registry.ts`          | `kind → { category, priority, urgency, action, i18n }` mapping     |
| `priority-policy.ts`   | Deterministic sort + dedup (pure)                                  |
| `cursor.ts`            | Cursor codec + summary/overview builders (pure)                    |
| `item-resolver.ts`     | Pure `domainDTO → WorkHubItemDTO` transforms                       |
| `repository.server.ts` | Bounded viewer-scoped Supabase reads under RLS                     |
| `service.server.ts`    | Composes reads + resolvers + policy                                |
| `functions.ts`         | `createServerFn` handlers with `requireSupabaseAuth`               |
| `sdk.ts`               | Frozen read-only `WorkHubSDK` (no mutation verbs)                  |
| `hooks.ts`             | React Query keys + `useWorkHubSummary/Overview/Items`              |

## Priority tiers

`P0` (critical, blocking) → `P7` (informational). Frozen in `types.ts`.
Any change bumps `WORK_HUB_PRIORITY_VERSION` (invalidates cursors and
React Query caches).

## Categories & precedence

`overdue > needs_action > due_soon > upcoming > waiting > recent` —
enforced by `compareWorkHubItems` and covered by tests.

## Dedup

Two items with the same `dedupeKey` (`sourceType:sourceRecordId`) are
collapsed to the winner under `compareWorkHubItems` order. This
guarantees that a single canonical record never surfaces twice in the
same list.

## Safety

- All server functions run under `requireSupabaseAuth` (no admin
  client, no client-supplied identity).
- `WorkHubDisplayData` is an allowlist of PII-safe scalars —
  never raw user IDs, tokens, note bodies, outcome summaries, or
  calendar details.
- All queries are bounded (`WORK_HUB_SOURCE_READ_LIMIT_DEFAULT`,
  `WORK_HUB_PAGE_SIZE_MAX`).
- Failures degrade to an empty section — the Hub can never take down
  a canonical domain.

## Action routing

Every card carries a typed `targetRoute` + `targetParams`/`targetSearch`
that maps into the canonical product surface (Connections, Introductions,
Meeting detail, Relationship Timeline). Optional low-risk inline
mutations (`accept_connection_request`, `acknowledge_introduction_delivery`)
are declared via `mutationCapability`; every other action leaves the
Hub and executes in the owning UI.

## UI

- `WorkHubPage` — landing surface with summary + previews per category.
- `WorkHubSummaryCards` — counts.
- `WorkHubItemCard` — single card (title, description, counterpart,
  action link).
- `WorkHubCategorySection` — sectioned rendering with counts + empty
  handling.

## Tests

`src/__tests__/work-hub.bc80.test.ts` covers:

- Registry integrity + priority version freeze
- SDK freeze (no mutation verbs)
- Category precedence + total-order sort
- Dedup winner selection
- Per-source resolver behavior (window drops, unknown statuses)
- Summary counts and overview preview caps
- Cursor round-trip + rejection of malformed cursors

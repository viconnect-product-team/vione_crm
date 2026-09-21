# BC-9.1 Turn C1 — Acceptance: Core Relationship Memory Read Experience

Scope: viewer-only, read-only surface. No mutations, no BC-9.0 explainability
integration, no knowledge-graph viewer, no feedback UI. Those land in later
C-turns.

## Delivered

### UI components (`src/components/business-connect/relationship-memory/`)

- `badges.tsx` — `StatusBadge`, `ConfidenceBadge`, `FreshnessBadge`, plus
  `kindLabelKey`/`sourceLabelKey` mappers. All labels flow through i18n.
- `display.ts` — safe `memoryDisplayText` / `memoryDetail` helpers. Never
  dumps raw `canonicalValue`; falls back to `canonicalKey`.
- `RelationshipMemoryCard.tsx` — single memory card with copy + view actions.
- `RelationshipMemoryList.tsx` — grouped list (active / candidate /
  historical) with an `aria-pressed` historical toggle, `role="status"` +
  `aria-busy` loading state, and `role="alert"` error state.
- `RelationshipMemorySummary.tsx` — compact sidebar widget for person /
  relationship detail. Filters to `status = active`.
- `RelationshipMemoryDetailDrawer.tsx` — read-only shadcn Sheet with focus
  trap and Escape handling.
- `RelationshipMemoryTimeline.tsx` — date-bucketed timeline
  (current / recent / historical / archived).

### Hooks

- `src/hooks/use-relationship-memory.ts` — `useRelationshipMemories`,
  `useRelationshipMemory`. Deterministic query keys; SDK-only calls.

### Routes

- `src/routes/business-connect.memory.tsx` — `ssr: false`, `noindex`, hosts
  list + timeline for the viewer.
- Tab wired into `src/routes/business-connect.tsx`.
- `src/routes/business-connect.connections.$personNodeId.tsx` — embeds the
  summary widget above the pair timeline.

### i18n

~65 keys added under `bc.memory.*` (status, confidence, freshness, kind,
source, list, drawer, empty/loading/error). VI + EN.

## Guardrails preserved

- `RelationshipMemorySDK` is imported unchanged; no new methods, no direct
  server-function or repository imports.
- Client-safe barrel is the only import path (enforced by
  `relationship-memory-ui-security.bc91.test.tsx`).
- Private meeting notes and all excluded source domains are absent from every
  UI file (scan-tested).
- `canonicalValue` is never JSON-dumped or spread into the DOM.

## Tests

- `src/__tests__/relationship-memory-ui.bc91.test.tsx` — grouped rendering,
  historical toggle (`aria-pressed`), empty state, aria-busy loading,
  role="alert" error, detail-drawer opening, summary link + subject filter.
- `src/__tests__/relationship-memory-ui-security.bc91.test.tsx` — structural
  scan for forbidden imports, barrel-only usage, `canonicalValue` leakage,
  and route SSR/noindex invariants.

## Gate

**BC-9.1 Turn C1 — Ready for review.**

# BC-6.0 — Smart Introduction Foundation

**Version:** SMART_INTRODUCTION_VERSION = `1.0.0`
**Scope:** READ-ONLY path discovery + ranking. No request workflow, no
messaging, no AI.

## Objective

Answer, for the authenticated viewer:

1. Who can introduce me to a given Person?
2. Which path is the best available introduction path?

## Boundaries

- Source Person node is derived server-side from the authenticated identity;
  clients cannot supply `viewerUserId` or `sourcePersonNodeId`.
- 2-hop paths are the primary product surface; 3-hop is optional and bounded
  (`maxDepth ∈ {2, 3}`).
- Fail closed — hidden target, blocked pair, and absent target return
  indistinguishable errors (`TARGET_NOT_FOUND` / `INTRODUCTION_NOT_AVAILABLE`).
- Read-only: no introduction requests, no edge writes, no messaging.

## Modules

- `src/lib/graph/introduction/types.ts` — DTOs + version constants.
- `src/lib/graph/introduction/registry.ts` — Frozen weights/thresholds/budgets.
- `src/lib/graph/introduction/engine.ts` — Pure scoring, reason inference,
  path-id, diversity re-rank.
- `src/lib/graph/introduction/introduction.service.server.ts` — Path discovery
  (RLS-safe via `RelationshipGraphRepository`), block filter, engine hydration.
- `src/lib/graph/introduction/introduction.functions.ts` — Auth-guarded
  `createServerFn` adapter.
- `src/lib/graph/introduction/introduction.sdk.ts` — Client-safe SDK.
- Barrel export via `src/lib/graph/index.ts`.

## Deferred (register in Deferred Scope)

- Introduction request workflow (send / accept / decline).
- Intermediary messaging & templates.
- AI-written messages.
- Smart Introduction UI.
- Introduction success tracking & feedback learning.

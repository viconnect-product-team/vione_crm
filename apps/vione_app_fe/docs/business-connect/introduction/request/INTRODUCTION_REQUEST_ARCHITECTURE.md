# BC-6.2 — Introduction Request Workflow — Architecture

**Version:** INTRODUCTION_REQUEST_VERSION = `1.0.0`
**Scope:** First write-enabled Smart Introduction slice. Requester → primary
intermediary. No chat, no target-side workflow, no AI, no auto-connect.

## Boundaries

- BC-6.1 answers **who can introduce me**. BC-6.2 answers **can I ask this
  intermediary to introduce me**. Path DTOs are read-only; request DTOs are
  a separate domain that carries an immutable path snapshot.
- Only 2-hop paths are actionable in v1. 3-hop returns
  `INTRO_REQUEST_PATH_UNSUPPORTED`.
- Server derives every authority-bearing field: requester, intermediary, path
  hydration. Client input is limited to `targetPersonNodeId`, `pathId`,
  optional plain-text `requestNote`, optional `idempotencyKey`.

## Modules

- `src/lib/graph/introduction/request/types.ts` — DTOs, statuses, errors,
  state-machine guard.
- `src/lib/graph/introduction/request/request.service.server.ts` — auth actor,
  path revalidation via `SmartIntroductionService`, block check, snapshot
  build, RPC calls, DTO redaction.
- `src/lib/graph/introduction/request/request.functions.ts` — 7 auth-guarded
  `createServerFn` adapters (send/accept/decline/cancel/get/incoming/outgoing).
- `src/lib/graph/introduction/request/request.sdk.ts` — framework-free client
  SDK. Barrel via `src/lib/graph/index.ts`.
- `src/hooks/use-introduction-requests.ts` — React Query bindings +
  invalidation matrix.
- UI under `src/components/business-connect/introduction/request/`, route at
  `/business-connect/introductions/requests`.

## Non-goals

Target-side workflow, chat/messaging, AI-authored notes, auto-connect on
accept, success tracking, CRM integration, recommendation feedback.

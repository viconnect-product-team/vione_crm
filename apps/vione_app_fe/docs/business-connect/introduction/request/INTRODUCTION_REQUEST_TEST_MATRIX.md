# BC-6.2 — Test Matrix

## Unit (green in `src/__tests__/introduction-request.bc62.test.ts`)

- State machine: only `pending → {accepted, declined, cancelled, expired}`.
- Terminal set matches spec.
- Error normalization from bare code, embedded Postgres message, unknown shape.
- SDK surface exposes exactly seven functions, no authority-bearing inputs.
- Version + note-cap constants frozen.

## Server-integration (database E2E harness — separate CI job)

Schema:

- self-combinations rejected by CHECK constraints
- only Person nodes reachable via RPC (person lookup in `intro_request_send`)
- one active pending row per `(requester, intermediary, target)`
- terminal immutability trigger blocks status flips
- direct authenticated INSERT/UPDATE/DELETE denied by absence of policy

Send:

- valid 2-hop request
- 3-hop rejected with `INTRO_REQUEST_PATH_UNSUPPORTED`
- unknown `pathId` → `INTRO_REQUEST_PATH_INVALID`
- blocked intermediary → path missing → `INTRO_REQUEST_PATH_INVALID`
- target already connected → `INTRO_REQUEST_TARGET_ALREADY_CONNECTED`
- duplicate replay same idempotency key → same row
- structural duplicate collapses to pending row
- note >500 chars or containing `<`/`>` → `INTRO_REQUEST_NOTE_INVALID`

Accept:

- intermediary only; requester denied
- pending only; already-accepted returns row, already-declined raises
- expired request → `INTRO_REQUEST_EXPIRED` and row flipped to `expired`
- replay idempotent
- no CONNECTED_TO edge created
- no message row created

Decline / Cancel: symmetric.

Concurrency:

- accept/accept, accept/decline, accept/cancel, accept/expire race — winner
  commits, loser observes `NOT_PENDING`.

RLS:

- requester reads own
- intermediary reads incoming
- unrelated user denied
- target denied

UI (React Testing Library + jest-axe):

- request action visible on 2-hop, hidden on 3-hop
- dialog opens, submit disables while pending, error `role="alert"` renders
- incoming accept/decline flow
- outgoing cancel flow
- workspace passes axe

## Regression (must remain green)

- BC-6.0 pure engine tests
- BC-6.1 runtime/UI tests
- Graph strength & recommendation tests
- Connection adapter (`connection-adapter.bc50`) + UI (`connection-ui.bc51`)
- Full typecheck + i18n check

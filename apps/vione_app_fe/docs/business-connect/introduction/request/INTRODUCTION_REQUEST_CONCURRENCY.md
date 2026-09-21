# BC-6.2 — Concurrency

Transactional current-state validation always wins. All state transitions
happen inside `SELECT … FOR UPDATE` within the SECURITY DEFINER RPC, so:

- **Two identical sends** — one commits, the second observes the pending row
  via the `ir_unique_pending_tuple` partial unique index and returns it.
- **Two accepts** — one flips pending → accepted; the second observes
  `accepted` and returns idempotently.
- **Accept vs decline** — the loser sees status ≠ pending and raises
  `INTRO_REQUEST_NOT_PENDING`.
- **Accept vs cancel** — same: whichever transaction gets the row lock first
  wins; the other raises `INTRO_REQUEST_NOT_PENDING`.
- **Accept while expired** — accept RPC detects `expires_at < now()`, writes
  `expired`, and raises `INTRO_REQUEST_EXPIRED`. No accepted row remains.
- **Block created while pending** — `ConnectionService.listBlockedPersonNodeIds`
  is checked on every path-hydration call. Once a block exists,
  `SmartIntroductionService` removes the intermediary and the path stops
  matching; a follow-up accept still succeeds because the block does not
  retroactively invalidate an already-pending request. That behavior is
  deliberate: BC-6.2 does not deliver the introduction on accept, and
  target-side workflow is deferred.

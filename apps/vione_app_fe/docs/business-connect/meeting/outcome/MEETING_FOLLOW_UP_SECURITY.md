# BC-7.9 Turn B — Follow-up Security

- `FORCE ROW LEVEL SECURITY` on `business_meeting_follow_ups`. No SELECT
  policy grants direct DML — every write goes through a SECURITY DEFINER
  RPC (`_create`, `_update`, `_set_status`, `_cancel`).
- SELECT is scoped to meeting participants via the same `bm_is_participant`
  helper Turn A uses for outcomes.
- Authority is derived from `auth.uid()` inside each RPC. Callers cannot
  spoof identity.
- Owner eligibility is validated against
  `business_meeting_participants` (active only) inside a SECURITY DEFINER
  helper (`bmfu_owner_eligible`) — clients cannot bypass by supplying a
  stale participant uid.
- Cross-meeting outcome links are rejected in the same transaction
  (`MEETING_FOLLOW_UP_INVALID_OUTCOME`).
- Idempotency: `(meeting_id, created_by_user_id, client_request_id)` is
  unique; retried `create` returns the canonical row rather than creating
  a duplicate or a second event.
- Optimistic concurrency: `version` mismatch → `VERSION_CONFLICT` (no
  silent last-write-wins).
- DTO projection redacts raw `owner_user_id` and `created_by_user_id`;
  callers receive `{kind, isViewer}` identities only. No raw uid leaves the
  server for participants or the organizer.
- Every mutation writes to `business_meeting_mutations` under a stable
  `mutation_key`, and to the shared outbox via `bm_log_event`. The unique
  key on mutations gives exactly-once semantics under retry.

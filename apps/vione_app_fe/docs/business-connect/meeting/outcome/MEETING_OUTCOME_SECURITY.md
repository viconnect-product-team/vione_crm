# Meeting Outcome — Security

## RLS

- `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`.
- Only a `SELECT` policy exists (`bmo_select`): participants of the meeting,
  the organizer, or a platform admin.
- **No** `INSERT/UPDATE/DELETE` policies — all writes must go through the
  SECURITY DEFINER RPCs.

## SECURITY DEFINER RPCs

- `business_meeting_outcome_create(_meeting_id, _outcome_type, _summary, _client_request_id)`
- `business_meeting_outcome_update(_meeting_id, _expected_version, _outcome_type, _summary, _clear_summary)`
- `business_meeting_outcome_finalize(_meeting_id, _expected_version)`

All three:

- `SET search_path = public`.
- Derive identity from `auth.uid()`; **no** client-supplied `recorded_by_user_id`.
- `REVOKE ALL ... FROM PUBLIC, anon`; `GRANT EXECUTE TO authenticated, service_role`.
- Row-lock (`FOR UPDATE` / `FOR SHARE`) before mutating.

## Immutability guards

- `bmo_guard_immutable` trigger blocks changes to `meeting_id` and
  `recorded_by_user_id`, and blocks any field change once
  `outcome_status = 'finalized'` (stable code `MEETING_OUTCOME_FINALIZED`).
- `bmo_block_delete` trigger blocks all DELETEs.

## DTO redaction

- `MeetingOutcomeDTO` never carries `recorded_by_user_id` or raw audit fields.
- `viewerIsRecorder` is a boolean derived server-side by the service layer.

## Cross-tenant

- Read authorization funnels through `bm_is_participant()`, so cross-tenant
  leakage inherits the meeting scope's participant check.

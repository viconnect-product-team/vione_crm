# BC-7.9 Turn B — Follow-up Test Matrix

Suite: `src/__tests__/meeting-follow-up.bc79.test.ts` — **44 / 44 passing**.

## Registry (2)

- Frozen 4 statuses × 4 priorities, version `1.0.0`.
- Unknown status/priority rejected.

## State machine (2)

- Only `open→{in_progress,completed,cancelled}` and
  `in_progress→{completed,cancelled}` accepted; all other pairs rejected.
- `isFollowUpTerminal` matches `completed | cancelled`.

## Temporal derivation (6)

- Terminals win over `dueAt`.
- Null due → `active`.
- `dueAt < now` → `overdue`.
- `dueAt` in ≤ 24h → `due_soon` (edge inclusive).
- `dueAt` > 24h → `active`.
- Invalid date → `active`.

## Ownership policy (7)

- Organizer create with any owner ✓ / participant self-only ✓ /
  unrelated ✗.
- Edit + cancel gated to owner or creator (participant path).
- Reassign owner: organizer only.
- Change status: owner allowed, unrelated denied.
- Terminal follow-ups: no edit / no cancel / no status change.
- `deriveFollowUpViewerPermissions` consistent with the above.

## Error mapping (3)

- Every canonical code round-trips through the mapper.
- Unknown message → `INTERNAL_ERROR`.
- `MeetingFollowUpError` passes through untouched.

## SDK freeze (2)

- Follow-up SDK exposes exactly 5 methods, frozen.
- `MeetingOutcomeSDK` method list extends to 9 entries (4 outcome + 5
  follow-up).

## Behavioural contract via in-memory harness (20)

Mirrors the SQL RPC semantics:

- Organizer creates for participant; DTO redacts uids.
- Participant creates self-owned.
- Participant cannot assign another participant.
- Invalid owner rejected.
- Idempotent create (same `client_request_id`) returns canonical row and
  emits **1** event.
- Empty / >240-char titles rejected.
- Unknown priority rejected.
- Cross-meeting outcome link rejected.
- Update bumps version by exactly 1 and emits 1 event.
- Stale update → `VERSION_CONFLICT` (first writer wins).
- Owner reassignment: organizer allowed, participant denied.
- `open → in_progress → completed` emits one event each.
- `open → completed` direct path allowed.
- `open → cancelled` and `in_progress → cancelled` allowed.
- Duplicate completion is idempotent (no extra event, no version bump).
- Duplicate cancellation is idempotent.
- Completed follow-up cannot be cancelled → `TERMINAL`.
- Invalid transition from completed → rejected.
- Temporal DTO reflects `overdue` and `due_soon`.

## Security surface (2)

- Unrelated authenticated user is denied all mutations.
- DTO never leaks raw `owner_user_id` / `created_by_user_id`.

# BC-7.9 Turn B — Meeting Follow-up Model

Table `business_meeting_follow_ups`:

- `id uuid pk`
- `meeting_id uuid` → `business_meetings.id`
- `outcome_id uuid null` → `business_meeting_outcomes.id` (same meeting only, enforced by trigger)
- `created_by_user_id uuid` (author)
- `owner_user_id uuid` (assignee — must be a meeting participant or organizer)
- `title text` (1..240)
- `description text null` (≤ 4000)
- `status` enum-in-check: `open | in_progress | completed | cancelled`
- `priority` enum-in-check: `low | normal | high | urgent`
- `due_at timestamptz null`
- `completed_at timestamptz null` (set when status → completed)
- `cancelled_at timestamptz null` (set when status → cancelled)
- `client_request_id text null` — idempotency scope: `(meeting_id, created_by_user_id, client_request_id)`
- `version int not null default 1` — optimistic concurrency
- `created_at`, `updated_at`

Grants: `authenticated` SELECT + `service_role` ALL. FORCE RLS on. No direct
DML from Data API — all writes flow through SECURITY DEFINER RPCs.

Derived (server-projected) fields on DTO:

- `temporalState`: `active | due_soon | overdue | completed | cancelled`
  (24h "due-soon" window; terminals win).
- `owner`, `createdBy`: opaque `{kind, isViewer}` identity — never raw uid.
- `viewerPermissions`: `{canEdit, canChangeStatus, canCancel}`.

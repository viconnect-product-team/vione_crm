# BC-4.1A — RLS & Privacy Matrix

All five tables have RLS **enabled and forced**. No `anon` grants. Reads are
strictly participant-scoped; writes go only through `SECURITY DEFINER` mutation
functions (direct client INSERT/UPDATE/DELETE is denied).

## Read policies (`authenticated`)

| Table                         | Who can SELECT                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| business_meetings             | user is a row in `business_meeting_participants` for that meeting, OR `is_platform_admin()` |
| business_meeting_participants | user participates in the same meeting (co-participants visible), OR platform admin          |
| business_meeting_proposals    | user participates in the parent meeting, OR platform admin                                  |
| business_meeting_events       | user participates in the parent meeting, OR platform admin                                  |
| business_meeting_mutations    | `actor_user_id = auth.uid()` only                                                           |

## Write policies

No direct `INSERT/UPDATE/DELETE` policy for `authenticated`. All state changes
flow through mutation functions that resolve identity from `auth.uid()`, enforce
the state machine, Policy B eligibility, blocking, and rate limits, then write as
definer. `service_role` retains full access for maintenance.

## Privacy invariants

- `location_text`, `meeting_url`, `response_message`, `proposal_message` are
  participant-private — never exposed to non-participants or in any public/notification
  projection.
- `organizer_user_id`, `source_id`, `company_id`, `association_id` are
  server-resolved; client-supplied values are ignored/rejected.
- Another participant's private connections/notes are never surfaced here.
- Context columns (`company_id`, `association_id`, `source_*`) are informational
  and grant **no** authorization.

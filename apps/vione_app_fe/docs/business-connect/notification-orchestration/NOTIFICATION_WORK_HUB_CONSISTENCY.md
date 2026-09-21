# Work Hub Consistency

The runtime preserves these invariants (§AG):

1. `mark_read` / `mark_unread` / `archive` on a notification **never** mutate
   canonical domain state (connection, introduction, meeting, follow-up,
   collaboration).
2. When a domain resolves (meeting cancelled, follow-up completed, outcome
   created, introduction delivered), the runtime cancels **future** schedules
   and escalations for the source. Existing delivered notifications remain
   historical.
3. Canonical resolution expires **actionability**: the reconciliation pass
   transitions eligible notifications to `expired`, so the UI can render them
   as read-only history.
4. Work Hub items derive independently from canonical domain data; a
   notification archive does not remove a Work Hub item, and a canonical
   resolution both removes the Work Hub item and expires the notification.

The runtime never writes back into canonical domain tables.

# BC-7.10 Test Matrix

## UI suite — `meeting-collaboration-ui.bc710.test.tsx` (37 tests, 40 cases)

| # / Case | Section      | Assertion                                                    | Status |
| -------- | ------------ | ------------------------------------------------------------ | ------ |
| 1        | Agenda       | Loading role="status" while list resolves                    | ✅     |
| 2        | Agenda       | Empty state renders localized empty copy                     | ✅     |
| 3        | Agenda       | Organizer sees "Add item" button                             | ✅     |
| 4        | Agenda       | Participant sees no mutation controls                        | ✅     |
| 5        | Agenda       | Create invokes `createAgendaItem` with meetingId + title     | ✅     |
| 6        | Agenda       | Edit invokes `updateAgendaItem` with `expectedVersion`       | ✅     |
| 7 + 8    | Agenda       | Move Up/Down are accessible buttons; reorder is called       | ✅     |
| 9-11     | Agenda       | Status combobox present with label "Status"                  | ✅     |
| 12       | Agenda       | Delete button only for status="planned"                      | ✅     |
| 13       | Agenda       | Terminal item hides Delete                                   | ✅     |
| 14       | Agenda       | Stale-version error → alert, no crash                        | ✅     |
| 15       | PrivateNotes | Privacy label "Only you can see this content" visible        | ✅     |
| 16       | PrivateNotes | Getter called with meetingId only (no user selector)         | ✅     |
| 17       | PrivateNotes | Explicit Save triggers one upsert with expectedVersion       | ✅     |
| 18       | PrivateNotes | Save-on-blur no-ops when draft equals server content         | ✅     |
| 19       | PrivateNotes | Version conflict preserves local draft                       | ✅     |
| 20       | PrivateNotes | Textarea maxLength = 20000                                   | ✅     |
| 21       | PrivateNotes | No participant / user selector rendered                      | ✅     |
| 22       | PrivateNotes | Mutation invalidates only `meeting-private-note` key         | ✅     |
| 23       | SharedNotes  | Organizer textarea is editable                               | ✅     |
| 24       | SharedNotes  | Participant textarea is readOnly and no controls             | ✅     |
| 25       | SharedNotes  | Publish opens confirm dialog; publish fires after confirm    | ✅     |
| 26 + 27  | SharedNotes  | Published note: readOnly + no edit/publish + notice visible  | ✅     |
| 28       | SharedNotes  | Stale-version error surfaced as alert                        | ✅     |
| 29       | SharedNotes  | Publish invalidates shared + timeline keys, not private      | ✅     |
| 30-32    | Timeline     | Three collab i18n event keys resolve                         | ✅     |
| 33       | Timeline     | No `private_notes_*` i18n key registered                     | ✅     |
| 34       | Timeline     | Renderer never touches `event.metadata` or `.content`        | ✅     |
| 35       | A11y         | axe pass — Agenda (populated, organizer)                     | ✅     |
| 36       | A11y         | axe pass — Private Notes                                     | ✅     |
| 37       | A11y         | axe pass — Shared Notes (organizer draft)                    | ✅     |
| 38       | A11y         | axe pass — full collaboration surface (all 3 sections)       | ✅     |
| 39       | A11y         | Keyboard reorder — Move Down focusable, Enter/click reorders | ✅     |
| 40       | Mobile       | No `w-screen` / `min-w-[9…]` overflow classes in surface     | ✅     |
| Extra    | Contract     | Query-key shape scoped by meetingId only                     | ✅     |

## Security suite — `meeting-collaboration-security.bc710.test.ts` (8 tests)

- UI imports SDK/hooks only — no direct Supabase table access
- UI does not pass userId for private note reads / writes
- Private-note hook + `UpsertPrivateNoteInput` reject user-id override
- No organizer selector for other participants' private notes
- Query keys contain meetingId only
- No migration statement co-touches `private_notes` + `business_meeting_events`
- No shared-note publish metadata carries `content`
- `MeetingTimeline` renderer never accesses `.metadata` or `.content`
- Shared-note mutation controls gated behind `isOrganizer && !published`

## Related suites (regression sweep — all green)

| Suite                                | Tests         |
| ------------------------------------ | ------------- |
| meeting-agenda-policy.bc710          | 13            |
| meeting-notes-policy.bc710           | 17            |
| meeting-collaboration-ui.bc710       | 37            |
| meeting-collaboration-security.bc710 | 8             |
| meeting-outcome-security.bc79        | 5             |
| meeting-outcome-ui.bc79              | 4             |
| meeting-workspace.bc78               | 20            |
| meeting-workspace-ui.bc78            | 6             |
| meeting-request-lifecycle.bc76       | 25            |
| calendar-retry.bc77                  | 5             |
| calendar-security.bc77               | 19            |
| calendar-sync.bc77                   | 6             |
| timeline.bc75                        | 14            |
| timeline-projection.bc75b            | 8             |
| relationship-timeline-ui.bc75c       | 11            |
| **Total**                            | **198 / 198** |

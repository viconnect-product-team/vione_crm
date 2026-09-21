# Meeting Collaboration Architecture (BC-7.10)

## Domains

Three sibling sub-domains under `src/lib/meeting/collaboration/`:

1. **Agenda** (`business_meeting_agenda_items`)
   - Organizer-only mutations (create / edit / status / reorder / delete).
   - Status machine: `planned → in_discussion → discussed | skipped`.
   - 1-level nesting supported in schema; UI ships root items only (Option B, deferred).
   - Optimistic concurrency via `version`.

2. **Private Notes** (`business_meeting_private_notes`, FORCE RLS)
   - Owner-only read / write. Organizer cannot see others' notes.
   - `(meeting_id, user_id)` unique — one per (user, meeting).
   - No timeline emission (privacy).
   - Content cap: 20,000 chars.

3. **Shared Notes** (`business_meeting_shared_notes`, FORCE RLS)
   - Organizer edits + publishes; participants read.
   - Status machine: `draft → published` (terminal, immutable).
   - Publish emits `business_meeting_shared_notes_published` (identifiers only, no content).
   - Content cap: 20,000 chars.

## Authority model

| Actor       | Agenda R | Agenda W | Priv R (own) | Priv R (others) | Shared R | Shared W (draft) | Shared Publish |
| ----------- | -------- | -------- | ------------ | --------------- | -------- | ---------------- | -------------- |
| Organizer   | ✅       | ✅       | ✅           | ❌              | ✅       | ✅ (if draft)    | ✅             |
| Participant | ✅       | ❌       | ✅           | ❌              | ✅       | ❌               | ❌             |
| Non-party   | ❌       | ❌       | ❌           | ❌              | ❌       | ❌               | ❌             |

## Runtime

- All mutations go through SECURITY DEFINER RPCs with version guards.
- All UI reads go through `MeetingCollaborationSDK` (agenda / privateNotes / sharedNotes).
- No component imports Supabase directly.

## Turn C / F additions

- Product surface (`AgendaSection`, `PrivateNotesSection`, `SharedNotesSection`).
- `useMeetingCollaboration` TanStack Query hooks with strict per-domain
  query keys (`meeting-agenda`, `meeting-private-note`, `meeting-shared-note`).
- i18n keys under `bc.meetings.collab.*` and
  `bc.meetings.workspace.timeline.event.business_meeting_{agenda_item_created,
agenda_item_discussed, shared_notes_published}`.

## Deferred scope

See `MEETING_COLLABORATION_FINAL_VERIFICATION.md`.

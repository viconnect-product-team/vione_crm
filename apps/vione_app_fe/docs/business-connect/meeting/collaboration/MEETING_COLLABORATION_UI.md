# Meeting Collaboration UI (BC-7.10 Turn C / F)

Product surface for the meeting collaboration domain, wired into
`/business-connect/meetings/$meetingId` between the Follow-up section and
the meeting Timeline.

## Sections

| Section       | Component                 | Read gate                          | Mutation gate               |
| ------------- | ------------------------- | ---------------------------------- | --------------------------- |
| Agenda        | `AgendaSection.tsx`       | `canRead` (participant)            | `canManage` (organizer)     |
| Shared Notes  | `SharedNotesSection.tsx`  | `canRead`                          | `isOrganizer && !published` |
| Private Notes | `PrivateNotesSection.tsx` | `canRead` (owner-only server-side) | Owner only                  |

## Data flow

```
Component  →  useMeetingCollaboration hooks (TanStack Query)
           →  MeetingCollaborationSDK (agenda | privateNotes | sharedNotes)
           →  createServerFn RPCs (SECURITY DEFINER)
           →  RLS-enforced tables (FORCE RLS on notes)
```

No component imports Supabase directly. This is verified in
`meeting-collaboration-security.bc710.test.ts`.

## Query keys (all scoped by meetingId only)

- `["meeting-agenda", meetingId]`
- `["meeting-private-note", meetingId]`
- `["meeting-shared-note", meetingId]`
- `["meeting-workspace-timeline", meetingId]` (invalidated on publish)

## Optimistic concurrency

Every mutation carries `expectedVersion` (or `null` for first-save of a
private note). Server RPCs reject on mismatch with
`MEETING_COLLABORATION_VERSION_CONFLICT`, surfaced as a role="alert" region.

## Nested agenda UI — DEFERRED (Option B)

Schema supports one level of nesting (`parentId`). UI renders **root items
only**. No UI path creates a nested item. Backend schema is unchanged. See
`MEETING_COLLABORATION_FINAL_VERIFICATION.md` §"Nested agenda decision".

## Deferred scope (explicit)

- AI summarization / auto-agenda
- Live transcription
- CRDT / real-time collaborative editing
- Nested agenda UI (Option B — deferred)
- Public sharing / export
- Drag-and-drop reorder (buttons cover keyboard reorder today)

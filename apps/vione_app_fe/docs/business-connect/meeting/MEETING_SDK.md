# BC-7.0 — Meeting SDK

Frozen client-side facade: `src/lib/business-meetings/client-sdk.ts`
(exported as `BusinessMeetingSDK`). UI reaches the domain ONLY through
this SDK + `src/hooks/use-business-meetings.ts`.

## Surface

```ts
BusinessMeetingSDK.meetings.listUpcoming(filters?)
BusinessMeetingSDK.meetings.listPending(filters?)
BusinessMeetingSDK.meetings.listPast(filters?)
BusinessMeetingSDK.meetings.listCancelled(filters?)
BusinessMeetingSDK.meetings.countByStatus()
BusinessMeetingSDK.meetings.get(meetingId)
BusinessMeetingSDK.meetings.getProposalHistory(meetingId)

BusinessMeetingSDK.meetings.accept(meetingId, version)
BusinessMeetingSDK.meetings.decline(meetingId, version, { reason? })
BusinessMeetingSDK.meetings.proposeNewTime(meetingId, baseVersion, input)
BusinessMeetingSDK.meetings.cancel(meetingId, { reason?, expectedVersion? })
BusinessMeetingSDK.meetings.complete(meetingId, { expectedVersion? })
BusinessMeetingSDK.meetings.markNoShow(meetingId, { expectedVersion? })
```

## Query keys

Stable keys under `businessMeetingKeys` (see
`src/lib/business-meetings/query-keys.ts`) enable precise invalidation
without broad cache clears.

## Error surface

SDK throws domain errors mapped via `toBusinessMeetingError`. UI renders
i18n keys via `error-messages.ts`; raw SQL/RLS text NEVER reaches the UI.

## Stability

This surface is frozen for BC-7.0. Additive methods allowed; renames /
signature changes require a new BC slice.

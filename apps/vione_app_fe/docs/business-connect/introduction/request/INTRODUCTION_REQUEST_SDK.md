# BC-6.2 — SDK Contract

`IntroductionRequestSDK` is the only entry point product code may use.

```ts
IntroductionRequestSDK.sendRequest({
  targetPersonNodeId, pathId, requestNote?, idempotencyKey?
})
IntroductionRequestSDK.acceptRequest(requestId)
IntroductionRequestSDK.declineRequest(requestId)
IntroductionRequestSDK.cancelRequest(requestId)
IntroductionRequestSDK.getRequest(requestId)
IntroductionRequestSDK.listIncoming({ status?, limit?, cursor? })
IntroductionRequestSDK.listOutgoing({ status?, limit?, cursor? })
```

Constraints:

- Framework-free. No React, no Supabase, no repository / service imports at
  module scope.
- No authority-bearing inputs (no requesterUserId, no intermediary override,
  no raw snapshot). All are server-derived.
- Errors normalize to `IntroductionRequestError` with a fixed code set.
- DTOs are stable: `requestNote` present only when the viewer is a
  participant; the raw `path_snapshot` jsonb is never returned — only the
  redacted `SelectedPathSummaryDTO`.

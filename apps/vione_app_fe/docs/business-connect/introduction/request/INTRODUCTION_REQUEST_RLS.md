# BC-6.2 — RLS & Privilege Matrix

`public.introduction_requests` has FORCE RLS with a single SELECT policy:

```
SELECT USING (auth.uid() = requester_user_id OR auth.uid() = intermediary_user_id)
```

There is no INSERT/UPDATE/DELETE policy — direct writes are refused. All
mutations go through SECURITY DEFINER RPCs (`intro_request_send`,
`intro_request_accept`, `intro_request_decline`, `intro_request_cancel`)
which re-check `auth.uid()` and the actor role.

| Actor          | Read | Send | Accept | Decline | Cancel |
| -------------- | :--: | :--: | :----: | :-----: | :----: |
| Requester      |  ✅  |  ✅  |   ❌   |   ❌    |   ✅   |
| Intermediary   |  ✅  |  ❌  |   ✅   |   ✅    |   ❌   |
| Target         |  ❌  |  ❌  |   ❌   |   ❌    |   ❌   |
| Unrelated user |  ❌  |  ❌  |   ❌   |   ❌    |   ❌   |

`request_note` is returned only when the viewer is a participant; DTO
redaction happens in `IntroductionRequestService.toDTO`. Hidden target,
blocked pair, and absent path all collapse into `INTRO_REQUEST_PATH_INVALID`
so the direction of a block is never leaked.

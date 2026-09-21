# Member PWA — Gap Register (P0-A1)

Only production `/m/*` surfaces are in scope for P0-A. Gaps below are the
list of items P0-A2 / P0-A3 must resolve. No production fallback to fixture
data is permitted — anything unresolved must render a controlled empty /
unavailable state, not mock content.

| #   | Surface                            | Gap                                                                                                                                                                                                                                                                                                  | Severity              | Target phase  |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------- |
| 1   | `/m/checkin`                       | ~~Uses `loadCheckins/saveCheckins/pendingCheckins` from `member-app-data` (localStorage as canonical store).~~ **Resolved in P0-A2A** — cutover to `getMyCheckinState` / `checkInMyself`; Option A online-required; member-scoped RLS on `member_checkins`. See `CHECKIN_SERVER_AUTHORITY_P0A2A.md`. | ~~P0 blocker~~ CLOSED | **P0-A2A ✅** |
| 2   | `/m/profile`                       | Read is live via `getMyMember`; there is no `updateMyMemberProfile` server function yet. Editing UI is currently disabled/read-only.                                                                                                                                                                 | P0                    | **P0-A2**     |
| 3   | Member context fan-out             | Every screen re-fetches its own copy of the member row. A shared `useMemberContext()` on top of `getCurrentMemberContext` (P0-A1) will collapse this.                                                                                                                                                | P1                    | **P0-A2**     |
| 4   | `/m/library`                       | Backed by `documents` table. No signed-download flow — links currently render metadata only. Confirm product policy on downloads.                                                                                                                                                                    | P1                    | **P0-A3**     |
| 5   | `/m/messages`                      | Backed by `messages`. Realtime projection and read-receipt semantics need audit; not a fake backend, but needs the same server-authority sweep as check-in.                                                                                                                                          | P1                    | **P0-A3**     |
| 6   | `/m/history`                       | Backed by `activity_log`. Confirm the projection excludes internal admin audit rows before we broaden the surface.                                                                                                                                                                                   | P1                    | **P0-A3**     |
| 7   | Member-app fixtures still exported | `src/lib/member-app-data.ts` and `src/lib/extra-data.ts` still export mock arrays used by desktop routes. The structural test forbids production `/m/*` imports of them; full deletion waits until desktop cutover (P0-B).                                                                           | Debt                  | **P0-B**      |
| 8   | AI provider default                | `AI_PROVIDER` env can fall back to `mock`. Not a Member PWA issue but flagged for the environment gate.                                                                                                                                                                                              | N/A here              | Environment   |

## Not gaps (verified in P0-A1)

- All 19 non-checkin `/m/*` routes route through `@/lib/member-app.functions`
  server functions with `requireSupabaseAuth`. No production route silently
  falls back to fixture data.
- `localStorage` usage in `m.card.tsx`, `m.notifications.tsx`, `m.renew.tsx`,
  and `m.tsx` is UI cache / preferences / reminder dedupe — not canonical
  data storage.
- No `/m/*` route hardcodes a `CURRENT_USER_ID`; identity flows from
  `requireSupabaseAuth` → `resolveMemberCode` / `resolveAssociationId`.

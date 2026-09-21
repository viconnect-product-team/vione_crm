# BC-Mobile-7A — Community Foundation Closure Report

## Shipped

**Domain audit** — `docs/mobile/BC_MOBILE_7A_COMMUNITY_AUDIT.md`: community =
`associations`, membership = `memberships`, member directory = `members`
(REUSABLE_WITH_ADAPTER), member projection = published+public
`member_business_cards`, handoff = frozen 5E `GlobalConnectionService`.

**Contracts** — `community.types.ts`: `CommunitySummaryDTO`,
`CommunityDetailDTO`, `CommunityMemberSummaryDTO`, `CommunityMemberPageDTO`,
`CommunityMemberProfileDTO` (+ connection state machine). `memberRef` is the
opaque `members.id`; platform `user_id` never crosses to the client.

**Adapter** — `community.server.ts` + thin `community.functions.ts`:
- Viewer RLS for memberships/associations/cards/events/opportunities.
- Privileged admin client ONLY for `members` with a whitelist SELECT
  (`id, name, industry, region, user_id`); every row passes the tested
  whitelist mappers in `community.service.ts`.
- One neutral unavailable state for missing membership/community/member.
- Search: union of member-name ILIKE + published-card company/title ILIKE
  (viewer RLS), candidate cap 500, page 25, deterministic `name, id` order.
- Connect: server resolves memberRef → platform user, delegates to 5E
  `sendRequest` with `source: { type: 'association', id: communityId }` and a
  client mutation key (idempotent).

**SDK + hooks** — `community.sdk.ts`, `src/hooks/use-community.ts`
(viewer-scoped keys, infinite query for the directory, connect mutation
invalidates community + Network + rel-intel).

**Mobile UX** — `src/components/business-connect/mobile/community/`:
- `CommunityHome` — "TÔI ĐANG THUỘC NHỮNG CỘNG ĐỒNG NÀO?"
- `CommunityDetail` — "CỘNG ĐỒNG NÀY LÀ GÌ?" (identity, viewer role, member
  count, members entry, upcoming events preview → `/m/events`, open
  opportunities → `/m/opportunities`)
- `CommunityMembers` — "NHỮNG AI ĐANG Ở TRONG CỘNG ĐỒNG NÀY?" (search,
  bounded load-more, isSelf badge)
- `CommunityMemberProfile` — safe profile + explicit Connect CTA
  (truthful states: connected / request sent / request received → 5E surface)

**Routes** — `/connect-app/community` (layout) + `index`, `$communityId`,
`$communityId/members`, `$communityId/members/$memberRef` (all noindex, under
the auth-gated connect-app shell). The bottom-nav Community tab now lands on
the real surface; the placeholder page is gone.

**i18n** — 33 typed keys `bc.mobile.community.*` (vi + en); check-i18n passes.

**Telemetry** — allowlist-only `reportCommunityMetric`: COMMUNITY_OPENED,
COMMUNITY_MEMBER_LIST_OPENED, COMMUNITY_MEMBER_PROFILE_OPENED,
COMMUNITY_SEARCH_USED, COMMUNITY_CONNECT_OPENED/SENT/FAILED. No ids/names.

## Verification

- `community-foundation.bcm7a.test.ts` — 12/12 pass: DTO whitelists (private
  members fields + user_id never leak, even when present in source rows),
  role normalization, ordering, search normalization, pagination math,
  connect policy matrix, telemetry allowlist.
- `check-i18n.mjs` — OK (3639 keys vi+en).
- `tsgo --noEmit` — clean.
- 5E/6A–6C regression suites — 31/31 pass.
- Remaining repo failures are pre-existing and unrelated (live-DB e2e suites
  need live credentials; legacy public-fn guardrail entries; 1B/4B/9.0
  component suites untouched by this phase).

## Preserved boundaries

- Community membership is NOT a personal relationship: no auto-connect, no
  write-on-read, no contact creation.
- Person Detail `u:` (2C/6A) NOT reused — it still requires an accepted
  connection; 7A ships its own safe member profile.
- No private members fields (email/phone/address/tax_code/fee/
  payment_status/notes) in any DTO, query, or UI.
- No schema changes. No new tables. No RLS changes.

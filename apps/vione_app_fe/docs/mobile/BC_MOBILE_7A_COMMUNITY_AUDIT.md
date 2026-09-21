# BC-Mobile-7A — Community Foundation Domain Audit

Audit date: 2026 (pre-implementation). Scope: map "community" onto the existing
association/membership domain, classify reuse, and freeze the read/write
boundaries for the mobile Community tab.

## 1. Domain mapping (authoritative)

| Product concept (7A)      | Canonical domain entity            | Rationale |
| ------------------------- | ---------------------------------- | --------- |
| Community                 | `associations`                     | The association IS the community a member belongs to. No `communities`/`chapters`/`groups` tables exist. |
| My membership             | `memberships` (user ↔ association) | Row existence = active membership; `role`, `is_default` canonical. |
| Community member          | `members` (association-scoped)     | Business/member record owned by the association; private by default. |
| Member public projection  | `member_business_cards`            | Owner-chosen, owner-published professional fields; RLS already exposes published+public cards. |
| Person identity (5A)      | `business_identities`              | Owner-only RLS; touched only via frozen 5A/5E contracts, never directly. |
| Member-to-identity handoff| `user_connections` via `GlobalConnectionService` (5E) | Frozen verbs, idempotent, in-app notifications. |
| Community events preview  | `events`                           | RLS: active members may view events. |
| Community opportunities   | `opportunities` (`status='open'`)  | RLS: active members may view opportunities. |

"Platform Business Identity" (BC-1.x) remains distinct: `members.user_id`
links a member record to a platform user when one exists. Community
membership NEVER implies a personal relationship, never auto-connects, never
creates contacts on read.

## 2. Existing domain reuse classification

| Existing domain                          | Classification          | 7A treatment |
| ---------------------------------------- | ----------------------- | ------------ |
| `associations` (name/logo/tagline/about) | CANONICAL_REUSABLE      | Read via request-scoped client (`is_member_of` RLS). |
| `memberships`                            | CANONICAL_REUSABLE      | Self RLS proves viewer membership; `role`/`is_default` drive UI. |
| `members`                                | REUSABLE_WITH_ADAPTER   | RLS is admin/self only → privileged server adapter with strict whitelist projection into `CommunityMemberSummaryDTO`. |
| `member_business_cards` (published+public) | CANONICAL_REUSABLE    | Read via request-scoped client (RLS enforces published+public); whitelist fields only. |
| `GlobalConnectionService` (5E)           | CANONICAL_REUSABLE      | `getState`/`sendRequest` with `source.type='association'`; no direct table writes. |
| `pairStateToIdentityConnection` (5E)     | CANONICAL_REUSABLE      | Maps pair state to the profile CTA state machine. |
| `events`                                 | REUSABLE_WITH_ADAPTER   | Preview (next 2 upcoming) via member RLS; tap → existing `/m/events` surface (no new event detail in 7A). |
| `opportunities`                          | REUSABLE_WITH_ADAPTER   | Count of `open` only; tap → existing `/m/opportunities`. |
| `listMembers` (member-app directory.fn)  | NOT_REUSED              | Reads only requester-visible columns but lacks card projection/visibility policy; superseded by 7A adapter. |
| `Person Detail u:` (2C/6A)               | NOT_REUSED              | Requires accepted connection + privacy projection; community members are NOT connections. Not weakened. |
| `news` / `documents` / `messages`        | OUT_OF_SCOPE            | Association content domains; not part of 7A questions. |
| `communities` / `chapters` / `groups` tables | NOT_AVAILABLE       | Do not exist; no schema invented. |

## 3. UNSAFE_FOR_MOBILE members fields (hard ban)

`email`, `phone`, `contact`, `address`, `tax_code`, `fee`, `payment_status`,
`level`, `notes`, `card_url`, and any association-internal admin fields are
NEVER read into the adapter select list and NEVER mapped into DTOs. The
privileged adapter selects an explicit whitelist only (defense in depth on top
of the DTO mapper).

Member DTO allowlist:
`memberRef` (= members.id, opaque), `displayName`, `avatarUrl`,
`jobTitle`, `companyName`, `industryLabel`, `regionLabel` (profile only),
`hasPublicCard`, `isSelf`, plus profile-only `headline`, `bio`, `website`.

## 4. Visibility policy (frozen)

- Viewer MUST hold a `memberships` row for the community (verified via the
  request-scoped client — self RLS). No membership → neutral unavailable
  state; no existence disclosure beyond what membership already proves.
- Member list/profile base fields come from `members` via the privileged
  adapter; professional fields come ONLY from `member_business_cards` rows
  that pass the existing published+public RLS (read with the viewer's client).
- A member WITHOUT a public card still appears in the directory with base
  fields (name/industry/region); card-derived fields stay null. This matches
  the association directory reality: membership is a community fact, contact
  details are the owner's choice.
- `members.user_id` is used server-side ONLY (to resolve platform identity
  for connection state + connect handoff). It is never shipped to the client.

## 5. Member-to-identity handoff (frozen)

- Connect CTA renders only when: member has `user_id`, member ≠ viewer,
  pair state = `none`, and viewer is a member of the community.
- Connect dispatches `GlobalConnectionService.sendRequest` (viewer client,
  `source: { type: 'association', id: communityId }`, client `mutationKey`).
  Accepted/connected states render read-only labels; `incoming_pending`
  links to the existing 5E requests surface. No connect from list rows —
  profile only (calm, explicit intent).

## 6. Pagination & search bounds

- Page size 25, offset-based, deterministic order `name asc, id asc`.
- Search: normalized (trim, PostgREST-breaking chars stripped, 80 chars).
  Union of `members.name ILIKE` and published-card `company_name /
  professional_title ILIKE`, candidate cap 500, paginated after union.
- Counts: exact `head` count for the unfiltered directory; union size when
  searching (capped, documented).

## 7. UX / navigation / i18n / telemetry

- Bottom-nav Community tab already exists (`/connect-app/community`) — 7A
  replaces the placeholder with the real surface; tab untouched.
- Routes: `/connect-app/community` (list), `/$communityId` (detail),
  `/$communityId/members` (directory+search), `/$communityId/members/$memberId`
  (profile). All inherit the auth-gated, `ssr:false` `/connect-app` layout.
- Loading skeletons, retry errors, whitespace-first empty states, one
  neutral unavailable state for missing community/member.
- All copy via typed i18n keys (`bc.mobile.community.*`), VI default + EN.
- Telemetry allowlist only: COMMUNITY_OPENED, COMMUNITY_MEMBER_LIST_OPENED,
  COMMUNITY_MEMBER_PROFILE_OPENED, COMMUNITY_SEARCH_USED,
  COMMUNITY_CONNECT_OPENED, COMMUNITY_CONNECT_SENT, COMMUNITY_CONNECT_FAILED.
  No ids, names, queries, or community identifiers in metrics.

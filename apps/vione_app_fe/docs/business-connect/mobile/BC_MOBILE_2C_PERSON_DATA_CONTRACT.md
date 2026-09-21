# BC-Mobile-2C — Person Detail Data Contract

**Status:** FROZEN for BC-Mobile-2C (Person Detail Foundation) · 2026-07-15
**Scope:** ONE person detail surface at `/connect-app/network/$personId`.
Read-only. This document defines which existing contracts back every rendered
field, which fields are frozen out, and how resolution/authorization works.
**2A contracts are unchanged** — this surface consumes the same SDKs, and the
relationship/list semantics remain owned by `BC_MOBILE_2A_NETWORK_DATA_CONTRACT.md`.

---

## 0. Verification baseline

- Live DB inspection (`npx supabase inspect db ...` via the local project link)
  was already executed in BC-Mobile-0A/2A against the same production schema.
  Nothing in this turn adds tables, columns, policies, or server functions.
- Verified by reading production code paths and DB policy definitions:
  - `src/lib/global-network.functions.ts` — `getConnectionStateFn` (zod-uuid
    validated, `requireSupabaseAuth`, pair-scoped `PairState` read).
  - `src/lib/global-network/repository.ts` — `findPairState` and
    `listAccepted` are participant-scoped (`auth.uid()`-derived user id; no
    caller-supplied owner ids).
  - `src/lib/business-card/saved-card.repository.ts` — every query is
    `saved_by_user_id = <auth user>`; target summaries resolve via RLS.
  - `src/lib/business-card/business-card.functions.ts` —
    `getPublicBusinessCardFn` uses a key-only (anon-equivalent) client, so the
    card RLS (`status='published' AND public_mode='public'`) is the hard gate.
  - DB policies on `member_business_cards` (SELECT): owner reads own;
    association manager reads assoc cards; **public reads published+public
    only** — confirmed via `pg_policies`.
  - `src/lib/meeting/workspace/types.ts` — meeting participant previews carry
    an opaque `handle`, NOT auth user ids (anti-enumeration, by design).

## 1. Route identity

`$personId` is the opaque, URL-safe identifier frozen in 2A §2 — unchanged:

| Prefix | Meaning | Producer |
| --- | --- | --- |
| `u:<uuid>` | Global Network connection counterpart user id | connection list rows |
| `c:<uuid>` | Saved business card — `targetCardId` | saved-card rows |

The detail surface parses and validates this format strictly (`u:`/`c:` +
RFC-4122 UUID). Anything else is `invalid`. The id is never displayed, never
interpreted beyond these two namespaces, and no new id format is introduced.

## 2. Resolution & authorization (fail-closed)

Two independent checks must pass before ANY detail content renders. Failure of
either produces the SAME unified unavailable state (see §7) — the UI never
distinguishes "does not exist" from "you may not see this".

### `u:` path (connection)

1. `GlobalNetworkSDK.connections.getState(targetUserId)` → `PairState`.
   Authorized **iff** `status === "accepted"` (and, defensively, `blocked ===
   false`, `direction !== "self"`). Pending, declined, cancelled,
   disconnected, blocked, none → **unauthorized**.
2. Identity loads from the same two frozen 2A calls: `listAccepted` (find the
   accepted row whose `counterpartUserId === targetUserId` → authoritative
   relationship edge: `respondedAt` = accepted-at, `direction`,
   `requestedByCurrentUser`, `sourceType`) and `resolvePublic` (privacy-safe
   public counterpart summary). A counterpart with no public card degrades to
   the neutral private-member fallback — exactly as the 2A list does.

### `c:` path (saved card)

1. `SavedCardSDK.search({})` — owner-scoped by `saved_by_user_id =
   auth.uid()`; the service defaults to non-archived (same call the 2A list
   makes). Authorized **iff** a row with `targetCardId === <uuid>` exists
   among the viewer's own non-archived saved cards. Absence →
   **unauthorized** (or the card was un-saved/archived — same unified state).
2. Identity + `savedAt`/`favorite` come from that row's live-resolved
   `target` summary (null-safe → fallback), identical to the 2A list.

### Contact channels (both paths)

Contact fields are NOT part of either list contract. They load — when
available — through the existing public card projection:

`BusinessCardSDK.getPublic(primaryCardSlug)` (the `u:` path uses the
counterpart's `primaryCardSlug`; the `c:` path uses the target card's `slug`).

- The server fn reads with an anon-key client: only **published + public**
  cards resolve. `members_only`, `private`, draft, or missing slug → the call
  throws `not_found`/`forbidden` → channels are simply **omitted** (§5).
- Returned fields are additionally gated by the card's own
  `visibilitySettings`: `showContact === false` removes
  phone/email/website; `showSocial === false` removes social links. This
  mirrors the public card page (`src/routes/b.$slug.tsx`) byte-for-byte.

## 3. Contract matrix

| UI surface | Backing contract | Status | Enforcement |
| --- | --- | --- | --- |
| Avatar, display name, headline, company | `CounterpartSummary` (`resolvePublic`) / `SavedCard.target` | **LIVE** (2A frozen) | Public-card RLS projection / owner-scoped saved read |
| Primary card slug | same | **LIVE** (2A frozen) | allowlist field |
| "Connected {rel}" / direction / source | `GlobalConnectionDTO` (`respondedAt`, `direction`, `requestedByCurrentUser`, `sourceType`) | **LIVE** | participant-scoped pair read |
| "Saved {rel}" / favorite | `SavedCard.savedAt`, `SavedCard.favorite` | **LIVE** | owner-scoped read |
| Phone / email / website / social | `BusinessCardSDK.getPublic` → `BusinessCard` fields + `VisibilitySettings` | **ADAPTER** over frozen public projection | published+public RLS + per-card visibility flags; omitted otherwise |
| Public card destination (`/b/{slug}`) | same slug | **LIVE** | existing public route |
| Saved-card notes / tags / reminders / metAt | `SavedCard.notes|tags|reminderAt|metAt|firstMetAt` | **EXCLUDED** (frozen 2A boundary) | not mapped into any DTO |
| Timeline preview | requires person-node resolution; only write-path `registerNode` exists client-side | **NOT_AVAILABLE** | resolving another person's node from a read page would be a write-on-read side effect — forbidden by spec §17; needs a read-only node-ref resolver (deferred, BC-Mobile-2D+) |
| Next meeting context | `MeetingWorkspaceItemDTO.visibleParticipants[].handle` is opaque, not a user id | **NOT_AVAILABLE** | anti-enumeration by design; no truthful per-person meeting join exists on a safe boundary |
| Viewer identity | `useViewerUserId` | **LIVE** | local Supabase auth session |

No mock, fixture, placeholder, or demo data. Every rendered value traces to a
production, RLS-bounded table through the contracts above.

## 4. Normalized DTO (whitelist)

One presentation model, exported from the hook. Only these fields may cross
into UI:

```ts
type BcMobilePersonDetail = {
  personId: string;                       // opaque, verbatim (for keys only)
  kind: "connection" | "saved_card";
  displayName: string | null;             // null → localized private fallback
  avatarUrl: string | null;
  headline: string | null;
  companyName: string | null;
  primaryCardSlug: string | null;         // internal; never rendered
  relationship:
    | { kind: "connected"; connectedAt: string | null; requestedByViewer: boolean | null }
    | { kind: "saved"; savedAt: string | null; favorite: boolean };
  contact: {
    phone: string | null;                 // display value
    phoneHref: string | null;             // sanitized tel: href
    email: string | null;
    emailHref: string | null;             // sanitized mailto: href
    websiteLabel: string | null;          // host-only label
    websiteHref: string | null;           // sanitized https:/http: href
    social: { type: string; href: string }[];  // sanitized https:/http: only
  } | null;                               // null = channels unavailable
};
```

**Frozen out** (never mapped): saved-card `notes`/`tags`/`reminderAt`/
`metAt`/`firstMetAt`, connection `id`, `requesterUserId`/`recipientUserId`,
`disconnectedAt`, `sourceId`, card ids, member ids, timestamps not listed
above, and any relationship-memory fields. Raw `website`/social URLs are never
rendered as text; only sanitized hrefs + a host label.

## 5. URL & channel sanitization

The hook owns sanitization (pure, unit-tested):

- `phoneHref`: `tel:` + `[0-9+()\-.\s]` only; else null.
- `emailHref`: `mailto:` + single-recipient RFC-ish address (no `?`, no `,`,
  no spaces); else null.
- `websiteHref` / social hrefs: `new URL()` must parse AND protocol ∈
  {`https:`, `http:`}; else null. `websiteLabel` = `url.host` (never the raw
  string).
- No `javascript:`, `data:`, `file:`, protocol-relative, or userinfo URLs can
  survive — parsing rejects them by construction.

## 6. Privacy & security boundaries

- Viewer-scoped only: every read derives the viewer from the auth middleware /
  local session. No user id, card id, or tenant id is ever accepted from the
  client beyond the opaque `$personId` path param.
- No target ids rendered: `targetUserId`, `targetCardId`, connection/card ids
  never appear in the DOM (the opaque `personId` appears only in the URL it
  came from).
- Visibility flags are hard gates: `showContact`/`showSocial === false` → the
  action does not exist in the UI (not disabled — absent).
- No tracking, no `recordOpen`/analytics side effects, no mutations from this
  surface (spec §17).
- Fail-closed: unknown kind, malformed id, non-accepted pair, missing saved
  edge → one unified unavailable state.

## 7. Unified unavailable / not-found state

`invalid` (bad id format), `unauthorized` (pair not accepted / not the
viewer's saved card), and `not_found` (edge gone after load) ALL render the
same calm, bilingual state: neutral title + one line of copy + a single back
action to Network. No reason codes, no hints about which check failed —
existence of a private relationship is not enumerable through this page.

## 8. Loading & error states

- Loading: quiet skeleton (avatar circle + three hairline bars), localized
  `aria-busy` region — no spinners-as-content.
- Transport/SDK error (distinct from authorization): localized error copy +
  retry button; retry re-runs the query (`queryClient` invalidation of the
  person key).
- Both are axe-clean and use the same layout frame as the loaded page.

## 9. UX freeze (from the task spec)

- Exactly one primary `h1`: the person's name (private fallback when null).
  The top bar carries NO title on this page.
- Order: identity hero → contact actions → relationship narrative → optional
  secondary section. Optional sections render ONLY when their data exists —
  no placeholders, no "coming soon", no empty cards.
- No scores, tags, badges, KPIs, menus, sheets, or destructive actions.
- Contact actions: circular icon buttons, minimum 44×44 px targets, real
  `aria-label`s (localized), one clear meaning each (Call / Email / Website /
  social). Only actions backed by real, visibility-cleared fields render.
- Layout: max-width 480 px column, centered hero, ivory surface, champagne
  hairlines, spacing scale 8/12/16/24 — same tokens as 1B/2B.

## 10. Caching & performance

- One React Query entry per person: `["bc-mobile","person", viewerId,
  personId]`. `staleTime: 60s`, `gcTime: 10min`, `retry: 1`.
- The `u:` path reuses the SAME SDK calls as the 2A list (listAccepted +
  resolvePublic); navigating list → detail costs one pair-state read plus,
  when a slug exists, one public-card read.
- `getPublic` failure (members_only/private/draft card) is NOT an error state
  — it resolves to `contact: null` and the page renders without channels.
- All images `loading="lazy"`.

## 11. Acceptance criteria (BC-Mobile-2C)

1. Connection person (`u:`) renders identity + connected-since narrative +
   contact actions gated by the card's visibility flags.
2. Saved-card person (`c:`) renders identity + saved-since narrative; contact
   actions appear only when the target card is published+public.
3. Non-accepted pair / stranger's card / malformed id → identical unified
   unavailable state; no field leaks.
4. No phone/email/website renders when `showContact` is false; no social when
   `showSocial` is false.
5. No saved notes/tags/reminders anywhere in DOM or DTO.
6. `tel:`/`mailto:`/http(s) sanitization blocks `javascript:`/`data:` and
   malformed input (unit tests).
7. One h1, 44px+ action targets, labelled buttons, axe = 0 in loaded, loading,
   error, and unavailable states (axe run on settled states).
8. Bilingual vi/en for every visible string; formatters via `useFmt`.
9. No new SDK methods, server functions, tables, or mutations introduced.
10. All 2A/1B shards remain green unchanged.

## 12. Deferred (explicitly NOT 2C)

- Timeline preview (needs a read-only person-node resolver — no write-on-read).
- Next meeting context (needs a truthful per-person meeting contract; the
  workspace participant handle is intentionally opaque).
- Connect / save / message / block actions from this page.
- Relationship memory surfaces.
- Deep links from notifications into person detail.

## 13. References

- `BC_MOBILE_2A_NETWORK_DATA_CONTRACT.md` (personId format, list contracts —
  unchanged).
- `BC_MOBILE_0A_FOUNDATION_AUDIT.md` (route matrix; `/connect-app/network/$personId`
  reserved destination).
- `src/lib/global-network.functions.ts`, `src/lib/global-network/repository.ts`
- `src/lib/business-card/saved-card.repository.ts`, `business-card.functions.ts`
- `src/routes/b.$slug.tsx` (visibility-flag gating precedent)
- `docs/business-connect/BC4_1_PLATFORM_ARCHITECTURE_FREEZE.md`

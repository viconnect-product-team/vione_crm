# BC-Mobile-7B — Community Events & Business Opportunities Closure Report

## 1. VERDICT

**CONDITIONAL PASS — BC-MOBILE-7B ENGINEERING COMPLETE. COMMUNITY ACTIVITY
DEVICE/BROWSER UAT REMAINS OPEN. FEATURE FREEZE STARTS NOW.**

All engineering gates close with evidence below. The only open item is
interactive device/browser UAT (§18), tracked in
`docs/mobile/BC_MOBILE_RELEASE_GATES.md`.

## 2. EVENT DOMAIN

Canonical sources reused — no parallel event backend:

- `public.events` (read, viewer member-RLS, whitelist SELECT
  `id, name, date, location, type, status, capacity`).
- `public.event_registrations` (read counts/viewer state + privileged write
  AFTER full server-side validation; canonical RLS is admin-only for regular
  members — audit `BC_MOBILE_7B_ACTIVITY_AUDIT.md` §1.2/§1.3).
- Date handling: `events.date` is a date-only column; parsed WITHOUT `Date()`
  (`eventDateParts`) so no timezone fabrication.
- Capacity: derived from live canonical registration rows (not a stale
  counter); `capacity <= 0` → `capacityState: null` (no capacity semantics).

## 3. OPPORTUNITY DOMAIN

Canonical sources reused:

- `public.opportunities` (read, viewer member-RLS, whitelist SELECT —
  `qr_fields`-free, no owner contact columns).
- `public.opportunity_interests` (privileged write AFTER server validation;
  `member_id = members.id`, audit §2.2/§2.3).
- Poster projection: opaque `{ memberRef, displayName }` from a privileged
  `members` read of `id, name` ONLY — never email/phone/user id.
- Organization label: poster's owner-published public card
  (`member_business_cards`, viewer RLS). Unknown taxonomy types render
  NOTHING (`normalizeOpportunityCategory` → null).

## 4. ROUTES

Exact four native BC Mobile routes (all noindex, under the auth-gated
connect-app shell):

- `/connect-app/community/$communityId/events`
- `/connect-app/community/$communityId/events/$eventRef`
- `/connect-app/community/$communityId/opportunities`
- `/connect-app/community/$communityId/opportunities/$opportunityRef`

## 5. COMMUNITY DETAIL

Preview behavior and isolation:

- `getCommunityActivityPreview` returns max **2** next events + **2** open
  opportunities (`COMMUNITY_ACTIVITY_PREVIEW_LIMIT = 2`).
- Sections fail independently: a broken section renders quiet (empty), the
  other section still renders; the UI layer adds per-section error isolation
  with its own retry.
- Preview sections render ONLY when backed by canonical available data —
  no invented agenda, no invented counts.
- Preview query key is viewer- AND community-scoped (§9).

## 6. EVENT REGISTRATION

Exact canonical mutation/state semantics:

- Mutation: `registerCommunityEventFn` → `registerCommunityEvent` —
  membership check (viewer RLS) → event exists + status `upcoming` +
  date ≥ today → viewer member record → idempotency check (existing active
  registration returns `{ ok: true }` without a duplicate) → capacity check
  → ONE privileged `insert` into `event_registrations` (status `registered`,
  ticket_type `standard`, `association_id` set).
- No cancel-registration exists in 7B (spec-deferred; the UI shows the
  truthful registered state with no fake cancel affordance).
- Viewer state mapping (`mapRegistrationState`): cancelled → `cancelled`;
  completed/ongoing → `closed`; viewer registered → `registered`; full →
  `full`; else `available`. Canonical terminal statuses win over viewer state.

## 7. CHECK-IN

`HANDOFF_TO_EXISTING` — registered viewers see a handoff to the canonical
`/m/checkin` surface (`checkinHandoff: registrationState === "registered"`).

**No duplicate check-in implementation exists in 7B.** Source-audited: the
server adapter SELECT whitelists contain no qr/check-in columns, no
check-in credential appears in any DTO, and no check-in route/component was
added under 7B.

## 8. OPPORTUNITY ACTION

Exact canonical interest behavior:

- Mutation: `expressCommunityOpportunityInterestFn` — membership check →
  opportunity exists + `open` + not expired → viewer member record → own-post
  blocked → idempotent (existing interest returns `{ ok: true }`) → ONE
  privileged `insert` into `opportunity_interests` (`member_id = members.id`,
  contact = viewer's own phone/email from the whitelist member record).
- CTA policy (`canInitiateInterest`): open + not expired + not own post +
  member record + not already interested. Server decides; UI never invents.

## 9. CACHE ARCHITECTURE

Exact viewer-scoped query keys (`src/hooks/use-community-activity.ts`):

```text
['bc-mobile', 'community-events', viewerUserId, communityRef, tab]
['bc-mobile', 'community-event', viewerUserId, communityRef, eventRef]
['bc-mobile', 'community-opportunities', viewerUserId, communityRef, query]
['bc-mobile', 'community-opportunity', viewerUserId, communityRef, opportunityRef]
['bc-mobile', 'community-activity-preview', viewerUserId, communityRef]
```

Every DTO containing viewer-specific data (`registrationState`, `interested`,
`canRegister`, `canExpressInterest`, `checkinHandoff`) sits behind a key with
BOTH `viewerUserId` and `communityRef`. Queries stay disabled while the
viewer id is unknown — no unscoped fetch is possible. 7A community keys
(`communityKeys.*`) follow the same viewer-first scoping.

## 10. ACCOUNT SWITCH EVIDENCE

`community-activity-cache.bcm7b.test.tsx` (14/14 pass) proves, without hard
reload and without manual cache clearing:

- USER A registered for Event X / interested in Opportunity Y → switch to
  USER B:
  - B does NOT inherit A's `REGISTERED` state (events list, event detail). ✓
  - B does NOT inherit A's `interested` state (opportunities list, detail). ✓
  - B does NOT inherit A's Community preview state. ✓
  - Queries refetch under B-scoped keys (mock call counts = 2). ✓
- Switch back to A → A's authoritative state intact (`registered` /
  `interested: true`), served from A's own scoped cache entry. ✓
- Late-response race: A's in-flight detail resolves AFTER the switch; it
  lands in A's key only — B's UI never renders A's payload. ✓
- Cross-community: same viewer, overlapping `eventRef`/`opportunityRef`
  fixtures — Community B never reuses Community A state. ✓

## 11. INVALIDATION MATRIX

Mutation → keys invalidated (proven by exact-set spy assertions):

| Mutation | Invalidated keys |
|---|---|
| EVENT REGISTER SUCCESS | `community-event` (viewer, community, ref) + `community-events` root (both tabs; capacity state changes for all viewers) + `community-activity-preview` (viewer, community) + `communityKeys.detail` (viewer, community) |
| EVENT CANCEL SUCCESS | not applicable — 7B ships no cancel (§6) |
| OPPORTUNITY INTEREST SUCCESS | `community-opportunity` (viewer, community, ref) + `community-opportunities` root (viewer state rendered in lists) |

Forbidden patterns absent (test-enforced): no `invalidateQueries()` without
a bounded key, no global cache reset, no whole-Business-Connect refetch, no
`['bc-mobile']` root invalidation from 7B mutations.

## 12. PRIVACY

Test-proven (dirty-row mapper tests + pinned SELECT source audit):

- private attendee email / phone — CANNOT leak (never selected, mapper drops). ✓
- member private contact — CANNOT leak (whitelist member read; contact only
  ever written into the viewer's own canonical registration/interest row). ✓
- opportunity owner private email / phone — CANNOT leak (poster projection =
  opaque memberRef + displayName only). ✓
- check-in credential in list DTO — CANNOT leak (no qr/check-in column in
  any SELECT; mapper whitelist has no such key). ✓
- tenant internal metadata — CANNOT leak. ✓
- raw user ID as UI authority — CANNOT leak (memberRef/eventRef/
  opportunityRef are opaque ids; `user_id` never crosses to the client). ✓

## 13. NETWORK BOUNDARY

- Event attendance creates Connection? **NO.**
- Opportunity interest auto-connects? **NO.**
- Read creates Network entry? **NO.**
- Person Journey mutation? **NO.** 6A Intelligence candidate mutation? **NO.**

Source-audited: the adapter touches zero cross-domain tables
(`user_connections`, `guest_contacts`, `graph_*`, journeys, moments,
notifications, recommendations all absent from code), writes ONLY to
`event_registrations` + `opportunity_interests`, and read paths contain zero
`.insert/.update/.upsert/.delete/.rpc` (no-write-on-read).

## 14. AI BOUNDARY

- New LLM calls: **ZERO** (source-audited: no ai-provider/openai/generate*
  references).
- 7B activity automatically enters 6A: **NO.**

## 15. TEST RESULTS

New focused suites (**46 tests, 46 pass**):

- `community-activity.bcm7b.test.ts` — **32 tests**: DTO whitelists/privacy,
  registration & interest viewer-state mapping, canonical policies, helpers,
  server source boundary (table whitelist, write targets, no-write-on-read,
  poster projection, network boundary, AI boundary), telemetry allowlist.
- `community-activity-cache.bcm7b.test.tsx` — **14 tests**: key structure,
  account switch A→B→A on all 5 surfaces, cross-community isolation,
  late-response race, bounded invalidation matrix, SDK mutation payloads.

Regression (all pass):

- BC-Mobile-7A Community: `community-foundation.bcm7a` — 12/12.
- BC-Mobile-5E Connection: network-requests + identity-connect +
  public-connect — 20/20 (suite total 32/32 incl. 7A).
- BC-Mobile-6A (engine/ai/privacy/intel-ui) + 6B (action-sheet) + 6C
  (personalization) — 74/74.
- Existing event suites (events-a11y, event-wizard flow/a11y,
  security-hardening) — 19/19.

## 16. TYPECHECK / I18N / LINT / BUILD

- `tsgo --noEmit` — **0 errors**.
- `check-i18n.mjs` — **PASS** (3685 keys, vi + en).
- `eslint` on all 7B files — **0 errors** (prettier-fixed).
- `bun run build` (production) — **PASS**.

## 17. KNOWN BASELINE FAILURES

None encountered in this gate. Live-DB integration/e2e suites
(`*.e2e.test.ts` requiring `requireStagingSupabase()` credentials — renewal,
rls-*, business-cards-scoping.e2e, routes-real-supabase.integration) were
NOT run here: they are infrastructure-dependent (staging Supabase env) and
unchanged by 7B. They remain the standing baseline tracked outside this
closure.

## 18. INTERACTIVE UAT

Not performed in this gate (engineering closure only). Pending device/browser
UAT for Community Events/Opportunities: list/detail navigation, register
flow on a real account, check-in handoff to `/m/checkin`, interest flow,
account-switch spot check on a physical device. Tracked in the release gate
register.

## 19. OPEN COMMERCIAL RELEASE GATES

See `docs/mobile/BC_MOBILE_RELEASE_GATES.md` — cumulative register covering
OCR/device, physical NFC, Public Card device, two-user Connection,
Relationship Intelligence, Community, and Community Events/Opportunities
UAT. 7B adds its UAT row; no prior verdicts rewritten.

## 20. FINAL LINE

**CONDITIONAL PASS — BC-MOBILE-7B ENGINEERING COMPLETE. COMMUNITY ACTIVITY
DEVICE/BROWSER UAT REMAINS OPEN. FEATURE FREEZE STARTS NOW.**

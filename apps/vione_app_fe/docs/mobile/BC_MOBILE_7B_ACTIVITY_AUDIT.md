# BC-Mobile-7B — Community Events & Business Opportunities Audit

Date: 2026-08-10
Status: COMPLETE (audit gate passed before implementation)
Depends on: BC-Mobile-7A (Community Foundation — CLOSED)

This audit inspects the real database schema, RLS policies, DB functions, and
existing code paths for the canonical Events and Opportunities domains, then
classifies every capability BEFORE any UI action is coded.

---

## 1. EVENTS DOMAIN

### 1.1 Canonical objects

| Object | Reality |
| --- | --- |
| `public.events` | `id text`, `name`, `date date` (DATE ONLY — no time), `location`, `capacity int`, `registered int` (counter), `status text`, `type text`, `association_id uuid`, `qr_fields text[]`. NO description, NO agenda, NO speaker/session data, NO cover, NO registration deadline. |
| `public.event_registrations` | `id text`, `event_id`, `member_code text`, `member_name`, `email`, `registered_at date`, `status text`, `ticket_type`, `association_id`. No FK constraints (loose text references). |
| `public.event_ticket_types` | exists (name/price/quantity) — ticket purchase flow NOT part of member self-registration. |
| `public.member_checkins` / `public.checkin_logs` | canonical check-in records; member-facing surface `/m/checkin` (member QR + self state via `getMyCheckinState`). |
| `public.attendees` | organizer-side directory (contains phone — PRIVATE). Not a member-facing roster. |
| Observed status vocabulary | events: `upcoming` (live row) + code vocabulary `upcoming/ongoing/completed/cancelled` (`src/routes/events.tsx`). registrations: canonical writer uses `registered`. |
| Association linkage | `events.association_id` — ONE event = ONE association (canonical). |
| RLS `events` | SELECT: `is_platform_admin() OR is_member_of(association_id)` → members read their community's events directly. |
| RLS `event_registrations` | INSERT/UPDATE/DELETE: **admin/platform_admin ONLY**. SELECT: admin OR `member_code = current_member_id()`. |

### 1.2 Canonical gaps found (must not be papered over)

1. **Member self-registration is RLS-blocked.** `event_registrations_admin_insert`
   requires `has_assoc_role(association_id,'admin') OR is_platform_admin()`.
   The legacy `/m/events` `registerForEvent` inserts with the viewer client, so
   it FAILS for regular members. → registration exists canonically (table +
   writer semantics) but is **ADMIN_ONLY** at the RLS layer.
2. **Own-registration SELECT policy is mismatched.** The canonical writer stores
   `member_code = members.code`, but the SELECT policy compares against
   `current_member_id()` which returns `members.id` (verified: `members.id` ≠
   `members.code` in live data). Own-registration read-back through RLS is
   unreliable. → registration state needs a server-side read model.
3. **No member cancellation.** No member UPDATE/DELETE policy, no cancel RPC.
   → CANCELLATION = NOT_AVAILABLE for members.
4. **`events.registered` counter is not maintained by the member register
   path** → capacity state must be computed from canonical registration rows,
   and only shown when `capacity > 0`.
5. **No time, description, agenda, waitlist, attendee-visibility policy.**
   EventAgenda component documents: "The events API returns no
   session/speaker/room data, so a detailed agenda is never fabricated."

### 1.3 Events capability matrix

| Capability | Classification | Decision |
| --- | --- | --- |
| Community-scoped event list (read) | LIVE_REUSABLE | Viewer RLS (`is_member_of`) + explicit membership re-check in adapter. |
| Event detail (canonical fields only) | LIVE_REUSABLE | name/date/location/type/status/capacity. No fabricated time/agenda/description. |
| My registration state | LIVE_NEEDS_MOBILE_ADAPTER | Server adapter reads `event_registrations` by viewer's `members.code` (privileged, whitelist), bypassing the mismatched RLS policy. |
| Event registration | LIVE_NEEDS_MOBILE_ADAPTER | Privileged server adapter validates viewer → membership → event linkage → status → date → duplicate → capacity, then inserts the SAME canonical `event_registrations` row shape the canonical writer uses (`member_code = members.code`). No parallel table. No RLS change in 7B. |
| Registration cancellation | NOT_AVAILABLE → DEFERRED | No cancel UI. Documented. |
| Capacity state | PARTIAL → adapter | Computed server-side from canonical registration count vs `capacity`; hidden when `capacity = 0`. |
| Waitlist | NOT_AVAILABLE | Not rendered. |
| QR / check-in credential | LIVE_REUSABLE (HANDOFF) | Registered viewer gets a handoff link to canonical `/m/checkin` (member QR). 7B does NOT rebuild check-in and never puts credentials in DTO/telemetry. |
| Event NFC check-in | NOT_AVAILABLE (different domain) | Not implemented (§19). |
| Event Feed / attendee directory / sponsors | DEFERRED | No participant visibility policy safe for mobile. |
| Event agenda | NOT_AVAILABLE | Not fabricated. |
| Event search/filters | NOT_AVAILABLE (volume) | Two tabs only: Sắp tới / Đã đăng ký. |

---

## 2. OPPORTUNITIES DOMAIN

### 2.1 Canonical objects

| Object | Reality |
| --- | --- |
| `public.opportunities` | `id text`, `poster_id text` (= `members.id`, enforced by RLS with_check `poster_id = current_member_id()`), `title`, `description` (plain text), `type` (canonical taxonomy `opp.type.*`: partnership/investment/supply/demand/distribution/other), `budget_min/max bigint`, `region`, `industry`, `deadline timestamptz` (= expiry), `status` (`open` observed), `views`, `emoji`, `association_id`. |
| `public.opportunity_interests` | `id`, `opportunity_id`, `member_id text` (RLS requires `= current_member_id()` = `members.id`), `message`, `contact`, `association_id`. No status column, no unique constraint. |
| RLS `opportunities` | SELECT: `is_member_of(association_id)` → members read community opportunities directly. INSERT/UPDATE: poster/admin. |
| RLS `opportunity_interests` | INSERT: `(association_id = current_association_id()) AND (member_id = current_member_id())`. SELECT: admin OR owner OR opportunity poster. |

### 2.2 Canonical gaps found

1. **Legacy `expressInterest` writes the wrong `member_id`.** It inserts the
   auth user id, but RLS requires `members.id` → fails for regular members;
   read-back (`member_id = userId`) mismatches too. It also binds to
   `current_association_id()` (default membership), breaking multi-community
   members. → interest exists canonically but is **PARTIAL**; a validated
   server adapter is required.
2. **No duplicate protection** (no unique constraint) → adapter enforces
   idempotency.
3. **No canonical contact-owner flow** → only safe action is VIEW_POSTER via
   the 7A member profile projection (poster_id = opaque memberRef) + 5E
   connect. Raw poster email/phone never exposed.
4. **`views` counter** — incrementing on view = write-on-read → NOT touched.

### 2.3 Opportunities capability matrix

| Capability | Classification | Decision |
| --- | --- | --- |
| Community-scoped opportunity list (read) | LIVE_REUSABLE | Viewer RLS + membership re-check; `status='open'` AND `deadline >= now`. Order `created_at DESC`. |
| Organization label | LIVE_REUSABLE | Poster's published public card `company_name` via `member_business_cards` (viewer RLS projection). Never association-private contact fields. |
| Opportunity detail | LIVE_REUSABLE | Plain-text description rendered as text (XSS-safe). Budget shown in detail only (member-visible canonical fields). |
| Interest ("Quan tâm") | LIVE_NEEDS_MOBILE_ADAPTER | Privileged adapter: membership + open + not expired + not own post + idempotent duplicate check → canonical `opportunity_interests` row with `member_id = members.id`. |
| Apply / bidding / CRM | NOT_AVAILABLE | Not rendered. |
| View poster | LIVE_REUSABLE | Handoff to 7A Community Member Profile (poster is active member of the same community). Connect stays 5E. |
| Expiry display | LIVE_REUSABLE | `daysLeft` derived from canonical `deadline` (UTC-safe). Expired excluded from active list. |
| Category filter | DEFERRED | Search (title/industry/region, 300ms debounce) only; taxonomy chips unnecessary at current volume. |

---

## 3. SHARED / CROSS-CUTTING

| Area | Finding | Decision |
| --- | --- | --- |
| 7A adapter | `requireCommunityMembership` + whitelist mappers + privileged member reads are reusable as-is. | Reused; activity code lives in NEW modules (`community-activity.*`) — 7A files stay frozen except additive DTO previews. |
| Cross-community isolation | URL `communityId` is not authorization. | Every adapter re-validates membership server-side; reads additionally scoped by `association_id = communityId`; viewer-RLS used wherever a member policy exists. |
| Global/multi-community events | `events.association_id` is single-valued → one event = one community. No global injection. | Honored. |
| Notifications | No canonical registration/interest notification triggers found for members. | No new notification orchestration (§51). |
| Work Hub / Network / Journey / AI | No canonical links from event registration or opportunity interest to connections, guest contacts, graph edges, journeys, moments, or 6A–6C. | Zero new cross-domain writes. Zero new LLM calls. Activity never enters 6A evidence or 6C events. |
| Rich content | descriptions are plain text. | Rendered as text nodes only; no `dangerouslySetInnerHTML`. Location/type rendered as plain text. |
| Legacy routes `/m/events`, `/m/opportunities` | Remain untouched. | Community navigation switches to native BC mobile surfaces; `/m/checkin` kept as the canonical check-in handoff. |
| i18n | `opp.type.*` keys exist; `bc.mobile.community.*` pattern established. | Add `bc.mobile.community.events.*` / `.opportunities.*` VI+EN. |
| Telemetry | 7A allowlist module. | Add the 7 §81 metrics only — no titles/names/queries/credentials. |

---

## 4. FINAL CLASSIFICATION SUMMARY

- Events read (list/detail/preview): **LIVE_REUSABLE**
- Registration state read: **LIVE_NEEDS_MOBILE_ADAPTER** ✅ built
- Registration mutation: **LIVE_NEEDS_MOBILE_ADAPTER** ✅ built (canonical table)
- Registration cancellation: **NOT_AVAILABLE → DEFERRED** (no UI)
- Check-in: **LIVE_REUSABLE via handoff** to `/m/checkin` (registered viewers only)
- Agenda / feed / attendees / waitlist / NFC / sponsors: **NOT_AVAILABLE / DEFERRED** (no UI)
- Opportunities read (list/detail/preview): **LIVE_REUSABLE**
- Opportunity interest: **LIVE_NEEDS_MOBILE_ADAPTER** ✅ built (canonical table)
- Opportunity apply/CRM/contact-owner: **NOT_AVAILABLE** (VIEW_POSTER handoff instead)

No `bc_events`, `community_events_v2`, `bc_opportunities`, or
`mobile_opportunities` objects are created. All writes land in the canonical
`event_registrations` / `opportunity_interests` tables.

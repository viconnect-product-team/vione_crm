# BC-3.0 — Networking Domain Contract

Architecture Version: **Business Connect v1 (FROZEN)**. Contract only — no implementation.

## 1. Frozen relationship semantics (never merged)

| Concept                    | Cardinality             | Approval       | Ownership                  | Store                     |
| -------------------------- | ----------------------- | -------------- | -------------------------- | ------------------------- |
| **Saved Card**             | one-sided               | none           | owner-private              | `saved_business_cards`    |
| **Connection**             | mutual (2 participants) | request/accept | shared, participant-scoped | `user_connections` (new)  |
| **Company Membership**     | org role                | invite         | company-scoped             | `company_members`         |
| **Association Membership** | formal status           | admin          | association-scoped         | `memberships` / `members` |
| **Community Membership**   | future                  | future         | community-scoped           | reserved (BC-6)           |

A saved card is **never** an accepted connection. A connection is **never** a company/association/community membership.

## 2. Global connection lifecycle (state machine)

Statuses: `pending`, `accepted`, `declined`, `cancelled`, `disconnected`, `blocked` (future: `expired`).

Valid transitions and authorized actor:

| From     | To             | Actor                        |
| -------- | -------------- | ---------------------------- |
| none     | pending        | requester                    |
| pending  | accepted       | recipient                    |
| pending  | declined       | recipient                    |
| pending  | cancelled      | requester                    |
| accepted | disconnected   | either participant           |
| any      | blocked        | either participant (blocker) |
| blocked  | none/unblocked | blocker (if later supported) |

- Client **never** submits a target status. Every transition is a named service method; server validates current state + actor.
- Invalid transitions (e.g. requester accepting own request, recipient cancelling requester's request) are rejected server-side.

## 3. Data model (design only)

```
public.user_connections
  id                  uuid PK default gen_random_uuid()
  requester_user_id   uuid not null   -- auth.users.id
  recipient_user_id   uuid not null   -- auth.users.id
  status              text not null   -- validated by trigger (enum-like)
  source_type         text not null default 'manual'
  source_id           uuid null
  normalized_pair_key text not null   -- least(a,b)||':'||greatest(a,b) (generated/trigger)
  requested_at        timestamptz not null default now()
  responded_at        timestamptz null
  disconnected_at     timestamptz null
  created_at          timestamptz not null default now()
  updated_at          timestamptz not null default now()
```

Constraints:

- `CHECK (requester_user_id <> recipient_user_id)` — no self-connection.
- **Partial unique index** on `normalized_pair_key WHERE status IN ('pending','accepted','blocked')` — prevents duplicate + reverse-duplicate active/pending pairs while allowing a new request after decline/cancel/disconnect.
- `source_type` validated by trigger against the source taxonomy (§4).
- `status` validated by trigger; transition guard trigger enforces §2.
- `updated_at` maintained by `update_updated_at_column` trigger.

**Canonical pair key decision:** use `normalized_pair_key` (`least||greatest` of the two user ids) — deterministic, index-friendly, direction-agnostic for uniqueness while `requester/recipient` preserve direction for the lifecycle.

## 4. Connection source taxonomy

Allowed `source_type`: `business_card`, `saved_card`, `qr`, `nfc`, `event`, `meeting`, `association`, `community`, `company`, `marketplace`, `manual`, `referral`.

Rules: source identifies **context, not ownership**; `source_id` optional; server-normalized (reject arbitrary client strings); `source_id` must never leak a private resource id in public surfaces.

## 5. Identity & authorization contract

`requireGlobalNetworkUser()` returns:

```
{ userId: string; profileId?: string; accountStatus: string }
```

Uses `auth.uid()` + `GlobalIdentityContext` + `user_profiles` account status. **Does not** require `members` row, `association_id`, or `current_member_id()`.

Failure behavior:

- Unauthenticated → reject (401).
- Inactive/suspended account → deny mutations (reads of own connections allowed).
- No member row → **valid** (global users are first-class).
- No public Business Card → may still connect if recipient is discoverable through a permitted context.

Association networking continues to use `AssociationIdentityContext` + `member_id` + `net_*` RPCs unchanged.

## 6. Service contract

`GlobalConnectionService` (behind thin `requireGlobalNetworkUser` server fns):

- `sendRequest(targetUserId, source?)`
- `accept(connectionId)`
- `decline(connectionId)`
- `cancel(connectionId)`
- `disconnect(connectionId)`
- `block(targetUserId)` / `unblock(targetUserId)`
- `getState(targetUserId)`
- `listConnections()` / `listIncomingRequests()` / `listOutgoingRequests()`
- `listSuggestedConnections()` — contract only; deterministic reasons, no AI/fake data.

Layers: `GlobalConnectionRepository` (pure data access) → `GlobalConnectionService` (lifecycle + authorization) → `GlobalConnectionSDK` (client facade). `BusinessCardService` **must not** own networking logic; integration via SDK composition.

## 7. Business Card / Company / Interaction integration (deferred wiring)

- **Business Card:** Save Card and Connect stay separate; owner never connects to self; anon viewer → sign-in CTA; profile visibility always respected.
- **Company:** person↔company remains contextual metadata (`source_type='company'`, optional `source_id`). No company-to-company connections, followers, or messaging.
- **Interaction:** emit-later events — `connection_requested/accepted/declined/cancelled/disconnected`, `user_blocked`. Accepted connection **may** create one deterministic private Business Interaction (owner-scoped, dedup by mutation key). No cross-copy of private notes.

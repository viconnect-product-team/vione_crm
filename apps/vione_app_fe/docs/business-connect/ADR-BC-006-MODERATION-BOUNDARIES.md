# ADR-BC-006 — Moderation, Networking & Community Boundaries (FROZEN)

Status: **Accepted / Frozen** (BC-0.3). Documentation-only.

## 1. Business Card ownership vs moderation (frozen)

Ownership and association moderation are **separate authorities**. Verified
current state: `member_business_cards` has both `Owner updates own card`
(`member_id = current_member_id()`) and `Manager moderates assoc cards`
(`is_assoc_manager(association_id)`) UPDATE policies — they already coexist, but a
single `status` field currently conflates lifecycle and moderation.

### Frozen card cases

- **A. Global card, no association link** — `owner_user_id` only; `member_id`/
  `association_id` null. **Outside association moderation entirely.**
- **B. Association-linked card owned by user** — `owner_user_id` + `member_id` +
  `association_id`; association may moderate association-surface status only.
- **C. Legacy card, `member_id` set, `owner_user_id` unresolved** — legacy RLS
  authoritative; reported for backfill, never guessed (ADR-BC-003 stage 2).
- **D. Suspended association verification** — badge/verification suspended by
  association; owner cannot override.
- **E. Archived/hidden card** — owner lifecycle state; hides from public.
- **F. Platform moderation** — requires explicit platform permission
  (`is_platform_admin()`), independent of association role.

### Ownership × moderation matrix (frozen intent)

| Action                           | Anon                 | Auth unrelated | Owner   | Assoc member   | Assoc mgr/admin      | Platform mod |
| -------------------------------- | -------------------- | -------------- | ------- | -------------- | -------------------- | ------------ |
| read public fields               | ✅(published/public) | ✅             | ✅      | ✅             | ✅                   | ✅           |
| read members-only fields         | ❌                   | ❌             | ✅      | ✅(same assoc) | ✅(same assoc)       | ✅           |
| edit content                     | ❌                   | ❌             | ✅      | ❌             | ❌                   | ❌           |
| publish/hide/archive (lifecycle) | ❌                   | ❌             | ✅      | ❌             | ❌                   | ✅(override) |
| change slug                      | ❌                   | ❌             | ✅      | ❌             | ❌                   | ✅           |
| manage contact visibility        | ❌                   | ❌             | ✅      | ❌             | ❌                   | ❌           |
| view analytics                   | ❌                   | ❌             | ✅      | ❌             | ✅(aggregate, assoc) | ✅           |
| view leads                       | ❌                   | ❌             | ✅      | ❌             | ✅(assoc)            | ✅           |
| suspend association badge        | ❌                   | ❌             | ❌      | ❌             | ✅(B only)           | ✅           |
| suspend from assoc surface       | ❌                   | ❌             | ❌      | ❌             | ✅(B only)           | ✅           |
| platform suspend                 | ❌                   | ❌             | ❌      | ❌             | ❌                   | ✅           |
| delete                           | ❌                   | ❌             | ✅(own) | ❌             | ❌(never global)     | ✅           |

### Frozen rules

- Association manager **cannot** edit owner private content.
- Association manager **cannot** delete a global card (case A).
- Platform moderation requires **explicit platform permission**.
- Card owner **cannot** override association verification suspension (case D).
- Future schema **must separate** owner lifecycle status from association
  moderation status (two fields, not one).

## 2. Saved Cards privacy contract (future `saved_business_cards`)

- `owner_user_id = auth.uid()`, server-resolved.
- Saver's identity hidden from card owner by default.
- `personal_note`, `tags`, `follow_up_at` are **private to the saver**.
- Source metadata must not expose another user's private data.
- Card owner receives only **aggregate save count** (no per-saver identity) unless
  an explicit consent feature exists.
- Deleting a public card must not expose stale private snapshots.

State transitions (frozen handling):

- card hidden/private/suspended → saved entry retained but resolves to a limited/
  "unavailable" projection; saver's private note preserved.
- card deleted → saved entry references a tombstone; no stale card content served.
- viewer loses access → save persists, card content gated by current visibility.
- local browser save later syncs to account → server re-resolves `owner_user_id`
  and re-validates card visibility at sync time (client save is untrusted).

## 3. Global Connections authorization (future `user_connections`)

Participants: `requester_user_id`, `recipient_user_id`.

- Requester **server-resolved** from `auth.uid()`; client may nominate recipient only.
- Both participants may read the relationship; unrelated users cannot.
- Requester may cancel a pending request; recipient may accept/decline.
- Either connected participant may disconnect.
- Role/status never trusted from client.
- Self-connection prohibited; duplicate active/pending pairs prohibited.
- Block state (if added) overrides connection visibility/actions.

### Legacy adapter boundaries (frozen)

- `net_*` RPCs (`net_send_request`/`net_accept_request`/`net_decline_request`/
  `net_remove_connection`, verified SECURITY DEFINER + `current_member_id()`)
  remain association/member-scoped and unchanged.
- Global connection RPCs/functions **must not** call `current_member_id()` as a
  prerequisite.
- Adapter is **read-only initially**; **no automatic dual-write**.
- Migration only for uniquely mapped users, with audit + rollback.

## 4. Community authorization model (future)

Roles: `owner`, `admin`, `moderator`, `member`, `guest`.
Statuses: `invited`, `pending`, `active`, `suspended`, `left`, `removed`.
Visibility: `public`, `private`, `secret`. Join policy: `open`, `approval`, `invite_only`.

### Permission matrix (frozen intent)

| Action                        | guest/anon      | member(active) | moderator | admin | owner |
| ----------------------------- | --------------- | -------------- | --------- | ----- | ----- |
| view public community profile | ✅(if public)   | ✅             | ✅        | ✅    | ✅    |
| view member directory         | ❌(priv/secret) | ✅             | ✅        | ✅    | ✅    |
| view posts/documents          | public only     | ✅             | ✅        | ✅    | ✅    |
| create post                   | ❌              | ✅             | ✅        | ✅    | ✅    |
| comment                       | ❌              | ✅             | ✅        | ✅    | ✅    |
| create event                  | ❌              | policy-based   | ✅        | ✅    | ✅    |
| publish opportunity           | ❌              | policy-based   | ✅        | ✅    | ✅    |
| invite member                 | ❌              | policy-based   | ✅        | ✅    | ✅    |
| approve member                | ❌              | ❌             | ✅        | ✅    | ✅    |
| remove/suspend member         | ❌              | ❌             | ✅        | ✅    | ✅    |
| edit rules                    | ❌              | ❌             | ❌        | ✅    | ✅    |
| moderate content              | ❌              | ❌             | ✅        | ✅    | ✅    |
| archive community             | ❌              | ❌             | ❌        | ✅    | ✅    |
| transfer ownership            | ❌              | ❌             | ❌        | ❌    | ✅    |

### Frozen rules

- Role always server-resolved.
- Private/secret content requires **active** membership.
- Suspended/removed members lose access immediately.
- Community owner does **not** gain access to private Business Card fields.
- Association role does not imply community role, and vice versa.

## Security impact

Prevents privilege confusion across ownership, association moderation, community
roles, and legacy vs global networking. All authority server-resolved.

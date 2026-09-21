# BC-Mobile-5E — Connection Handshake Engine

Status: FROZEN contract. Date: 2026-07.

5E turns "having contact" into "mutually connected" through an EXPLICIT,
two-sided handshake between platform identities. It builds NO new identity,
NO new connection model, NO new data model: it reuses the frozen Global
Networking state machine (BC-3.1A/B/F) and adds exactly one new capability —
an OPAQUE, token-scoped handshake entry from the Public Digital Card (5A/5D).

---

## 1. Pre-build audit (REUSE / EXTEND / REPLACE)

| Capability | Existing contract | Decision |
|---|---|---|
| Send request | `global_connection_send_request_guarded` RPC (idempotent `mutationKey`, per-user rate limit, 7-day resend cooldown, canonical pair uniqueness) — `GlobalConnectionService.sendRequest` | REUSE |
| Accept / decline / withdraw / disconnect | `global_connection_accept|decline|cancel|disconnect` RPCs + `GlobalConnectionService` (actor-role enforced server-side) | REUSE |
| Pair state read | `global_connection_get_pair_state` → `GlobalConnectionService.getState` (direction-aware `PairState`) | REUSE |
| Self-connection prevention | RPC `global_connection_self_connect` + unique open state + canonical pair; tested in `global-network-state-machine.bc31a` | REUSE |
| Notifications | DB trigger `trg_gn_connection_insert` → `gn_notifications` (`connection_request`, `connection_accepted`) + prefs + unread count (BC-3.1F) | REUSE |
| Network list | `useBusinessConnectNetwork` — accepted connections first-class, precedence connection > saved > guest (frozen 2A) | REUSE |
| Journey | Graph `CONNECTED_TO` → exactly one "connected" milestone (frozen 2D); accept pipeline already feeds the graph projection | REUSE |
| Person Detail | Connected date + direction narrative already rendered (2C) | REUSE |
| Auth continuation | `/auth?redirect=` with same-origin `safeRedirect` validation (open-redirect protected) | REUSE |
| Counterpart identity | `resolvePublicCounterpartsFn` — privacy-safe public summaries only | REUSE |
| Opaque public handshake (token → owner) | — | EXTEND: new `identity-connect` module (server-resolves the share token; owner id never crosses the wire) |
| Public Card Connect CTA | 5D deliberately had no Connect slot | EXTEND: `PublicCardConnectPanel` on `/c/:token` |
| Incoming requests surface | `listIncomingRequestsFn` existed, no mobile UI | EXTEND: Network entry row + `/connect-app/network/requests` |
| Parallel connection system | — | REPLACE: none — forbidden by invariants |

## 2. Invariants

- ONE canonical identity per user (5A) — handshake never creates identity.
- ONE share token per active link (5A) — the token is the ONLY public handle.
- NO duplicate connection records — canonical pair + unique open state (RPC).
- NO self-connections — RPC-enforced, UI additionally hides the action.
- NO silent auto-connect — every transition is an explicit human action.
- `PublicIdentityCard` (anonymous DTO) is UNCHANGED: no ownership, no
  relationship state, no internal ids.
- The viewer-relative connection state on `/c/:token` requires AUTH; the
  anonymous projection stays byte-identical.
- Graph/Network/Journey/Notifications consume the SAME events — no parallel
  timeline, no per-surface state.

## 3. State contract (viewer-relative, authenticated)

`IdentityConnectionState` — the ONLY handshake shape crossing the wire:

| `state` | Meaning | Actionable |
|---|---|---|
| `self` | viewer owns the card | none (UI hides the panel action) |
| `none` | no open pair | Connect |
| `outgoing_pending` | viewer requested | Withdraw (uses `connectionId`) |
| `incoming_pending` | counterpart requested | Accept / Decline (uses `connectionId`) |
| `connected` | mutual | none (status only) |
| `unavailable` | token invalid/revoked, identity disabled, pair blocked | none — neutral, identical to public failure semantics |

Terminal statuses (`declined`, `cancelled`, `disconnected`) map to `none` —
a fresh request is allowed subject to the RPC's resend cooldown. Blocked
pairs (either direction) map to `unavailable`: the UI never reveals a block.

## 4. Privacy

- The server resolves `shareToken → owner_user_id` with the privileged
  server client in a SINGLE lookup (same pattern as the 5A public resolver).
  The owner id is used only to call the existing user-scoped services and is
  NEVER serialized to the client.
- No auto-created accounts, no silent identity creation.
- Open-redirect: continuation carries only the internal `/c/<token>` path
  through `/auth?redirect=`, validated same-origin by the existing auth
  route; no external URLs ever accepted.
- Telemetry: allowlisted names only (`PUBLIC_CARD_CONNECT_*`,
  `CONNECTION_REQUEST_*`) — never tokens, ids, names, or payloads.

## 5. Error handling

- RPC/domain failures map to ONE generic toast ("couldn't complete"); the
  last stable state stays rendered. No internal codes, pair internals, or
  owner identity in any message.
- Rate-limit / cooldown / blocked rejections surface as the same generic
  toast; the UI then refetches the truthful state (the RPC remains
  authoritative — e.g. a resend inside the cooldown simply stays pending).

## 6. Surfaces

- `/c/:token` — `PublicCardConnectPanel`: anonymous → sign-in CTA with safe
  continuation; authenticated → Connect / Pending+Withdraw / Accept+Decline /
  Connected / hidden (self, unavailable).
- Network — a calm "Lời mời kết nối · N" entry row (only while N > 0) →
  `/connect-app/network/requests` (accept/decline per request, bounded list,
  empty/loading/error states, a11y-complete).
- Person Detail — unchanged: connected date + direction (2C freeze).
- Notifications — unchanged: trigger-driven request/accepted items (3.1F).

## 7. Out of scope (deferred)

Block/unblock UX, disconnect UX from mobile, recommendation-driven Connect
(desktop workspace owns it), push delivery of notifications, request expiry.

# BC-3.0 — Connection State Machine

Architecture Version: **Business Connect v1 (FROZEN)**. Formal spec only.

## 1. States

| State          | Meaning                                                     | Terminal?          |
| -------------- | ----------------------------------------------------------- | ------------------ |
| `none`         | no active edge (implicit / after cancel/decline/disconnect) | —                  |
| `pending`      | request sent, awaiting recipient                            | no                 |
| `accepted`     | mutual, active connection                                   | no                 |
| `declined`     | recipient rejected request                                  | yes\*              |
| `cancelled`    | requester withdrew before response                          | yes\*              |
| `disconnected` | previously accepted, ended by a participant                 | yes\*              |
| `blocked`      | one participant blocked the other                           | no (until unblock) |
| `expired`      | reserved (future) — pending aged out                        | yes\*              |

\* terminal for that row; a **new** request may create a new row later
(pair-key uniqueness only spans `pending`/`accepted`/`blocked`).

## 2. Transition table

| #   | From                  | Event      | To           | Authorized actor   | Guard                                                                            |
| --- | --------------------- | ---------- | ------------ | ------------------ | -------------------------------------------------------------------------------- |
| 1   | none                  | request    | pending      | requester          | rate limit; not self; not already active/pending/blocked; recipient discoverable |
| 2   | pending               | accept     | accepted     | recipient          | actor = recipient                                                                |
| 3   | pending               | decline    | declined     | recipient          | actor = recipient                                                                |
| 4   | pending               | cancel     | cancelled    | requester          | actor = requester                                                                |
| 5   | accepted              | disconnect | disconnected | either participant | actor ∈ participants                                                             |
| 6   | pending/accepted/none | block      | blocked      | blocker            | actor ∈ participants (or initiating a block)                                     |
| 7   | blocked               | unblock    | none         | blocker only       | actor = blocker                                                                  |
| 8   | pending               | expire     | expired      | system             | age > TTL (future)                                                               |

## 3. Rejected transitions (must fail server-side)

- requester accepting / declining own request (2,3 by requester).
- recipient cancelling the requester's request (4 by recipient).
- accepting a non-pending row.
- disconnecting a non-accepted row.
- any transition by a non-participant.
- re-requesting while an active/pending/blocked row exists (uniqueness).
- self-connection (requester = recipient).

## 4. Invariants

- Exactly two participants per row; direction preserved by `requester_user_id` /
  `recipient_user_id`; uniqueness enforced direction-agnostically via `normalized_pair_key`.
- Every non-`none` transition sets `updated_at`; accept sets `responded_at`;
  disconnect sets `disconnected_at`.
- Status is validated by a `validate_user_connection_status` trigger; transitions
  are validated by a `guard_user_connection_transition` trigger reading `OLD`/`NEW`.
- Client never supplies target status; each event is a distinct service method.

## 5. Event emission (deferred to implementation phase)

Each accepted transition emits a domain event for later consumers:
`connection_requested`, `connection_accepted`, `connection_declined`,
`connection_cancelled`, `connection_disconnected`, `user_blocked`, `user_unblocked`.
No messaging, feed, or follower semantics are implied.

# ADR-BC-003 — Identity Compatibility & Transition (Cards, Networking, Marketplace)

Status: **Accepted** (BC-0.2). Documentation-only. No stage below is implemented
in BC-0.2.

## Context

BC-0.1 mapped Business Cards (`member_business_cards`), Networking
(`connections` + `net_*`), and Marketplace (`products`) as member-scoped
(C/B-class). Business Connect needs user-scoped equivalents without breaking
live association flows or detaching existing data.

## Decision

Adopt additive, staged transitions; keep legacy tables and RLS authoritative
until cutover. No renames, no big-bang migrations, no fake member rows.

### Business Card bridge

Keep `member_business_cards` name in early phases. Additive fields:

- `owner_user_id uuid` (nullable initially), `member_id` retained,
  `association_id` retained (optional context).
  Backfill: `owner_user_id = members.user_id` where linked; deterministic and
  idempotent; rows without a linked user are **reported and handled explicitly**
  (never silently assigned).
  Future card rules: every new global card requires `owner_user_id`; `member_id`
  and `association_id` may be null; association-linked cards remain moderatable by
  that association; unlinked global cards are **not** moderatable by unrelated
  associations.
  Transition stages (deferred): 1) add field → 2) backfill → 3) dual-read
  compatibility → 4) move ownership guards to user identity → 5) make
  `owner_user_id` mandatory for new cards → 6) optional later table rename.

### Networking separation

Legacy **Association Network** stays member-based (`connections`, `net_*`),
authoritative inside association member flows. Future **Global Business Network**
(`user_connections`) is user-to-user, independent from `members`, and records
source context (card, QR, NFC, event, community). Adapter: display unified
relationship state where appropriate with no duplicate visible connections;
global connection authoritative inside Business Connect. Migration/cutover
deferred.

### Marketplace

Options: (A) keep Association Marketplace isolated initially; (B) add user-owned
marketplace resources later; (C) add an adapter/scope model only after Global
Identity and Global Network exist. Prohibited: fake member creation to publish,
client-provided member ownership, big-bang conversion of existing rows.

## Alternatives considered

- **Rename tables now / migrate in one shot** — rejected: live RLS keys on
  current names; high outage and detach risk (guarantee: no silent detach).
- **Reuse `connections` for user-to-user** — rejected: schema/RLS are member-id
  based and same-association only (BC0 blocker B3).

## Consequences

Dual-read/dual-write windows; adapters needed to unify UI state.

## Migration impact

Backfill must report unlinked rows; idempotent and reversible per stage.

## Security impact

Ownership guards move to user identity only after dual-read verified; unrelated
associations never gain moderation of global cards. All ownership server-resolved.

## Operational impact

Staged rollout allows verification and rollback between stages.

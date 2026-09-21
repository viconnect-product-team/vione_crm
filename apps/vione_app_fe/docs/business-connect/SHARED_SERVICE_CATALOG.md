# Shared Service Catalog (FROZEN — BC-0.4)

Per-domain contract for every Shared Business Service. Documentation-only.
All services: **consume only Platform Core**, are **scope-agnostic** (ADR-BC-008),
and are **reusable by** Association Hub, Member PWA, Business Connect, Community,
Enterprise, and future products unless noted.

---

## Business Card

- **Purpose:** create/manage/share a person's business card; public projection.
- **Owner:** Shared Business Service.
- **Inputs:** owner identity, card fields, publish/primary flags, NFC payload.
- **Outputs:** card records, public projection, QR/NFC assets, audit events.
- **Dependencies:** Auth/Identity, Authorization, Audit, Storage, Media.
- **Identity context:** `owner_user_id` (personal); optional `association_id`.
- **Scope:** personal → association(optional) → public(optional).

## Networking

- **Purpose:** user-to-user connections, requests, directory.
- **Owner:** Shared Service (global). Legacy association networking stays in Assoc.
- **Inputs:** requester/target identity, connection state.
- **Outputs:** connection edges, directory projection, audit.
- **Dependencies:** Auth/Identity, Authorization, Notification, Search.
- **Identity context:** `user_id ↔ user_id`.
- **Scope:** personal → community(future). Adapter unifies legacy display.

## Companies

- **Purpose:** company profiles/entities that cards & marketplace reference.
- **Owner:** Shared Service.
- **Inputs:** company data, membership/ownership links.
- **Outputs:** company records, public projection.
- **Dependencies:** Auth/Identity, Storage, Search, Audit.
- **Scope:** personal → association → community(future) → public(optional).

## Meetings

- **Purpose:** schedule/manage meetings between users/scopes.
- **Owner:** Shared Service.
- **Inputs:** participants, time, agenda.
- **Outputs:** meeting records, invites, reminders.
- **Dependencies:** Auth/Identity, Notification, Realtime, Audit.
- **Scope:** personal → association → community(future).

## Marketplace Foundation

- **Purpose:** listings/offers engine reused across scopes.
- **Owner:** Shared Service.
- **Inputs:** owner identity, listing data, scope.
- **Outputs:** listings, search projection, moderation hooks.
- **Dependencies:** Auth/Identity, Authorization, Search, Media, Audit.
- **Scope:** association(today) → community(future) → personal(future) → public(optional).

## Events Foundation

- **Purpose:** event definition, tickets, QR check-in engine.
- **Owner:** Shared Service.
- **Inputs:** organizer identity, event/ticket config, QR fields.
- **Outputs:** events, tickets, check-in logs, realtime attendance.
- **Dependencies:** Auth/Identity, Realtime, Storage, Notification, Audit.
- **Scope:** association → community(future) → platform.

## Messaging

- **Purpose:** direct/threaded messages between users/scopes.
- **Owner:** Shared Service.
- **Inputs:** participants, message content.
- **Outputs:** threads, unread state, notifications.
- **Dependencies:** Auth/Identity, Realtime, Notification, Audit.
- **Scope:** personal → association → community(future).

## Documents

- **Purpose:** upload/share/manage documents per scope.
- **Owner:** Shared Service.
- **Inputs:** owner identity, files, sharing scope.
- **Outputs:** document records, access-controlled URLs.
- **Dependencies:** Storage, Auth/Identity, Authorization, Audit, Search.
- **Scope:** association → community(future) → personal.

## Search

- **Purpose:** business-level query across cards/companies/marketplace/events.
- **Owner:** Shared Service (over Platform Core search infra).
- **Inputs:** query, scope, identity.
- **Outputs:** scoped result projections.
- **Dependencies:** Search infra (Core), Authorization.
- **Scope:** personal → association → community(future) → platform → public(optional).

## AI

- **Purpose:** persona-based assistant (Association/Business/Community).
- **Owner:** Shared Service (over Platform Core AI Gateway).
- **Inputs:** user identity, persona, context, prompt.
- **Outputs:** responses, `ai_request_audit` rows, fallback status.
- **Dependencies:** AI Gateway (Core), Authorization, Audit, Config/Flags.
- **Scope:** personal → association → community(future); platform config.

## Media

- **Purpose:** image/asset generation & transforms (QR, avatars, covers).
- **Owner:** Shared Service.
- **Inputs:** source assets/params.
- **Outputs:** stored media, public URLs.
- **Dependencies:** Storage, Auth/Identity.
- **Scope:** follows the consuming domain's scope.

## Analytics

- **Purpose:** business metrics over events/usage.
- **Owner:** Shared Service (over Core analytics foundation).
- **Inputs:** events, scope, identity.
- **Outputs:** aggregates, dashboards data.
- **Dependencies:** Analytics foundation (Core), Authorization.
- **Scope:** personal → association → community(future) → platform.

## Notification

- **Purpose:** templated, localized notifications across channels.
- **Owner:** Shared Service (templates) over Core notification infra.
- **Inputs:** recipient identity, template, payload, locale.
- **Outputs:** notification records, delivery, unread state.
- **Dependencies:** Notification infra (Core), Auth/Identity, i18n.
- **Scope:** personal → association → community(future); platform.

## Business Meeting Service (planned, BC-4.1B)

- **Owner:** Shared Service over Core (meetings aggregate + proposals).
- **Inputs:** organizer/participant identity (server-resolved), proposal
  (start/end/timezone), source context, mutation key.
- **Outputs:** meeting aggregate + versioned proposals, participant responses,
  private follow-ups/notes, derived Business Interaction events, notifications.
- **Dependencies:** Global Identity, Identity Bridge, Business Interaction
  (adapter), Notification infra, rate-limit + idempotency infra, i18n, ICS util.
- **Scope:** participant-private; platform. No Association/Company admin access.

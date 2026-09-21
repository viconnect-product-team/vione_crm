# ADR-BC-009 — Product Surfaces (FROZEN)

Status: **Accepted / Frozen** (BC-0.4). Documentation-only.

## Context

Shared Business Services are scope-agnostic. A **Product Surface** composes them
under one identity context, navigation, and route namespace. This ADR freezes the
official surfaces, their allowed/forbidden domains, and route namespaces. It does
**not** create routes (those already existing under `/app`, `/m`, `/b` are
unchanged; nothing new is added here).

## Frozen route namespaces

| Surface                  | Namespace                 | Public routes                                         |
| ------------------------ | ------------------------- | ----------------------------------------------------- |
| Association Admin        | `/app/*`                  | —                                                     |
| Association Member (PWA) | `/m/*`                    | `/b/$slug` (public card)                              |
| Business Connect         | `/connect/*` (future)     | `/b/$slug`, `/community/$slug`, `/h/$slug`, `/verify` |
| Community Workspace      | `/community/*` (future)   | `/community/$slug`                                    |
| Future (Company)         | `/company/$slug` (future) | `/company/$slug`                                      |

## A. Association Admin — `/app/*`

- **Purpose:** manage an association: members, fees, renewals, events, campaigns,
  sponsors, business-card moderation, audit.
- **Users:** association staff/managers/admins.
- **Identity:** Platform User **+** `current_member_id()` **+** association role
  (`is_assoc_manager` / `has_assoc_role`).
- **Permissions:** association-scoped; platform admins may elevate.
- **Allowed domains:** Members, Fees/Renewals (association), Events, Campaigns,
  Sponsors, Documents (association), Notification, Audit, Business Card
  (moderate, not edit private content), Association Marketplace, AI (association
  persona).
- **Forbidden domains:** editing private Business Card content, deleting global
  cards, community moderation, platform config, another association's data.

## B. Association Member — `/m/*` (PWA, native-feel)

- **Purpose:** member self-service: membership pass, renewals, events check-in,
  own business card, networking, notifications.
- **Identity:** Platform User + own `member_id`.
- **Navigation:** mobile-first bottom nav; native app feel.
- **Allowed domains:** own Business Card, own Membership Identity, Events
  (attend/check-in), Meetings (personal/association), Documents (association-
  shared), Notifications, Networking (association legacy + own global),
  AI (association persona).
- **Forbidden domains:** other members' private data, association admin,
  moderation, platform config, community admin.

## C. Business Connect — `/connect/*` (future)

- **Purpose:** cross-association global business networking, cards, business
  marketplace, business AI — for Platform Users regardless of membership.
- **Identity:** Platform User (`auth.uid()`); **does not require** a `members`
  row (BC-0.2 invariant: login ≠ member).
- **Navigation:** global profile, global directory, connections, marketplace, AI.
- **Allowed domains:** global Business Card, global Networking, Companies,
  business Marketplace, Meetings (personal/community), Documents (personal),
  AI (business persona), Notifications (personal).
- **Forbidden domains:** association member/fee/renewal management, association
  admin/moderation, platform config, community moderation.

## D. Future Community Workspace — `/community/*` (future)

- **Purpose:** self-organizing business communities (not associations).
- **Identity:** Platform User + community membership + community role.
- **Navigation:** feed, members, events, marketplace, documents, AI, moderation.
- **Allowed domains:** Community membership/roles/rules, Feed, community
  Events/Marketplace/Documents, Business Card Directory (community scope),
  Moderation, Affiliate foundation, AI (community persona).
- **Forbidden domains:** association member/fee logic, platform config, editing
  another community's data, becoming an Association.

## Frozen rules

- A surface **composes** Shared Services; it owns no reusable domain logic.
- Identity context is fixed per surface and server-resolved.
- Forbidden domains are hard boundaries enforced by authorization, not UI hiding.
- No new routes created in BC-0.4.

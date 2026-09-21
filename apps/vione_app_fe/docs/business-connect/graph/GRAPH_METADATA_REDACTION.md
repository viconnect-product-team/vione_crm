# GRAPH_METADATA_REDACTION.md — BC-4.1

Every DTO strips `metadata` down to the registry entry's `metadataAllowlist`.
Fields outside the allowlist (email, phone, notes, salaries, moderation
state, source-system identifiers, authority fields, raw audit) are dropped
before the DTO leaves the service layer.

## Node allowlists (v1)

- `person`: `displayName`, `headline`, `avatarUrl`
- `company`: `name`, `slug`, `logoUrl`
- `association` / `community`: `name`, `slug`
- `event`: `title`, `startsAt`
- `meeting`: `title`, `scheduledAt`
- `marketplace_listing`: `title`, `slug`
- `opportunity`: `title`
- `project` / `document`: `title`
- `location`: `name`, `geo`
- `tag`: `slug`, `label`

## Edge allowlists (v1)

- `CONNECTED_TO`: `source`
- `WORKS_FOR`: `role`, `isCurrent`
- `MEMBER_OF`: `role`
- `ATTENDED`: `ticketType`
- `MET`: `context`
- `SAVED_CARD`: `source`
- others: `[]` (no metadata exposed)

Verified by `graph-registry.bc41.test.ts`.

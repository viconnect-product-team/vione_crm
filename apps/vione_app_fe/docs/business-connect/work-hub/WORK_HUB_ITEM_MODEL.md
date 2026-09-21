# Work Hub — Item Model (BC-8.0)

`WorkHubItemDTO` is the sole card contract between the domain layer and
the UI. It is intentionally serialization-stable and PII-safe.

## Identity

- `id` — deterministic `sourceType:sourceRecordId:itemKind`.
- `dedupeKey` — `sourceType:sourceRecordId` (§32). Multiple resolver
  outputs sharing the same key collapse; the winner is decided by
  category precedence → priority tier → id order.

## Classification

- `sourceType`, `itemKind` — from `WORK_HUB_KIND_REGISTRY`.
- `category` — `overdue | needs_action | due_soon | upcoming | waiting | recent`.
- `priority` — P0..P7 (lower = more urgent).
- `urgency` — `critical | high | normal | low | informational`.

## Display (PII-safe)

`safeDisplayData` allows only: counterpart handle, counterpart display
name, avatar URL, and an allowlisted `scalars` bag. No user IDs, no
tenant IDs, no note bodies, no outcome text, no calendar details, no
raw event payloads (§6).

## Action routing

`action.targetRoute` is a TanStack route path; the UI navigates via
`<Link to>` + `targetParams` / `targetSearch`. Inline mutations are
restricted to the allowlist in `WORK_HUB_INLINE_MUTATION_CAPABILITIES`
and are gated by `viewerPermissions.canInlineMutate`.

## Freeze

`registryVersion` is stamped into every item and every cursor. Consumers
must treat unknown values as opaque and bump the version whenever the
kind set, category set, or priority tiers change.

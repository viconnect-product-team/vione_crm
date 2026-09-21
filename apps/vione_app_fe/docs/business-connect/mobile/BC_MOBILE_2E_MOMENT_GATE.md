# BC_MOBILE_2E_MOMENT_GATE — Meeting Moment: Capture → Context → Journey

Status: **GO**. Architecture: `BC_MOBILE_2E_MOMENT_ARCHITECTURE.md` (NEW_DOMAIN_REQUIRED).

## Shipped

- **Domain** — `business_relationship_moments` + `business_relationship_moment_media`
  (RLS owner-only; `brm_validate_moment_target` SECURITY DEFINER trigger re-checks
  target authorization server-side), private `relationship-moments` bucket with
  owner-path storage policies.
- **Core** — `moment.types.ts` (limits, error codes, DTOs), `moment.service.ts`
  (prepare/finalize, idempotent via `clientToken`), `moment.server.ts` (fail-closed
  target authorization mirroring 2C), `moment.functions.ts` (RPC adapters).
- **Image pipeline** — `moment-image.ts`: canvas re-encode → JPEG ≤2048px, EXIF
  stripped by construction, quality stepped to ≤2MB.
- **Capture UI** — V action sheet (`meetingMoment` now available, navigates
  in-shell) → `MomentPersonPicker` (reuses frozen 2A Network composition) →
  `MomentComposer` (prepare → bounded-concurrency upload → finalize; every
  failure stays in place with retry; success lands on Person Detail with a
  role="status" saved banner).
- **Journey merge** — composite cursor `{ g, ge, lo, ms }` merges graph events
  (u:) + card_saved milestone (c:) + owner's own active moments in exact
  (occurredAt DESC, id DESC) order; each page = ≤1 graph page + ≤1 indexed
  moments query. Photos minted to 1h signed URLs post-compose; storage paths
  never cross the RPC boundary.
- **Entry points** — Person Detail "Lưu khoảnh khắc" action; V sheet.
- **Route fix** — `/connect-app/network` parent is now Outlet-only; the list
  moved to the index route. `$personId` renders correctly (2E nesting bug fixed).
  `/connect-app/moment` (picker) and `/connect-app/moment/$personId` (composer).

## Verification

- `business-connect-mobile-person-journey.bcm2d.test.tsx` — 28/28 PASS
  (fixture gained the `listMoments` port; cursor test updated to the composite
  contract).
- `bcm2a` / `bcm2b` / navigation shards — see latest run.
- tsgo clean.

## Deferred

- Moment edit/delete, photo viewer, meeting-linked moments, counterpart-visible
  moments (owner-private by design in 2E).

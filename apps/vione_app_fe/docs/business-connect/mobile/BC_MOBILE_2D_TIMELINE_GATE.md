# BC_MOBILE_2D_TIMELINE_GATE

Status: GO — BC-Mobile-2D CLOSED.
Date: 2026 (post BC-Mobile-2C).

## Delivered

- **Read model** — `src/lib/business-connect/mobile/person-journey.{types,compose,server,functions}.ts`.
  Authorization-first composition (pure ports), thin RPC boundary
  (`bcMobilePersonJourneyFn`, GET, authed, zod-validated), canonical reads
  only: `GlobalConnectionService.getState`, read-only
  `findNodeByExternalRef`, BC-4.2 `pairTimeline` keyset read, owner-scoped
  `saved_business_cards` SELECT.
- **Hook** — `src/hooks/use-business-connect-person-journey.ts`. Bounded
  infinite pagination (5/page, max 20), viewer-scoped query key,
  staleTime 60s, retry 1, no realtime.
- **UI** — `src/components/business-connect/mobile/PersonJourney.tsx`,
  integrated into `PersonDetail` below the relationship narrative. Dot +
  hairline list, localized dates, quiet empty state, error + retry,
  "Xem thêm" (44px+), skeleton that never blocks the identity hero.
- **i18n** — `bc.mobile.person.journey.*` (VI/EN).
- **Contract** — `BC_MOBILE_2D_TIMELINE_DATA_CONTRACT.md`.

## Exit-gate verification

| Gate | Evidence |
| --- | --- |
| Data Contract complete (§1 source audit) | Contract §1: CANONICAL/OPTIONAL/UNSUPPORTED per source. |
| Read model read-only (no write-on-read) | Static guard: no `registerNode(/createEdge(/ensurePersonNode(/graphConnectFn/.connect(` reachable from the 6 read-model modules; compose returns truthful empty when nodes are missing (2 tests). |
| Canonical timeline only | Event-kind set asserted == `JOURNEY_EVENT_KINDS`; every kind is `CONNECTED_TO` or `INTRO_*`; unknown kinds dropped. |
| Authorization fail-closed | Non-accepted/blocked/self → `unavailable` without touching the graph; c: owner-miss → `unavailable`; malformed ids → `unavailable` with zero dependency calls. |
| Privacy / whitelist DTO | Item keys exactly `{id,kind,occurredAt,provenance}`; serialized page contains no `metadata`, node ids, `dedupeKey`, tenant fields. |
| Deterministic pagination | Cursor passthrough + nextCursor propagation; limit clamp [5,20]; order preserved `occurred_at DESC`. |
| Cache isolation | Query key includes viewer id; account switch refetches (test). |
| Failure isolation | Journey loading/error never blocks the identity hero; retry recovers (3 integration tests). |
| i18n | VI + EN rendering tests for labels, empty state. |
| A11y | axe = 0 violations, light AND dark mode. |
| Regression | Mobile suite 150/150 + 2D shard 28/28 = 178/178 green. |

## Backend reality

All runtime data comes from live reads (RLS-scoped). No mock fixtures.
Test doubles exist only in the jsdom shard at the RPC/SDK boundary.

## Deferred (explicit)

Meeting milestones (projection NOT_READABLE), SAVED_CARD/MET producers,
realtime refresh, milestone navigation, cross-source dedupe (undefined
behavior by design — single source per namespace).

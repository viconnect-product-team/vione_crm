# RELATIONSHIP_TIMELINE_PRESENTATION_REGISTRY

**Slice:** BC-7.5C
**Module:** `src/lib/graph/relationship-timeline/presentation.ts`

Frozen UI-only mapping from `eventType` (edge kind or projected lifecycle kind) to a `TimelinePresentation`:

| Field         | Meaning                                                             |
| ------------- | ------------------------------------------------------------------- | -------------- | ----------------------------------- |
| `icon`        | Lucide icon rendered in the item avatar                             |
| `category`    | UI grouping category (mirrors `eventCategory`)                      |
| `importance`  | `low                                                                | normal         | high` — controls visual accent only |
| `actorPolicy` | `actor-if-visible                                                   | always-neutral | system`                             |
| `cta`         | Discriminated union `{ kind, label }` referencing a canonical route |

## Guarantees

- Registry is `Object.freeze`-d.
- Unknown kinds resolve to `UNKNOWN_PRESENTATION` — no throw, generic label (`bc.timeline.unknown`), no CTA.
- Registry does **not** change source event taxonomy or category mapping (`./mapping.ts` remains authoritative for `eventCategory` / `sourceDomain` on the DTO).
- Actor policy is presentation guidance for future actor-aware UI; today the item component never renders raw actor IDs.

## CTA target resolution

`ctaHrefFor(cta)` in `src/components/business-connect/timeline/internals.ts` maps CTA `kind` to canonical routes:

| Kind           | Route                                      |
| -------------- | ------------------------------------------ |
| `introduction` | `/business-connect/introductions/requests` |
| `meeting`      | `/business-connect/meetings`               |
| `outcome`      | `/business-connect/introductions/outcomes` |
| `connection`   | `/business-connect/connections`            |
| `none`         | (no CTA rendered)                          |

Unknown kinds and legacy aliases (`INTRO_DELIVERED`, `INTRO_OUTCOME`) point to the same canonical routes; deep-linking to raw source IDs is intentionally avoided since projected DTOs do not authorize such lookups.

## Supported event kinds (v1)

Graph: `CONNECTED_TO, MET, FOLLOWED, FOLLOWED_BY, SAVED_CARD, SAVED_BY, WORKS_FOR, EMPLOYS, MANAGES, MANAGED_BY, MEMBER_OF, HAS_MEMBER, ATTENDED, HAD_ATTENDEE`.
Introduction delivery: `INTRO_DELIVERY_{CREATED,DELIVERED,ACKNOWLEDGED,DECLINED,EXPIRED}`.
Introduction outcome: `INTRO_OUTCOME_{CREATED,CONNECTED,PROGRESSING,CLOSED_SUCCESS,CLOSED_NO_FIT,CLOSED_LOST}`.
Meeting: `MEETING_{CREATED,PROPOSED,CONFIRMED,COMPLETED,CANCELLED,RESCHEDULED,DECLINED}`.
Legacy: `INTRO_DELIVERED, INTRO_OUTCOME`.

Any kind absent from this list renders through `UNKNOWN_PRESENTATION`.

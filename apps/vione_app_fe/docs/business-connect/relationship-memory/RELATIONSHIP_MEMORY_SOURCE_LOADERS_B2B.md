# BC-9.1 Turn B2b-i — Source Loaders

**Status:** CLOSED / GO
**Scope:** authorization-safe canonical loaders for the seven frozen extractors.
**Excluded:** persistence, merge, provenance, links, worker orchestration.

## Contract

Every loader is a server-only function `load…Source(sb, receipt)` that returns
a single, Zod-validated safe DTO. Loaders are pure with respect to the DB
snapshot: they read canonical tables, verify ownership + version, and project
only the fields the paired extractor is allowed to see.

## Guarantees per loader

| Loader                          | Source domain          | Ownership check                                                                      | Freshness check                                  |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `loadMeetingOutcomeSource`      | `meeting_outcome_safe` | `recorded_by_user_id === owner` OR `business_meeting_participants.user_id === owner` | `business_meeting_outcomes.version`              |
| `loadFollowUpSource`            | `follow_up_safe`       | `business_meeting_follow_ups.owner_user_id === owner`                                | `follow_ups.version`                             |
| `loadAgendaSource`              | `agenda_safe`          | at least one agenda item's `owner_user_id === owner`                                 | aggregate sum of item versions                   |
| `loadRelationshipProfileSource` | `person_profile_safe`  | self OR canonical `user_connections` edge                                            | `user_profiles.updated_at` (epoch-second bucket) |
| `loadBusinessCardSource`        | `person_profile_safe`  | `member_business_cards.owner_user_id === owner` AND `status === 'published'`         | `updated_at` (epoch-second bucket)               |
| `loadIntroductionSource`        | `introduction_safe`    | requester or intermediary                                                            | `introduction_requests.version`                  |
| `loadManualMemorySource`        | `work_hub_items`       | `sourceRecordId` prefix `manual/<owner>/...`                                         | `sourceVersion` (canonical text hash)            |

## Failure modes

Stable error codes only:

- `RELATIONSHIP_MEMORY_SOURCE_NOT_FOUND` — canonical row missing / hidden
- `RELATIONSHIP_MEMORY_SOURCE_FORBIDDEN` — owner not authorized on the source
- `RELATIONSHIP_MEMORY_SOURCE_STALE` — `sourceVersion` no longer matches
- `RELATIONSHIP_MEMORY_EXTRACTOR_NOT_FOUND` — dispatcher can't route
- `RELATIONSHIP_MEMORY_EXCLUDED_SOURCE` — private-note / hard-blocked ref

## Structural gates

- No generic table-name loader exists.
- No dynamic SQL: every query is a static `select()` with fixed column list.
- Callers cannot choose table or columns.
- Private-note references never appear in `source-loaders.server.ts`
  (regex-checked in `relationship-memory-b2b-i.bc91.test.ts`).
- Loaders are absent from the client barrel (`index.ts`).

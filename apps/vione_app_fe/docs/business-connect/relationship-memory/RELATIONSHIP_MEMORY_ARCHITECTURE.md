# BC-9.1 Turn A — Relationship Memory Architecture

**Status:** CLOSED / GO ✅ (Foundation)
**Version:** `1.0.0` (`RELATIONSHIP_MEMORY_VERSION`)
**Location:** `src/lib/business-connect/relationship-memory/`
**Depends on:** BC-9.0 Intelligence (governance, safe source domains).

## Purpose

Relationship Memory is a **long-term, owner-private, normalized knowledge
layer** that records what one Business Connect user has learned about a
counterpart (person / organization / relationship / opportunity). It powers
BC-9.x intelligence surfaces without duplicating canonical domain state.

## Non-goals

- ❌ NOT a shared graph — every memory row is scoped to a single owner.
- ❌ NOT a source of truth for canonical objects (people, meetings, cards).
- ❌ NOT a mutation layer for other domains.
- ❌ NOT an autonomous agent — extraction is proposal-only.
- ❌ NEVER reads or stores private meeting notes.

## Domain layout

| File                   | Responsibility                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `registry.ts`          | Frozen enums: kinds, subject types, statuses, sensitivity, link/feedback kinds, allow/exclude source domains |
| `types.ts`             | Client-safe DTOs and filter shapes                                                                           |
| `errors.ts`            | `RelationshipMemoryError` + frozen error codes                                                               |
| `eligibility.ts`       | Structural + runtime guard rejecting excluded source domains and hard-blocked tables                         |
| `memory-policy.ts`     | Pure canonical key, confidence math, lifecycle transitions, merge, visibility gate                           |
| `repository.server.ts` | Owner-scoped Supabase reads/writes; enforces `owner_user_id` filter + RLS                                    |
| `functions.ts`         | Authenticated read-only server functions                                                                     |
| `sdk.ts`               | Frozen public SDK (UI/hook entry point)                                                                      |
| `index.ts`             | Client-safe barrel                                                                                           |

## Schema

Four tables under `public`, all with `FORCE ROW LEVEL SECURITY` and owner
policies (`auth.uid() = owner_user_id`):

- `business_relationship_memories`
- `business_relationship_memory_sources`
- `business_relationship_memory_links`
- `business_relationship_memory_feedback`

See `RELATIONSHIP_MEMORY_SCHEMA.md`.

## Hard privacy invariant

`business_meeting_private_notes` **cannot** feed the memory pipeline. Enforced
in three independent layers:

1. **Database.** `business_relationship_memory_sources.source_domain` has a
   CHECK constraint that rejects `private_meeting_notes` and requires the
   value to be in the allowlist.
2. **Runtime.** `assertSourceDomainEligible` and `assertSourceRefNotBlocked`
   throw `RelationshipMemoryError('RELATIONSHIP_MEMORY_EXCLUDED_SOURCE')`.
3. **Structural.** No file under `src/lib/business-connect/relationship-memory/`
   references the private-notes table or the `private_meeting_notes` domain
   (verified by `relationship-memory-security.bc91.test.ts`).

See `RELATIONSHIP_MEMORY_PRIVACY.md`.

## Lifecycle

`candidate → active → superseded → dismissed` (and `expired` sink). Terminal
statuses cannot transition further. See `RELATIONSHIP_MEMORY_LIFECYCLE.md`.

## Advisory-only

Memories never mutate canonical state. Downstream intelligence composes them
into prompts through the BC-9.0 governance gates.

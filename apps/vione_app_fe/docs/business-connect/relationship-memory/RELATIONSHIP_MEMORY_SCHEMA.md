# BC-9.1 Turn A — Relationship Memory Schema

All four tables are under `public`, owner-scoped, RLS-enabled with `FORCE`.
Anon has zero access. Only the owning `authenticated` user can view or
mutate their rows (verified by RLS + explicit `owner_user_id` filter in the
repository).

## `business_relationship_memories`

Normalized memory rows, one per `(owner, subject, kind, canonical_key)`.

| Column                                   | Notes                                                               |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `owner_user_id`                          | FK to `auth.users`, owner-scope key                                 |
| `subject_type`                           | `person` \| `organization` \| `relationship` \| `opportunity`       |
| `subject_ref`                            | Domain reference (never raw PII)                                    |
| `memory_kind`                            | Value from `RELATIONSHIP_MEMORY_KINDS`                              |
| `canonical_key`                          | Deterministic dedupe key (see `memory-policy.canonicalKey`)         |
| `canonical_value`                        | JSONB payload                                                       |
| `confidence`                             | `NUMERIC(4,3)` in `[0,1]`                                           |
| `source_count`                           | Non-negative int                                                    |
| `status`                                 | `candidate` \| `active` \| `superseded` \| `dismissed` \| `expired` |
| `sensitivity`                            | `public_ok` \| `standard` \| `sensitive` \| `restricted`            |
| `first_observed_at` / `last_observed_at` | Provenance timestamps                                               |
| `last_reviewed_at` / `last_reviewed_by`  | Owner review trail                                                  |
| `registry_version`                       | Frozen version for compatibility gating                             |

Unique on `(owner_user_id, subject_type, subject_ref, memory_kind, canonical_key)`.

## `business_relationship_memory_sources`

Provenance: one row per corroborating safe-domain observation.

- `source_domain` — CHECK-restricted to
  `RELATIONSHIP_MEMORY_ALLOWED_SOURCE_DOMAINS` and explicitly rejects
  `private_meeting_notes`.
- `source_ref` — reference to the safe domain event.
- `weight` — 0..1, contributes to confidence bumps.
- `snippet_safe` — optional redacted excerpt.

## `business_relationship_memory_links`

Owner-private semantic graph. Kind ∈ `{supports, refines, contradicts,
supersedes, related}`. INSERT policy uses `bc_rm_owns_memory(uuid)`
(SECURITY DEFINER) to keep authorization non-recursive and require the owner
to own BOTH endpoints.

## `business_relationship_memory_feedback`

Owner feedback signals (`accept`, `reject`, `edit`, `flag_sensitive`,
`request_forget`) used to tune Turn B extraction.

## Helper: `public.bc_rm_owns_memory(uuid)`

`STABLE SECURITY DEFINER SET search_path=public`. Returns true when the
current `auth.uid()` owns the given memory. Used only in link/feedback
INSERT policies. Grants: `EXECUTE` to `authenticated`.

## Access matrix

| Role                  | Memories | Sources | Links                          | Feedback |
| --------------------- | -------- | ------- | ------------------------------ | -------- |
| anon                  | ❌       | ❌      | ❌                             | ❌       |
| authenticated (owner) | ✅ CRUD  | ✅ CRUD | ✅ CRUD (both endpoints owned) | ✅ CR/D  |
| authenticated (other) | ❌       | ❌      | ❌                             | ❌       |
| service_role          | ✅       | ✅      | ✅                             | ✅       |

## Triggers

`update_updated_at_column` maintains `updated_at` on all four tables.

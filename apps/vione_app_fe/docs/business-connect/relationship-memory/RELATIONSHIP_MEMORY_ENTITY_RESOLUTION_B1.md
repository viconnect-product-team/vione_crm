# BC-9.1 Turn B1 — Entity Resolution

Subjects are resolved ONLY against canonical entities the viewer is already
authorized to see. Resolution never mints new hidden person records from free
text and never guesses identity.

## Methods

| Subject type   | Accepted references                                                           |
| -------------- | ----------------------------------------------------------------------------- |
| `person`       | Exact `graph_nodes.id` (RLS-scoped), or scoped meeting participant reference. |
| `organization` | Exact `companies.id`, or known org slug (`companies.slug`).                   |
| `relationship` | Exact `connections.id`.                                                       |
| `opportunity`  | Exact `opportunities.id`.                                                     |

Free-text emails, phone numbers, and unnormalized display names are NOT
accepted as identity in B1. Extractors must resolve to a canonical id before
emitting a candidate with `subjectResolved = true`.

## Ambiguous / unresolved handling

- Any lookup that returns zero rows → `RELATIONSHIP_MEMORY_ENTITY_UNRESOLVED`.
- A future disambiguation path that returns multiple matches will surface
  `RELATIONSHIP_MEMORY_ENTITY_AMBIGUOUS`.
- On both, the candidate is either dropped by the extractor or persisted as
  `subjectResolved = false` (never linked to an active memory). B1 does not
  auto-guess.

## RLS

The resolver runs through the caller's authenticated Supabase client. Any
attempt to resolve to an entity the viewer cannot read returns unresolved.
The service role never bypasses this in the extraction path.

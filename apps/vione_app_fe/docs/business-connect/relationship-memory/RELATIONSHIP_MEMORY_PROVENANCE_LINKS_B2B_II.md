# BC-9.1 Turn B2b-ii — Provenance & Links

## Provenance (`business_relationship_memory_sources`)

New columns: `source_record_id`, `source_version`, `extractor_id`,
`evidence_type`.

Unique index `bc_rm_sources_identity_unique` on
`(memory_id, source_domain, source_record_id, source_version,
extractor_id, extractor_version, evidence_type)` guarantees idempotent
provenance persistence. Replay of the same candidate produces zero new
provenance rows.

Provenance NEVER stores raw source body, provider payload, model reasoning,
auth credentials, or private-note fragments. `snippet_safe` remains
nullable and unused by B2b-ii — safe evidence snippets ship in a later turn.

## Links (`business_relationship_memory_links`)

Allowed `link_kind` (post-B2b-ii): `supports`, `refines`, `contradicts`,
`supersedes`, `related`, `derived_from`, `confirmed_by`, `mentioned_in`.

Invariants:

- `bc_rm_link_not_self` — no self-link (existing CHECK).
- `bc_rm_link_unique(from_memory_id, to_memory_id, link_kind)` — no
  duplicate identical link (idempotent inserts via `ON CONFLICT DO NOTHING`).
- RLS + `bc_rm_owns_memory` insert policy — no cross-owner link.
- Conflict path creates `contradicts`; supersession creates `supersedes`.
- The insert path uses `ON CONFLICT` so races collapse to a single link row.

The RPC never inserts both `supports` and `contradicts` for the same ordered
pair in a single call, and duplicates on either side are collapsed by the
unique index; the ordered-pair mutual-exclusion is enforced at
classification time (the classifier can only route to one outcome).

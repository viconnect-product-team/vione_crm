# BC-9.1 Turn B1 — Extraction Pipeline (Foundation)

Turn B1 lands the deterministic scaffolding for memory extraction: registry,
candidate contract, normalizers, entity resolution, receipts, and a bounded
worker skeleton. Model-assisted extractors, embeddings, hybrid retrieval, and
BC-9.0 memory integration land in later B sub-turns.

## Pipeline (per source record)

1. Extractor executor produces raw candidates from the bounded canonical DTO.
2. Worker validates each candidate via `validateCandidate()`.
3. Extractor's declared visibility ceiling is enforced (candidates above the
   ceiling are dropped, not persisted).
4. Batch- and source-level candidate ceilings are applied.
5. Receipt is marked `completed` or `partial`; on failure the receipt is
   incremented and left `pending` until `MAX_ATTEMPTS_PER_RECEIPT`, then
   `failed`. Structurally invalid candidates or excluded source domains
   short-circuit as `skipped`.

Raw source bodies are never persisted. The worker only stores the validated
candidate shape.

## Forbidden inputs (hard gate)

- `business_meeting_private_notes` / `private_meeting_notes`
- raw email inboxes
- provider secrets, auth identifiers
- cross-tenant data
- raw model reasoning

Enforced at three layers: DB `CHECK` on `source_domain`, runtime guard in
`eligibility.ts`, and repository-wide grep test.

## Approved source domains

`meeting_outcome_safe`, `follow_up_safe`, `agenda_safe`, `shared_notes_safe`,
`introduction_safe`, `connection_relationship_safe`, `person_profile_safe`,
`association_company_safe`, `relationship_graph_safe`, `work_hub_items`,
`notification_action_safe`, `meeting_safe`.

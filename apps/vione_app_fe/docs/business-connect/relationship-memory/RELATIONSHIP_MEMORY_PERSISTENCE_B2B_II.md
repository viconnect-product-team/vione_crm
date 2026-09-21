# BC-9.1 Turn B2b-ii — Persistence Runtime

## Entrypoint

`applyRelationshipMemoryCandidate(sb, { receiptId, claimToken, extractorId,
extractorVersion, candidate, expectedVersion? })` in
`src/lib/business-connect/relationship-memory/apply-candidate.server.ts`.

Server-only. Calls SECURITY DEFINER RPC
`public.business_relationship_memory_apply_candidate` (`service_role` only —
`REVOKE` from `PUBLIC`, `anon`, `authenticated`; `GRANT EXECUTE` to
`service_role`).

## Trust model

- Owner is derived from `business_relationship_memory_extraction_receipts.owner_user_id`
  inside the RPC. The service never accepts an owner argument.
- Merge outcome is derived by the RPC from frozen policy. The caller cannot
  request an outcome, lifecycle target, confidence target, verified flag, or
  visibility override.
- The RPC validates claim token equality against the receipt row and requires
  `status = processing`; a stale token surfaces as
  `RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM`.
- Extractor id + version must match the receipt.
- Unresolved subjects are rejected (`RELATIONSHIP_MEMORY_INVALID_MERGE`).
- `private_meeting_notes` is rejected structurally by the RPC and by the
  `bc_rm_source_reject_private_notes` CHECK constraint.

## Atomic execution order (single DB transaction)

1. `SELECT … FOR UPDATE` on the receipt row.
2. Validate `status = processing` and `claim_token`.
3. Validate candidate identity + subject resolution + source domain.
4. `SELECT … FOR UPDATE` on the canonical memory row.
5. Classify merge outcome (`creates_new` | `duplicate` | `supports_existing`
   | `enriches_existing` | `conflicts_existing`).
6. Apply exactly one outcome branch.
7. `INSERT` provenance idempotently.
8. Return safe DTO.

No external network call inside the transaction.

## Result DTO

`RelationshipMemoryApplyResultDTO`
(`apply-result-dto.ts`) — includes `outcome`, `memoryRef`,
`existingMemoryRef`, `created`, `materiallyChanged`, `provenanceAdded`,
`linkAdded`, `version`, `reviewRequired`. Owner ids, tenant ids, claim
tokens, canonical values and snippets are never surfaced.

## Errors

Adds `RELATIONSHIP_MEMORY_VERSION_CONFLICT`,
`RELATIONSHIP_MEMORY_INVALID_MERGE`,
`RELATIONSHIP_MEMORY_PROVENANCE_CONFLICT`,
`RELATIONSHIP_MEMORY_LINK_CONFLICT`,
`RELATIONSHIP_MEMORY_VISIBILITY_ESCALATION`,
`RELATIONSHIP_MEMORY_SENSITIVITY_DOWNGRADE`,
`RELATIONSHIP_MEMORY_SUPERSESSION_NOT_ALLOWED`. Unknown DB errors map to
`RELATIONSHIP_MEMORY_INTERNAL_ERROR`.

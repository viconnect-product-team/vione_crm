# BC-9.1 Turn B3 — Retention & Operations Runbook

## Retention (default)

| Data                               | Retention                                                          | Deletion path                                          |
| ---------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| Active memory                      | until user deletes the underlying source or owner requests erasure | cascade via `owner_user_id`                            |
| Superseded memory                  | 180 d, then archive                                                | `mark_relationship_memory_archived` RPC (service-role) |
| Archived memory                    | 365 d, then hard-delete                                            | scheduled job (service-role)                           |
| Extraction receipts                | 90 d after terminal state                                          | scheduled job                                          |
| Embeddings (stale/failed/archived) | purged with parent memory                                          | trigger-based cascade                                  |
| Feedback rows                      | tied to memory lifetime                                            | cascade                                                |
| Outbox events                      | 30 d                                                               | scheduled trim                                         |
| Worker logs                        | 30 d                                                               | log-store TTL                                          |

## Operator runbook — daily

- Confirm worker sweep last-success within 15 min.
- Alert if claim expiry ratio > 5 % of claimed rows in the last hour.
- Alert if `receipt.status='failed'` count exceeds N per hour (operator-tuned).
- Alert on any `Seq Scan` on an RM table observed in `pg_stat_statements`.

## Operator runbook — weekly

- Re-run structural test suite: `bunx vitest run src/__tests__/relationship-memory-*.test.ts`.
- Review sensitivity distribution (`sensitivity=high` unexpected growth flags a policy drift).
- Verify HNSW index health (`REINDEX INDEX CONCURRENTLY` if `pg_stat_user_indexes` shows drift).

## Erasure request

1. Operator issues `service_role` call to `owner_purge_relationship_memory(owner_user_id)`.
2. Cascade deletes memories, sources, embeddings, links, receipts, feedback for that owner.
3. Audit event `owner_purged` recorded — no memory payload retained.

## Model / profile upgrade

- Freeze current profile id.
- Ship new profile as `RELATIONSHIP_MEMORY_EMBEDDING_PROFILE_V<N>`.
- Backfill via worker sweep; retrieval uses new profile only after backfill completes.
- Never mix profile ids in a single retrieval RPC.

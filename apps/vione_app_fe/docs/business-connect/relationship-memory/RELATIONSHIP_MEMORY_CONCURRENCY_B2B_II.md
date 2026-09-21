# BC-9.1 Turn B2b-ii — Concurrency

All concurrent-safety guarantees are enforced by the database, not by
application code.

| Scenario                                                       | Mechanism                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two workers apply the same candidate → single canonical memory | Partial unique index `bc_rm_memory_active_unique` on `(owner, subject_type, subject_ref, scope_type, scope_ref, memory_kind, canonical_key) WHERE status IN ('candidate','active')`. RPC re-selects on `ON CONFLICT DO NOTHING` and treats the race loser as `duplicate`. |
| Concurrent duplicate provenance inserts                        | Unique index `bc_rm_sources_identity_unique` + `ON CONFLICT DO NOTHING`.                                                                                                                                                                                                  |
| Concurrent enrichment on the same memory                       | `UPDATE … WHERE row_version = expected` — the loser observes 0 rows and the RPC raises `RELATIONSHIP_MEMORY_VERSION_CONFLICT`.                                                                                                                                            |
| Concurrent supersession                                        | Same `WHERE row_version = expected` guard on the old row.                                                                                                                                                                                                                 |
| Stale worker keeps a token after receipt reassignment          | Receipt row is locked (`FOR UPDATE`); token equality and `status = processing` are re-validated; mismatch raises `RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM`.                                                                                                               |
| Old version overwrites new version                             | Impossible: every mutating path takes the memory row lock and checks `row_version`; `enriches_existing` and `supersede` bump `row_version` atomically.                                                                                                                    |

The RPC never opens a nested transaction, never calls an external provider,
and never releases locks between steps. The bounded lock set is: exactly one
receipt row, at most one canonical memory row (existing) plus at most one
new row.

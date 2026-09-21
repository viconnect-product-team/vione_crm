# BC-9.1 Turn B3 — Failure Isolation

Every failure mode degrades the affected surface only; sibling surfaces,
tenants, and workers keep working.

| Failure                     | Effect                                                                                                                                  | Non-affected                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Provider outage             | current sweep marks receipts `failed` (retryable) or terminal; retrieval still serves cached embeddings via structured + partial hybrid | structured search, other tenants, other workers |
| Malformed vector            | single receipt terminal-fails; embedding row absent → memory returned via structured only                                               | HNSW index, sibling receipts                    |
| RLS denial for viewer       | fails **closed** — empty result set, no leak                                                                                            | other viewers, service-role writes              |
| Retrieval SQL error         | mapped to `RELATIONSHIP_MEMORY_RETRIEVAL_FAILED`; caller receives empty page                                                            | writes, worker sweep                            |
| Graph root missing          | returns `{ nodes: [], nodeCount: 0 }`                                                                                                   | retrieval, sibling roots                        |
| BC-9.0 adapter failure      | capability builder receives empty facts + `omitted` counters, never falls through to raw repository                                     | other capabilities, other viewers               |
| Worker crash mid-claim      | claim expires after 5 min → next sweep re-claims via `SKIP LOCKED`                                                                      | sibling receipts under other claims             |
| Duplicate candidate         | idempotency unique index rejects → RPC returns `ALREADY_APPLIED` (advisory)                                                             | other candidates                                |
| Query embedder dim mismatch | throws `RELATIONSHIP_MEMORY_EMBEDDING_DIMENSION_MISMATCH`; no partial results                                                           | subsequent queries, other viewers               |
| Prompt-injection payload    | traversed as inert text; hash produced                                                                                                  | policy, capability envelope                     |

No failure escalates into cross-owner data exposure, autonomous
mutation, or infinite retry.

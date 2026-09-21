# BC-9.1 Turn B3 — Index & Query Plan Verification

## Required indexes (asserted structurally)

| Table                                              | Index                                                                                                             | Purpose              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------- |
| `business_relationship_memories`                   | `(owner_user_id, subject_type, subject_ref, memory_kind) WHERE status IN ('active','candidate')`                  | structured retrieval |
| `business_relationship_memories`                   | `(owner_user_id, last_observed_at DESC)`                                                                          | recency sort         |
| `business_relationship_memories`                   | UNIQUE `(owner_user_id, subject_type, subject_ref, memory_kind, canonical_identity_hash) WHERE status = 'active'` | canonical uniqueness |
| `business_relationship_memory_sources`             | `(memory_id, source_domain, source_ref)`                                                                          | provenance lookup    |
| `business_relationship_memory_sources`             | UNIQUE `(memory_id, source_domain, source_ref, source_fingerprint)`                                               | provenance dedup     |
| `business_relationship_memory_embeddings`          | HNSW `vector vector_cosine_ops (m=16, ef_construction=64)`                                                        | semantic ANN         |
| `business_relationship_memory_embeddings`          | `(memory_id, profile_id, status)`                                                                                 | lifecycle lookup     |
| `business_relationship_memory_extraction_receipts` | `(status, claim_expires_at) WHERE status IN ('pending','claimed','failed')`                                       | worker sweep         |
| `business_relationship_memory_extraction_receipts` | UNIQUE `(source_domain, source_ref, source_fingerprint, extractor_id, extractor_version)`                         | idempotency          |
| `business_relationship_memory_links`               | `(source_memory_id, target_memory_id, kind)` UNIQUE                                                               | graph edge dedup     |

## Query plan expectations (operator to confirm — see PostgreSQL verification doc)

- Structured search — `Index Scan using bc_rm_owner_subject_kind_active_idx` under RLS.
- Semantic search — `Index Scan using bc_rm_embed_hnsw_idx` bounded by `LIMIT 200`, then per-row `Index Scan` on parent memory join.
- Worker claim — `Index Scan using bc_rm_receipt_status_expiry_idx` with `FOR UPDATE SKIP LOCKED`.

Any `Seq Scan` on an RM table in production must trigger an operational
alert (see observability doc).

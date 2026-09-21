# BC-9.1 Turn B3 — Real PostgreSQL Verification

## Status

**NOT RUN in this turn.** Live-DB proofs require an operator-supplied
`DATABASE_URL` with superuser + pgvector; the sandboxed test runner is
JS-only. The migration text is fully version-controlled and is the
source of truth for these guarantees.

## Structural evidence available in this turn

- Every migration in `supabase/migrations/` referencing an RM table asserts `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` (regex proof in `relationship-memory-b3-structural`).
- `bc_rm_source_reject_private_notes` CHECK is present and covers `source_domain`, `source_kind`, and payload keys.
- HNSW index over `business_relationship_memory_embeddings.vector` with `vector_cosine_ops` and `m`/`ef_construction` tuned per profile.
- Partial index on receipts (`(status) WHERE status IN ('pending','claimed','failed')`) for worker sweep.
- All lifecycle-mutating RPCs (`apply_candidate`, `complete_extraction_receipt`, `fail_extraction_receipt`, `claim_extraction_receipts`, `record_embedding`, `mark_embedding_failed`, `claim_embedding_jobs`) declared `SECURITY DEFINER SET search_path = public`.
- Function-level `GRANT` limited to `service_role`; `REVOKE FROM PUBLIC, anon, authenticated`.

## Recommended operator runbook (out of scope for this turn)

1. Provision a scratch Postgres with `pgvector`.
2. `supabase db reset` against the migration set.
3. Execute `docs/business-connect/relationship-memory/RELATIONSHIP_MEMORY_DB_PROOFS.sql` (below) to assert RLS DENY paths, service-role-only writes, dimension guard, and unique canonical-identity constraint.
4. `EXPLAIN (ANALYZE, BUFFERS)` the queries in `RELATIONSHIP_MEMORY_QUERY_PLANS_B3.md` and confirm `Index Scan using ...` (never `Seq Scan`) on the RM tables.

Failure to run these does not weaken the shipped guarantees; it defers
performance and RLS-runtime confirmation to the operator.

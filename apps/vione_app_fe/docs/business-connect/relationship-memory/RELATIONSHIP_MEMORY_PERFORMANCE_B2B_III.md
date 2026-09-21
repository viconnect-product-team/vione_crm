# BC-9.1 Turn B2b-iii — Performance

## Bounds

- Per tick: ≤ 25 receipts claimed (`MAX_SOURCES_PER_CLAIM`).
- Per tick: ≤ 100 candidates validated (`MAX_CANDIDATES_PER_BATCH`).
- Per source: ≤ 20 candidates (`MAX_CANDIDATES_PER_SOURCE`), further
  capped by the extractor's declared `maxCandidates`.
- Per-source wall-clock: extractor-declared `timeoutMs`.
- Per-tick wall-clock: `wallClockBudgetMs` (default 25 000 ms).

## No long transactions

- The worker never opens a transaction.
- All work between receipts happens outside any DB transaction.
- The single transaction per candidate is the SECURITY DEFINER
  `business_relationship_memory_apply_candidate` RPC body, which contains
  only in-DB work — no external network call.

## Structural evidence (migration SQL, asserted in tests)

- Claim path uses `FOR UPDATE SKIP LOCKED`.
- Claim RPC filters `status = 'pending'` (terminal receipts cannot be
  reclaimed).
- Indexed claim path on `business_relationship_memory_extraction_receipts`
  covering `extractor_id` / `status`.
- Canonical-identity uniqueness: partial unique index
  `bc_rm_memory_active_unique` on `(owner, subject_ref, memory_kind,
canonical_predicate, canonical_key)` WHERE `status IN ('candidate','active')`.
- Provenance uniqueness: `bc_rm_sources_identity_unique` on
  `(memory_id, source_domain, source_record_id, source_version,
extractor_id, extractor_version, evidence_type)`.
- Finalize RPCs require `claim_token = p_claim_token`.

## No N+1

- Source loading is one authorization-safe call per receipt (matches the
  one canonical source domain of the receipt).
- Entity resolution is per candidate but bounded by
  `MAX_CANDIDATES_PER_SOURCE`; the resolver hits indexed RLS-scoped tables
  and returns a single row.
- Persistence is per candidate but bounded identically; no fan-out per
  candidate.

## No provider call

No AI, no embedding, no external HTTP inside the runtime — verified
structurally in the security suite.

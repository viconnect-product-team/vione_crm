# BC-9.1 Turn B3 — Retrieval Security

Two public retrieval surfaces: **structured** and **semantic**. Both derive
viewer identity from `requireSupabaseAuth`; caller inputs cannot widen scope.

## Authorization

- RLS on `business_relationship_memories` and `_sources` scopes every read to `owner_user_id = auth.uid()` (see `RELATIONSHIP_MEMORY_SCHEMA.md`).
- Server functions never accept `owner_user_id`, `tenant_id`, `viewerUserId`, or any bypass switch.
- `includeHistorical`, `includeCandidates`, `conflictReview` require explicit boolean opt-in from the caller; default is current + active only.

## Semantic path

- Query text truncated to `RELATIONSHIP_MEMORY_QUERY_MAX_CHARS` (400) and normalized before embedding.
- Query embedding dimension mismatch throws `RELATIONSHIP_MEMORY_EMBEDDING_DIMENSION_MISMATCH`.
- SQL passes only a vector literal + numeric threshold to a `SECURITY DEFINER` RPC (`bc_rm_search_semantic_v1`) — no operator, distance function, or table name is caller-controlled.
- Candidate pool capped at 200; final results capped at `SEARCH_LIMIT_MAX = 100`.
- Similarity below `RELATIONSHIP_MEMORY_SEMANTIC_MIN_SIMILARITY = 0.55` filtered out.
- Stale, failed, superseded, expired, archived, rejected embeddings/memories are excluded from current mode.

## Structured path

- `subject_type`/`subject_ref` filters are enum-validated.
- Kinds validated against `RELATIONSHIP_MEMORY_KINDS`.
- Sensitivity ceiling enforced via `allowedForSensitivityCeiling`.
- Fixed sort by `last_observed_at DESC`, limited server-side.

## What retrieval never returns

- Raw vectors
- Provider payloads or model reasoning
- Owner IDs / tenant IDs / claim tokens
- Raw source content or private-note fields
- Query embedding

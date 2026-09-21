# BC-9.1 Turn B3 — Query Privacy & Cache Isolation

## Query privacy

- Query text is normalized (whitespace collapsed, trimmed) and truncated to `RELATIONSHIP_MEMORY_QUERY_MAX_CHARS = 400` before use.
- Query text is embedded once per call via `getQueryEmbedder` and passed to Postgres as a numeric vector literal — the string itself never becomes part of a stored row.
- No RM table has a `query_text`, `query`, or `search_history` column (verified structurally).
- No worker/pipeline/service writes query text to `graph_outbox_events`, receipts, audit, or activity logs.
- Analytics counters, when enabled, log only capability + coarse timing — never query text.

## Cache isolation

- Retrieval path performs no cross-viewer caching. Each request runs under its own Supabase client (RLS as `auth.uid()`); results are never keyed by anything less specific than the viewer's session.
- Query embedder produces a Float32Array per call — no shared in-memory or Redis cache is wired.
- Embedding vectors persisted per **memory**, not per query; there is no query → vector store.
- HTTP responses set no long-lived `Cache-Control`; SSR fetches route through `requireSupabaseAuth` which negates public caching.

## What is intentionally NOT built

- No cross-tenant query recall
- No query-suggestion / autocomplete surface fed by other users' queries
- No shared client-side cache keyed by query text

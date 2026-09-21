# BC-9.1 Turn B3 — Final Security Proof

**Scope:** verification/hardening only. No new memory types, extractors,
capabilities, UI, or autonomous action.

## Proof matrix

| Concern                           | Evidence                                                                                                                                                                                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Private-note structural exclusion | `relationship-memory-b3-structural` regex-scans every RM `.ts` for `business_meeting_private_notes` / `private_meeting_notes` / `MeetingPrivateNote` / `getPrivateNote` / `privateNotes` — allowlist only `registry.ts`, `eligibility.ts`, `embedding-eligibility.ts` |
| Private-note DB gate              | migration `bc_rm_source_reject_private_notes` CHECK asserted present                                                                                                                                                                                                  |
| Public SDK boundary               | `RELATIONSHIP_MEMORY_SDK_METHODS` frozen at `["list","getById","searchMemories","listRelevantMemories","getMemoryGraphContext"]`                                                                                                                                      |
| Barrel purity                     | client barrel exports zero `.server` modules, zero worker/apply/persistence symbols                                                                                                                                                                                   |
| Server function identity          | every `.functions.ts` uses `requireSupabaseAuth`; no `owner_user_id` / `tenant_id` / `viewerUserId` in input validators                                                                                                                                               |
| Frozen bounds                     | `SEARCH_LIMIT_DEFAULT=20`, `SEARCH_LIMIT_MAX=100`, `SEMANTIC_CANDIDATE_POOL_MAX≤200`, `GRAPH_MAX_DEPTH=2`, `GRAPH_MAX_NODES=100`, `QUERY_MAX_CHARS≤1000`                                                                                                              |
| Advisory-only                     | grep proves no runtime `.rpc('send_*/submit_*/schedule_meeting/approve_*/introduce_*/notify_*/complete_meeting/complete_follow_up')` and no writes to canonical business tables                                                                                       |
| Raw-vector containment            | search-DTO source contains no `vector`/`distance`/`embedding` identifier post comment-strip; provider + query-embedder are `*.server.ts` only                                                                                                                         |
| Prompt-injection                  | payloads containing "ignore previous instructions", `SELECT * FROM business_meeting_private_notes`, etc. traverse the embedding input builder as inert text and produce only a hash                                                                                   |

## Blocking defects

None.

## Non-blocking debt

- Live-PostgreSQL RLS/HNSW proof harness is scaffolded (see `RELATIONSHIP_MEMORY_POSTGRES_VERIFICATION_B3.md`); DB run marked `NOT RUN` until an operator supplies `DATABASE_URL`.

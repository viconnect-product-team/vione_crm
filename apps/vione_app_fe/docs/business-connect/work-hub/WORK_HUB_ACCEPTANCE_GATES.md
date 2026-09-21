# Work Hub — Acceptance Gates (BC-8.0F)

| Gate                           | Evidence                                                                                                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen domain layer            | `src/lib/business-connect/work-hub/*` — types, registry, priority policy, resolvers, repository, service, SDK, hooks                                                                                |
| Deterministic ordering & dedup | `work-hub.bc80.test.ts`, `work-hub-verification.bc80f.test.ts`                                                                                                                                      |
| Terminal-state suppression     | `work-hub-verification.bc80f.test.ts` — connection/introduction/meeting/outcome cases                                                                                                               |
| Summary/list parity            | `work-hub-verification.bc80f.test.ts`                                                                                                                                                               |
| Cursor freeze + rejection      | `work-hub-verification.bc80f.test.ts` — version mismatch, invalid base64, oversize limit                                                                                                            |
| Bounded reads (no N+1)         | `work-hub-verification.bc80f.test.ts` — verifies exactly one bounded query per source at 500-row fan-in                                                                                             |
| Resilience                     | `work-hub-verification.bc80f.test.ts` — all-source failure returns empty overview                                                                                                                   |
| SDK read-only freeze           | `work-hub-verification.bc80f.test.ts` — no mutation-shaped method names                                                                                                                             |
| Security / RLS                 | `requireSupabaseAuth` on every function; no `supabaseAdmin` import in any hub module                                                                                                                |
| PII suppression                | Repository projects allowlisted columns only; DTO restricts display fields                                                                                                                          |
| i18n coverage                  | VI/EN keys in `src/lib/i18n.ts` for all categories, urgencies, kinds, actions                                                                                                                       |
| Documentation set              | This directory — Architecture, Source Registry, Item Model, Priority Policy, Security Model, Data Flow, UI Contract, Performance Budgets, Error Model, Observability, Routing Map, Acceptance Gates |

**BC-8.0F — CLOSED / GO ✅**

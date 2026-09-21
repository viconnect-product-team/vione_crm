# BC-9.1 Turn B3 — Provider Failure Matrix

Provider adapter is server-only (`embedding-provider.server.ts`). All
failures map to one of the frozen error codes below; raw provider bodies,
stack traces, secrets, and payloads never leak into events, audit, metrics,
or DTOs.

## Frozen error codes

| Code                                                 | Meaning                                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `RELATIONSHIP_MEMORY_EMBEDDING_PROVIDER_UNAVAILABLE` | provider missing / down / 5xx / timeout / cancelled                                                                                   |
| `RELATIONSHIP_MEMORY_EMBEDDING_PROVIDER_FORBIDDEN`   | non-approved provider class or protected-data → non-private-first                                                                     |
| `RELATIONSHIP_MEMORY_EMBEDDING_DIMENSION_MISMATCH`   | wrong dimensions (also asserted for query embeddings in retrieval)                                                                    |
| `RELATIONSHIP_MEMORY_EMBEDDING_FAILED`               | malformed / empty / null / non-array / NaN / Infinity / truncated vector, unexpected model id/version, terminal deterministic failure |
| `RELATIONSHIP_MEMORY_EMBEDDING_STALE`                | completion arrived after claim expiry or memory content-hash changed                                                                  |

## Matrix

| Failure                                                | Retry?           | Terminal?          | Sibling isolation | Test                 |
| ------------------------------------------------------ | ---------------- | ------------------ | ----------------- | -------------------- |
| Missing provider config                                | ❌               | ✅                 | ✅                | B3 runtime           |
| Unknown / forbidden provider class                     | ❌               | ✅                 | ✅                | B3 runtime           |
| Approved provider unavailable / 5xx / timeout / cancel | ✅ (attempt cap) | after cap          | ✅                | B2c + B3             |
| Rate limit (429)                                       | ✅ (backoff)     | after cap          | ✅                | B2c                  |
| Malformed / empty / null / non-array response          | ❌               | ✅                 | ✅                | B3                   |
| NaN / Infinity / non-numeric value                     | ❌               | ✅                 | ✅                | B3                   |
| Wrong dimensions / truncated / oversized               | ❌               | ✅                 | ✅                | B3 (query dim guard) |
| Unexpected model id/version                            | ❌               | ✅                 | ✅                | B3                   |
| Response after claim expiry                            | —                | rejects completion | ✅                | B2a claim RPC        |
| Provider switched mid-flight                           | —                | rejects completion | ✅                | B2a claim RPC        |

Attempt cap: `RELATIONSHIP_MEMORY_EMBEDDING_PROFILE.maxAttempts = 5`.
Timeout: `providerTimeoutMs = 15_000`.

# PLATFORM TECH DEBT REGISTER — PBM-1.0

**Snapshot:** 2026-07-13 · **Commit:** `611afd5`
Only **accepted** debt is listed. Each item has an owner phase and an acceptance rationale. This register is the baseline; future PBMs track burn-down.

## Legend

- **Severity:** Low / Medium / High
- **Status:** Accepted (knowingly carried) · Deferred (planned phase)

## Architecture

| ID    | Item                                                             | Severity | Status   | Resolution             |
| ----- | ---------------------------------------------------------------- | -------- | -------- | ---------------------- |
| TD-A1 | Identity coupled to `members` rows (no standalone Platform User) | High     | Deferred | BC-1 (ADR-BC-001/002)  |
| TD-A2 | 137 lib files, some overlap across `member-app/*` services       | Low      | Accepted | Periodic consolidation |

## Security

| ID    | Item                                                        | Severity | Status   | Resolution                                  |
| ----- | ----------------------------------------------------------- | -------- | -------- | ------------------------------------------- |
| TD-S1 | 6 anon policies must stay whitelist-projection only         | Medium   | Accepted | Enforced by ADR-BC-005 + security test plan |
| TD-S2 | Live payment gateway not implemented (status tracking only) | Medium   | Deferred | Post-v1 / dedicated phase                   |
| TD-S3 | Session-gated E2E run only partially in CI                  | Low      | Accepted | Add seeded auth harness                     |

## Performance

| ID    | Item                                                        | Severity | Status   | Resolution                          |
| ----- | ----------------------------------------------------------- | -------- | -------- | ----------------------------------- |
| TD-P1 | No bundle / chunk / runtime measurement                     | Medium   | Accepted | Add perf budget tooling before BC-2 |
| TD-P2 | Polling in `use-unread-notifications`, `use-session-status` | Low      | Accepted | Migrate to realtime where feasible  |
| TD-P3 | Audit-log actor name resolution N+1 risk                    | Low      | Accepted | Mitigated via batch lookups         |

## Testing

| ID    | Item                                 | Severity | Status   | Resolution              |
| ----- | ------------------------------------ | -------- | -------- | ----------------------- |
| TD-T1 | Coverage % not measured              | Medium   | Accepted | Add coverage gate to CI |
| TD-T2 | Streaming AI path unverified by test | Low      | Accepted | Add streaming e2e       |

## Migration

| ID    | Item                              | Severity | Status   | Resolution                                  |
| ----- | --------------------------------- | -------- | -------- | ------------------------------------------- |
| TD-M1 | 98 additive migrations, no squash | Low      | Accepted | Intentional (additive/rollback-safe policy) |

## Deferred BC Phases

| ID     | Item                     | Status                                    |
| ------ | ------------------------ | ----------------------------------------- |
| TD-BC1 | BC-1…BC-11 not started   | Deferred (roadmap)                        |
| TD-BC2 | Wallet (Apple/Google)    | Deferred post-v1 (needs new ADR + Gate A) |
| TD-BC3 | NFC broad device support | Deferred (device-dependent)               |

## Summary

- High: 1 (TD-A1, resolved by BC-1)
- Medium: 5
- Low: 7
- All items are knowingly accepted or roadmap-deferred; none block Gate A → BC-1 entry.

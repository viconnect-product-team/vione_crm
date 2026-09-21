# BC-6.6 — Test Matrix

Contract tests: `src/__tests__/outcome-consumer.bc66.test.ts`.

| Category         | Coverage                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Event validation | schema version frozen; kind allowlist; unsupported kind rejected; malformed payload permanent-fails |
| Claiming         | bounded batch (`CONSUMER_BATCH_MAX`); SKIP LOCKED behaviour (SQL-level)                             |
| Registry         | built-in adapters; duplicate name rejection; subscription filter                                    |
| Dispatch         | fan-out to subscribed adapters; per-adapter receipt uniqueness (DB UNIQUE)                          |
| Retry            | retryable ⇒ retry_scheduled with next_attempt_at; backoff progression; exhaustion ⇒ dead-letter     |
| Idempotency      | duplicate consume safe; adapter-side dedupe by eventId                                              |
| Ordering         | aggregate order guard defers later events when earlier still pending                                |
| Finalization     | processed_at only when all _required_ adapters terminal; optional adapter failure does not block    |
| Security         | `IntroductionOutcomeSDK` unchanged; no consumer surface leaked                                      |
| Replay           | replay resets receipts + reopens outbox row                                                         |

Regressions run alongside:

- outcome-wiring.bc65
- introduction-outcome.bc64
- introduction-delivery.bc63
- introduction-request.bc62
- smart-introduction.bc60
- connection-adapter.bc50
- graph-recommendation.bc44
- graph-strength.bc43

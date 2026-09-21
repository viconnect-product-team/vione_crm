# BC-9.1 Turn B2b-iii — Observability

## Safe events

Emitted through the optional `emit: WorkerEventEmitter` hook passed to
`runExtractionWorkerOnce`. Every emitted payload is validated by
`assertSafeWorkerEvent` which throws on forbidden keys.

Event kinds:

- `relationship_memory_extraction_started`
- `relationship_memory_extraction_completed`
- `relationship_memory_extraction_partial`
- `relationship_memory_extraction_failed`
- `relationship_memory_extraction_skipped`

Payload fields (all safe):

- `receiptRef.id`
- `sourceDomain`
- `extractorId`, `extractorVersion`
- `attempt`
- `errorCode` (stable) or `null`
- `durationBucketMs` — one of `250 | 1000 | 5000 | 15000 | 60000`
- `counters` — the `WorkerCounters` snapshot

**Never included**: owner/tenant IDs, claim tokens, raw source content,
canonical memory text or structured value, snippets, DB exception messages,
provider names, model output.

## Counters

Every counter comes from actual persistence outcomes reported by the
`applyRelationshipMemoryCandidate` RPC DTO. The worker never trusts caller-
or extractor-supplied counts.

- `extractedCount = processed + rejected`
- `validatedCount = processed`
- `createdCount, duplicateCount, supportedCount, enrichedCount,`
  `conflictCount, supersededCount` — tallied from the RPC `outcome`
- `rejectedCount` — pipeline-level rejects
- `failedCount` — per-candidate apply exceptions
- `skippedCount` — reserved for finalize-level skip

## Cardinality

Labels are limited to the closed sets above. Neither event payloads nor
metrics carry receipt IDs, source record IDs, or entity references beyond
`receiptRef.id`.

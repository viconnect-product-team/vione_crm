# BC-9.1 Turn B3 — Observability & Audit

## Emitted events (via `graph_outbox_events`, worker log, audit)

- receipt lifecycle: `claimed`, `completed`, `failed`, `expired`
- memory apply: `memory_created`, `memory_updated`, `memory_superseded`, `memory_archived`
- embedding lifecycle: `embedding_enqueued`, `embedding_ready`, `embedding_failed`, `embedding_stale`
- retrieval: capability + result-count + duration bucket (no query text)
- graph traversal: root memory id + bounded node count (no edge payload)
- worker sweep: batch size, success/failure counts, duration

## Payload allowlist

Each event carries only:

- stable domain ids (`memory_id`, `receipt_id`, `embedding_id`, `capability_id`)
- enum status
- integer counts / durations
- deterministic hashes (`content_hash`, `canonical_identity_hash`)

## Explicitly excluded from every event

- raw source content
- private-note references (structurally impossible — allowlist enforced upstream)
- query text
- vector data
- viewer/owner/tenant PII beyond an opaque `owner_user_id`
- provider payloads or secrets
- stack traces

## Audit retention

Audit rows are append-only. Deletion follows the retention runbook (see
operations doc). Privacy: audit rows are readable by `service_role` only;
end users see no direct read path.

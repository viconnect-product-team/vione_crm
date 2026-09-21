# BC-9.1 Turn B2b-iii — Security Verification

Proven in `src/__tests__/relationship-memory-b2b-iii.bc91.test.ts`.

## Private-note structural gate

Every `.ts` file under `src/lib/business-connect/relationship-memory/` is
scanned for `business_meeting_private_notes`, `private_meeting_notes`,
`getPrivateNote`, `privateNotes`, `MeetingPrivateNote`. The tokens are
allowed only in `registry.ts` and `eligibility.ts` where they exist as
the hard-block allowlist entry.

`bc_rm_source_reject_private_notes` CHECK constraint on
`business_relationship_memory_sources` is still present — enforced at the
DB layer regardless of runtime.

## Client-boundary gate

- `src/lib/business-connect/relationship-memory/index.ts` (client barrel)
  exports zero `*.server.ts` modules and zero worker/apply/supersede
  symbols.
- Public SDK exposes only `list` + `getById`
  (`RELATIONSHIP_MEMORY_SDK_METHODS === ["list", "getById"]`).
- Candidate persistence RPCs are granted to `service_role` only and
  revoked from `PUBLIC`, `anon`, `authenticated`.
- Claim tokens never enter public DTOs; the safe result DTO forbids
  `claimToken`, `ownerUserId`, `canonicalValue`, `snippet`, etc.

## No-AI gate

Worker, pipeline, apply-service, extractors, and source-loaders are
scanned for `model-gateway`, `prompt-registry`, `embedding`, `openai`,
`anthropic`, `lovable-ai`, `@lovable/gateway`, and any raw `fetch("http…")`.
Zero matches.

## Canonical business immutability

Worker/pipeline/apply-service files are scanned for
`.from("<canonical>").update|delete|insert|upsert(…)` against meetings,
outcomes, follow-ups, agenda, shared-notes, profiles, cards,
introductions, and opportunities. Zero matches.

## Server-only worker invocation

The worker is not routed. No `/api/*` file imports
`runExtractionWorkerOnce`. Scheduler wiring (future turn) will require a
constant-time secret comparison plus batch-size cap; caller-supplied
owner/tenant scope is structurally impossible because ownership always
derives from the receipt row inside the persistence RPC.

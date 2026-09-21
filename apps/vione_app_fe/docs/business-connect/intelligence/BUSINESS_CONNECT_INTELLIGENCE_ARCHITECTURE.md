# BC-9.0 — Business Connect Intelligence Architecture (Turn A)

**Version:** `BUSINESS_CONNECT_AI_VERSION = 1.0.0`
**Status:** Turn A frozen (policy, context, contracts). Turn B (runtime) and Turn C (product surfaces) pending.

## Purpose

An **advisory** intelligence layer over Business Connect. AI reads approved
safe facts, generates drafts, ranks suggestions, and explains recommendations.
AI **never** becomes the source of truth, bypasses canonical services, or
executes business mutations.

## Layer boundary

```
UI  ──► BusinessConnectIntelligenceSDK  (client-safe barrel)
             │
             ▼
       server functions  (Turn B: authenticated, rate-limited)
             │
             ▼
       IntelligenceService.server  (Turn B: context build → model → validate)
             │  ┌──────────────────────────────────────────────┐
             │  │ context-builders (pure)                      │
             │  │ redaction        (allowlist-first)           │
             │  │ prompt-registry  (immutable)                 │
             │  │ response-schemas (Zod, no bounds)            │
             │  │ model-routing    (private-first)             │
             │  └──────────────────────────────────────────────┘
             ▼
       runtime/  (Turn B — model gateway, read-only tool executor, audit)
```

AI logic is **never** placed inside `WorkHubService`, `MeetingService`,
`IntroductionService`, `NotificationService`, or UI components.

## Turn A deliverables

| File                  | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `registry.ts`         | Frozen capabilities, risk tiers, source allowlists |
| `errors.ts`           | Frozen error code contract                         |
| `context-policy.ts`   | Windows, rate limits, expiries, tool-loop limits   |
| `types.ts`            | Safe fact schemas, context envelope, viewer/scope  |
| `redaction.ts`        | Allowlist-first redactor with hard assertions      |
| `eligibility.ts`      | Pure scope/source policy checks                    |
| `model-routing.ts`    | Per-capability private-first routing policy        |
| `prompt-registry.ts`  | Immutable versioned prompts (`@1.0.0`)             |
| `response-schemas.ts` | Zod structured response contracts                  |
| `context-builders.ts` | Pure builders composing safe facts into envelopes  |
| `sdk.ts`              | Frozen public SDK surface (no mutation methods)    |
| `index.ts`            | Client-safe barrel                                 |

## Non-goals for Turn A

- No provider adapters
- No model gateway
- No persistence tables
- No tool executor
- No product surfaces
- No streaming
- No mutation methods

Turn A ships a **thick, testable policy layer** that Turn B fills with runtime
without any policy re-work.

## Invariants proven by tests

- 8 capabilities, none autonomous
- Private notes hard-excluded from every capability allowlist
- Static grep gate: intelligence module tree contains **zero** references to
  `business_meeting_private_notes`
- Redactor rejects any fact carrying `email` / `auth_uid` / `private_note`
- Windows: relationship ≤ 90d / 20 events, meetings ≤ 10, follow-ups ≤ 20,
  introductions ≤ 10, work items ≤ 30, shared notes ≤ 20, agenda ≤ 50
- Model routing: `cloud_general` never precedes a private class; sensitive
  capabilities (`relationship_briefing`, `meeting_preparation`) exclude
  `cloud_general` entirely
- SDK is frozen; contains no `send`/`submit`/`accept`/`schedule`/`finalize`/`complete` methods
- SDK methods throw `BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE` in Turn A (no
  fabrication, safe fallback)
- Every capability has a prompt entry at `@1.0.0` embedding the shared system
  rules (§21)

## Data flow (target — completed in Turn B)

```
viewer  ─►  authorized safe DTO reads
              (per capability allowlist)
                 │
                 ▼
        context-builders → redaction → prompt-registry → model-router
                 │
                 ▼
        response-schemas.parse → factuality-validator
                 │
                 ▼
        AIResultEnvelope  (advisory, stale-aware, cited)
```

## References

- Capability registry: `BUSINESS_CONNECT_AI_CAPABILITY_REGISTRY.md`
- Context policy: `BUSINESS_CONNECT_AI_CONTEXT_POLICY.md`
- Privacy invariants: `BUSINESS_CONNECT_AI_PRIVACY.md`
- Prompt registry: `BUSINESS_CONNECT_AI_PROMPT_REGISTRY.md`
- Model routing: `BUSINESS_CONNECT_AI_MODEL_ROUTING.md`
- Response schemas: `BUSINESS_CONNECT_AI_RESPONSE_SCHEMAS.md`

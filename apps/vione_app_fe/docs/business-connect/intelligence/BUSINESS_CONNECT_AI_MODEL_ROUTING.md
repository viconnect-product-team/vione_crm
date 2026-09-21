# BC-9.0 — Model Routing Policy

## Classes (§16)

- `cloud_private` — approved managed provider under enterprise privacy terms
- `local_private` — on-prem / self-hosted (Ollama, vLLM)
- `cloud_general` — general-purpose public cloud model (limited allowance)
- `unavailable` — no eligible model up; SDK returns `PROVIDER_UNAVAILABLE`

## Per-capability policy

| Capability                 | Preference order                              |
| -------------------------- | --------------------------------------------- |
| relationship_briefing      | cloud_private → local_private                 |
| meeting_preparation        | cloud_private → local_private                 |
| introduction_draft         | cloud_private → local_private → cloud_general |
| follow_up_draft            | cloud_private → local_private → cloud_general |
| next_action_suggestion     | cloud_private → local_private                 |
| opportunity_signal_summary | cloud_private → local_private                 |
| network_query              | cloud_private → local_private                 |
| work_hub_assistant         | cloud_private → local_private                 |

**Invariant proven by test** (`assertPrivateBeforePublic`): no capability
allows `cloud_general` before a private option.

**Sensitive-scope invariant**: `relationship_briefing` and
`meeting_preparation` exclude `cloud_general` entirely — protected context
never routes to a public general provider.

## Local AI readiness (§17)

Turn B will use the existing provider abstraction to plug in Ollama / vLLM /
approved on-prem providers. This module records **provider class**, not
provider secrets — audits stay clean.

## Provider unavailable (§18)

When every eligible class is down, callers receive
`BUSINESS_CONNECT_AI_PROVIDER_UNAVAILABLE`. Product surfaces (Turn C) offer
deterministic non-AI fallbacks:

- structured meeting checklist
- canonical relationship facts
- existing Work Hub deterministic priority
- blank draft template

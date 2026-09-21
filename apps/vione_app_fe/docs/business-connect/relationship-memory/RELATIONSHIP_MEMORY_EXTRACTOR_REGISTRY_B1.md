# BC-9.1 Turn B1 — Extractor Registry

Frozen at `RELATIONSHIP_MEMORY_EXTRACTOR_REGISTRY_VERSION = b1.0.0`.
Adding an extractor requires a version bump and passing policy tests.

## Shape

Each extractor declares:

| Field                     | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `extractorId`             | Stable, dotted id (`domain.topic.vN`).           |
| `extractorVersion`        | Semver of the extractor body.                    |
| `sourceDomain`            | Allowlisted safe source domain.                  |
| `mode`                    | `deterministic` \| `model_assisted` \| `manual`. |
| `allowedMemoryKinds`      | Memory kinds the extractor may emit.             |
| `requiredFields`          | Fields the bounded canonical DTO must expose.    |
| `maxCandidates`           | Per-source ceiling (≤ 20).                       |
| `confidence`              | `{ base, perAdditionalSignal, max }` mapping.    |
| `sourceVisibilityCeiling` | Candidate visibility cannot exceed this tier.    |
| `freshnessDays`           | Turn C uses this to recompute; B1 stores only.   |
| `timeoutMs`               | Per-execution wall-clock budget.                 |

## Extractors registered in B1

All deterministic or manual. No model-assisted extractors ship in B1.

- `meeting_outcome.commitments.v1`
- `follow_up.commitments.v1`
- `agenda.topics.v1`
- `person_profile.role.v1`
- `business_card.services.v1`
- `introduction.context.v1`
- `manual.owner_authored.v1`

## Extraction limits (frozen)

| Limit                 | Value     |
| --------------------- | --------- |
| Candidates per source | 20        |
| Candidates per batch  | 100       |
| Sources per claim     | 25        |
| Source text chars     | 8 000     |
| Source context chars  | 24 000    |
| Provider wall-clock   | 45 000 ms |
| Repair retries        | 1         |
| Tool calls            | 8         |
| Attempts per receipt  | 3         |

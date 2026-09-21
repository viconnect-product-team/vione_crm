# BC-9.1 Turn B2b-i — Deterministic Extractors

**Status:** CLOSED / GO
**Scope:** deterministic bodies for the seven frozen extractor ids.
**Excluded:** model-assisted extraction, autonomous actions, persistence.

## Frozen ids (B2b-i)

| Id                               | Source domain          | Kinds emitted    | Cap | Visibility ceiling |
| -------------------------------- | ---------------------- | ---------------- | --- | ------------------ |
| `meeting_outcome.commitments.v1` | `meeting_outcome_safe` | `commitment`     | 8   | `sensitive`        |
| `follow_up.commitments.v1`       | `follow_up_safe`       | `commitment`     | 5   | `sensitive`        |
| `agenda.topics.v1`               | `agenda_safe`          | `shared_history` | 6   | `standard`         |
| `person_profile.role.v1`         | `person_profile_safe`  | `role_context`   | 2   | `public_ok`        |
| `business_card.services.v1`      | `person_profile_safe`  | `interest`       | 6   | `public_ok`        |
| `introduction.context.v1`        | `introduction_safe`    | `shared_history` | 4   | `sensitive`        |
| `manual.owner_authored.v1`       | `work_hub_items`       | allowlist        | 1   | `restricted`       |

## Contract (every extractor)

- Pure function of a Zod-parsed safe source DTO.
- Emits `RelationshipMemoryCandidate` objects with `subjectResolved: false`
  (pipeline resolves + freezes the flag before persistence).
- Uses only memory kinds in its registered allowlist.
- Deterministic sort by `(canonicalPredicate, canonicalText, subjectRef)`.
- Never calls an AI provider or the network.
- Never mutates canonical business records.
- Emits nothing when the source has no explicit facts (no inference).

## Explicit vs inferred

- `meeting_outcome.commitments.v1` requires an explicit commitment verb
  (`will|shall|commit to|agree to|promise to`). "Discussed pricing" is not a
  commitment and is dropped.
- `follow_up.commitments.v1` emits only for `open|in_progress` follow-ups
  with an `assigneePersonNodeId`. Completion is never signalled through memory.
- `agenda.topics.v1` maps accepted/in_progress/completed items to
  `shared_history`. Preferences / expertise are never inferred from topics.
- `person_profile.role.v1` copies explicit title/org; never infers seniority,
  influence, or authority.
- `business_card.services.v1` normalizes explicit service labels; never
  infers capability from company name alone.
- `introduction.context.v1` copies the explicit `purpose` and status;
  never infers relationship quality.
- `manual.owner_authored.v1` requires `authoredByOwner === true`, enforces
  the memory-kind allowlist, and rejects sensitive-content patterns
  (`salary|net worth|medical|diagnosis|password|ssn|criminal`).

## Determinism

Snapshot-tested: identical input → identical output, byte-for-byte, in the
Vitest suite (`Candidate contract compliance` block).

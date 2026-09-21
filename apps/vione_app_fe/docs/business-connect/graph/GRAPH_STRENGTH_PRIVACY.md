# GRAPH_STRENGTH_PRIVACY.md — Viewer-Relative Strength

**Policy:** viewer-relative score (Option A). The score is computed only
from signals the viewer can see under BC-4.1 RLS visibility.

## Guarantees

- Signals invisible to the viewer are **not fetched** by the repository
  (RLS filters at the database), so they cannot influence the score.
- The response never includes: node identifiers other than the pair,
  edge ids, raw metadata, timeline event ids, message content, notes,
  or any PII.
- Contribution records expose only:
  `signalKind`, `category`, `rawCount`, `effectiveCount`, `baseWeight`,
  `frequencyFactor`, `recencyFactor`, `cappedContribution`, `explanationKey`.
- Denied pairs surface a stable `STRENGTH_PRIVACY_RESTRICTED` error rather
  than a numeric value → no oracle behavior via score deltas.

## Implication

Two different viewers of the same pair may see different scores. This is
intentional and documented; the alternative (canonical score) would leak
hidden signal existence via arithmetic.

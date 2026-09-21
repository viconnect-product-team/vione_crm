# GRAPH_RECOMMENDATION_PAGINATION — BC-4.4

Cursors are opaque base64 JSON: `{ v, src, kinds, rank, id }`.

- **`v`** — must equal the current `RELATIONSHIP_RECOMMENDATION_VERSION`.
  Mismatch → `RECOMMENDATION_VERSION_UNSUPPORTED`.
- **`src`** + **`kinds`** — must match the query's source node id and
  normalized `targetNodeKinds`. Mismatch → `RECOMMENDATION_CURSOR_INVALID`.
- **`rank` + `id`** — last emitted `(score, candidateId)` pair; the next
  page starts at the first candidate strictly after that pair in the
  deterministic sort order.

Cursors are single-version. When the version bumps, all outstanding
cursors become invalid — clients must restart at `cursor = null`.

Page size:

- Default: `RECO_DEFAULT_LIMIT` (10).
- Max: `RECO_MAX_LIMIT` (50).
- Candidate pool per query is bounded by `RECO_MAX_CANDIDATE_POOL` (500).

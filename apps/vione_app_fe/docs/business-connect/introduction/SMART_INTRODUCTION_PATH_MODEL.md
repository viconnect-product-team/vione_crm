# BC-6.0 — Smart Introduction: Path Model, Diversity, Performance, SDK

## Path Model

- Canonical 2-hop: `Source → Intermediary → Target`.
- Optional 3-hop: `Source → A → B → Target`, only when `maxDepth = 3`.
- No repeated nodes, no cycles, no self target.
- Direct-connection short-circuit: `TARGET_ALREADY_CONNECTED`.
- Intermediary node must be `status = active` and `node_kind = person`.

## Eligibility (fail-closed)

Source can read intermediary AND target; each edge is `status = active`;
no pair in path is blocked; source and target are distinct; no hidden node
is required to explain the path.

## Diversity

`INTRODUCTION_DIVERSITY`:

- `maxPathsPerPrimaryIntermediary = 2`
- `maxPathsPerDominantContext = 2`
  Applied deterministically after ranking, before slicing to `limit`.

## Performance / Budgets

`INTRODUCTION_BUDGETS`:

- `defaultLimit = 10`, `maxLimit = 25`
- `maxCandidatePaths = 200`
- `maxFirstDegreeFanOut = 200`
- `maxIntermediaryFanOut = 50` (3-hop)

DB shape per query:

- 1× `getNode(source)` via external-ref lookup
- 1× `getNode(target)`
- 2× `neighborIds(...)` (source, target) — batched by Supabase
- ≤ 1× `batchNeighborIds(srcNeighbors)` (3-hop only)
- 1× `getNodes(intermediaryIds)` for status hydration

Never per-path or per-intermediary queries.

## Cursor

`{ v: version, t: targetNodeId, d: maxDepth, k: "score.pathId" }`, base64url.
Rejected with `INTRODUCTION_VERSION_UNSUPPORTED` on version mismatch and
`INTRODUCTION_CURSOR_INVALID` otherwise.

## Telemetry (viewer-safe)

`smart_introduction_queried`, `smart_introduction_paths_found`,
`smart_introduction_empty`, `smart_introduction_denied`,
`smart_introduction_truncated`. Payloads: version, requestedDepth,
returnedCount, confidence distribution, duration bucket. Never node ids,
names, or strength evidence.

## SDK Boundary

`SmartIntroductionSDK.findPaths(query)` — framework-free, no React, no
Supabase, no repository/service imports. Delegates to the auth-guarded
server function. No authority-bearing inputs.

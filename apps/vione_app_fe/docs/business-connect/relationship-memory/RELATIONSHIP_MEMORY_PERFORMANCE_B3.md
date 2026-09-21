# BC-9.1 Turn B3 — Performance & Bounded Execution

Every RM code path is bounded by a frozen constant. No path can grow with
tenant size, corpus size, or hostile input.

## Retrieval

| Bound                         | Value                                       |
| ----------------------------- | ------------------------------------------- |
| `SEARCH_LIMIT_DEFAULT`        | 20                                          |
| `SEARCH_LIMIT_MAX`            | 100 (server clamps caller-supplied `limit`) |
| `SEMANTIC_CANDIDATE_POOL_MAX` | 200                                         |
| `SEMANTIC_MIN_SIMILARITY`     | 0.55                                        |
| `QUERY_MAX_CHARS`             | 400                                         |

## Graph

| Bound             | Value                              |
| ----------------- | ---------------------------------- |
| `GRAPH_MAX_DEPTH` | 2                                  |
| `GRAPH_MAX_NODES` | 100                                |
| Edges per node    | derived from remaining node budget |

## BC-9.0 context adapter

| Bound                             | Value |
| --------------------------------- | ----- |
| candidate memories per capability | ≤ 20  |
| final facts per capability        | ≤ 8   |

## Worker

| Bound                  | Value |
| ---------------------- | ----- |
| max receipts per sweep | 50    |
| claim TTL              | 5 min |
| max attempts           | 5     |
| provider timeout       | 15 s  |

## Embedding

| Bound              | Value                           |
| ------------------ | ------------------------------- |
| dimensions         | 1536 (`text-embedding-3-small`) |
| max attempts       | 5                               |
| stale sweep window | 24 h                            |

## Termination guarantees

- Graph BFS holds a visited set → cycles terminate at depth ≤ 2.
- Hybrid ranking is a pure function over ≤ 200 rows.
- Structured retrieval issues one bounded SQL statement.
- Semantic retrieval issues one bounded `SECURITY DEFINER` RPC.
- Worker uses `SKIP LOCKED` + attempt cap; no unbounded polling.

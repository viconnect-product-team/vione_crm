# GRAPH_QUERY_LIMITS.md — BC-4.1

Enforced at the repository/service layer. No caller can override.

| Limit                   | Value         | Enforced by              |
| ----------------------- | ------------- | ------------------------ |
| default limit           | 25            | repository               |
| max limit               | 100           | repository (clamp)       |
| max shortest-path depth | 4             | service (`maxDepth`)     |
| max path fan-out        | 50            | service (BFS truncation) |
| BFS cycle protection    | ✓             | service (visited set)    |
| cursor kind             | opaque base64 | repository               |
| pagination style        | keyset by id  | repository               |

Fan-out truncation is silent to callers; it emits
`graph_query_truncated` telemetry but never signals hidden topology.

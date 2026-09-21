# GRAPH_TIMELINE_SERVICE.md — BC-4.2

`RelationshipGraphSDK.timeline(query)` / `.pairTimeline(query)` / `.history(query)`.

## Ordering & pagination

- `occurred_at DESC, id DESC`
- Keyset cursor: base64 `{ o: occurred_at, i: id }`; consumers treat it as opaque
- No OFFSET pagination
- Invalid cursor → `INVALID_CURSOR`

## Filters

- `eventKinds` — validated against registry
- `nodeKinds` — reserved; enforced by node visibility today

## Redaction

- Visibility enforced by RLS on both `subject_node_id` and `related_node_id`
- `metadata` is projected through `edge.metadataAllowlist` on read
- `summary_key` is an i18n key; the service NEVER localizes text
- Archived events are hidden

## Determinism

- Emission is transactional with the underlying edge write
- `dedupe_key = 'edge:<edge_id>'` — one row per edge, replay-safe

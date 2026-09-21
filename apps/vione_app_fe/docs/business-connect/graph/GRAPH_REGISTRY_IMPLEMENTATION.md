# GRAPH_REGISTRY_IMPLEMENTATION.md — BC-4.1

`src/lib/graph/registry.ts` loads the frozen BC-4.0 node/edge manifest at
module scope. Validation runs at load time:

- Duplicate `kind` → throw.
- Alias collision with any `kind` or other alias → throw.
- Edge referencing an unknown node kind → throw.
- Missing or mismatched inverse (`e.inverse.inverse !== e.kind`) → throw.
- Directed inverse whose `fromKinds`/`toKinds` are not the mirror → throw.

The exported `graphRegistry` singleton is frozen. Product code cannot
mutate registrations (verified by `graph-registry.bc41.test.ts`).

## Registration shape

See `NodeKindRegistration` and `EdgeKindRegistration` in `registry.ts`:
kind, version, aliases, source/target kinds, directionality, inverse,
cardinality, visibility default, timeline flag, strength band, AI flag,
capabilities, metadata allowlist, deprecation.

## Deterministic manifest hash

`graphRegistry.manifestHash` is a stable non-crypto hash of the ordered
`[kind, version]` (nodes) + `[kind, version, inverse]` (edges) tuple.
Persisted per deploy in `graph_registry_versions`.

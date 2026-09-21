# BC-9.1 Turn A — Relationship Memory SDK Contract

UI and hook code MUST import ONLY from
`@/lib/business-connect/relationship-memory`. Server modules
(`repository.server.ts`, future extractors) are excluded from the barrel and
must not be re-exported.

## Turn A public surface

```ts
export interface RelationshipMemorySDKType {
  list(filters?: RelationshipMemoryListFilters): Promise<RelationshipMemoryListDTO>;
  getById(id: string): Promise<RelationshipMemoryDTO | null>;
}
```

- `list()` — owner-scoped, filterable by subject, kinds, statuses,
  `minConfidence`, `maxSensitivity`, and `limit`. Returns a bounded page
  plus `nextCursor` and the frozen `registryVersion`.
- `getById()` — owner-scoped point read.

Turn B will extend the SDK with proposal / accept / reject / merge /
forget methods. The Turn A read shape is frozen and MUST remain stable.

## Error contract

Server functions throw `RelationshipMemoryError` with one of the frozen
codes in `RELATIONSHIP_MEMORY_ERROR_CODES`. Callers must render errors by
code, never by message.

## SDK freeze test

`relationship-memory-policy.bc91.test.ts` asserts
`RELATIONSHIP_MEMORY_SDK_METHODS` is frozen and covers every method on the
exported `RelationshipMemorySDK`.

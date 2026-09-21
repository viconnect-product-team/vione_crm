# GRAPH_EXTENSION_GUIDE — Registering New Nodes, Edges, Capabilities

Design-only. No code in this slice.

## Golden Rule

**Never modify engine code to add a product relationship.** Register it.

## What Products May Register

1. **Node kinds** — via `NodeKindRegistration`.
2. **Edge types** — via `EdgeTypeRegistration` (must reference already-
   registered node kinds).
3. **Capabilities** — free-form flags consumed by the product, opaque to
   the engine.
4. **Timeline summaries** — i18n keys and dedupe/collapse hints.
5. **Strength contributions** — signal source, base weight, decay.
6. **Recommendation reasons** — strings surfaced by `recommendConnections`.

## What Products MUST NOT Do

- Import Repository or Service classes.
- Read or write the underlying edge / node / timeline tables.
- `switch (edgeType)` for behavior — read the registry entry.
- Mint their own visibility semantics.
- Attach product-only PII to shared metadata; use domain tables and join by
  `refId`.

## Registration Lifecycle

1. Product publishes a registration manifest at build time.
2. Engine validates uniqueness of `kind` / `type`, cardinality, and
   metadata schema.
3. Registrations are versioned; removing a type requires a deprecation
   window and a migration entry in `GRAPH_MIGRATION_PLAN.md`.

## Backwards Compatibility

- New optional fields are always allowed.
- Renaming an edge type requires an alias registration for one major
  version.
- Tightening visibility requires a redaction pass on historical edges.

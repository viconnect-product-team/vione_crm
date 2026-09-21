# BC-3.0 — Legacy ↔ Global Networking Read Adapter

Architecture Version: **Business Connect v1 (FROZEN)**. Design only.

## 1. Goal

Provide the UI a **single relationship view** per counterpart without merging the
two storage systems. The adapter is **read-only** and never writes across domains.

## 2. Isolation invariants

- Legacy Association Networking (`connections`, `net_*`, member id space) is **unchanged**.
- Global Networking (`user_connections`, user id space) is **new and independent**.
- The adapter **reads** both; it never migrates, dual-writes, or reconciles rows.
- No big-bang migration of legacy connections. Legacy stays authoritative for member surfaces.

## 3. Unified read shape (contract)

```ts
type UnifiedRelationship = {
  counterpartUserId?: string; // global identity (auth.uid) when known
  counterpartMemberId?: string; // association member id when applicable
  // Independent, coexisting states — never collapsed into one field:
  savedCard: "none" | "saved"; // one-sided, owner-private
  globalConnection: // mutual, lifecycle
    "none" | "pending_outgoing" | "pending_incoming" | "accepted" | "blocked";
  associationConnection: // legacy, member scope
    "none" | "pending_outgoing" | "pending_incoming" | "connected";
  companyContext?: { companyId: string; role: string } | null;
};
```

Rules:

- The three relationship states are **orthogonal columns**, surfaced side by side.
- A saved card **must not** be rendered as a connection.
- When both a legacy and a global edge exist for the same human, they are shown
  distinctly (e.g. "Hội viên hiệp hội" vs "Kết nối Business"); the adapter does
  **not** pick a winner or merge them.

## 4. Resolution strategy

1. Resolve `counterpartUserId` (from Business Card owner / profile) and, if the
   viewer is an association member and the counterpart has a member row,
   `counterpartMemberId`.
2. `savedCard` ← `saved_business_cards` (owner = viewer).
3. `globalConnection` ← `user_connections` where viewer is a participant.
4. `associationConnection` ← legacy `getNetworkStateFn` (only when both are members).
5. `companyContext` ← optional `company_members` lookup (metadata only).

Missing identities degrade gracefully to `"none"` — never throw for a missing
member row or missing profile.

## 5. UI mapping (no UI change this phase)

- Existing Member Networking UI keeps reading legacy state directly — **untouched**.
- New global surfaces consume `UnifiedRelationship` via `GlobalConnectionSDK`.
- Action buttons map to explicit lifecycle methods (Connect / Accept / Decline /
  Cancel / Disconnect / Save Card) — never a raw status write.

## 6. Forbidden in the adapter

- Writing to `connections` from global flows (or vice versa).
- Treating saved card as accepted connection.
- Creating member rows to satisfy a global connection.
- Exposing private relationship metadata (notes, tags, scores) of the counterpart.

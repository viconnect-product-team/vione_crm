# GRAPH_EVENT_MODEL — Event Contracts

Design-only.

## Event Envelope

```ts
export interface GraphEngineEvent<T extends GraphEventKind = GraphEventKind> {
  id: string;
  kind: T;
  version: 1;
  occurredAt: string;
  actorNodeId?: string;
  subjectNodeId: string;
  edgeId?: string;
  edgeType?: EdgeType;
  payload: GraphEventPayload[T];
  visibility: EdgeVisibility;
}

export type GraphEventKind =
  | "saved_card"
  | "unsaved_card"
  | "viewed_card"
  | "met"
  | "introduced"
  | "referred"
  | "joined"
  | "left"
  | "attended"
  | "checked_in"
  | "invited"
  | "accepted_invitation"
  | "connected"
  | "disconnected"
  | "custom";
```

## Payload Shapes (v1)

```ts
export interface GraphEventPayload {
  saved_card: { cardSlug: string };
  unsaved_card: { cardSlug: string };
  viewed_card: { cardSlug: string; surface: string };
  met: { meetingId?: string; venue?: string };
  introduced: { introducerNodeId: string; contextNote?: string };
  referred: { opportunityId?: string; contextNote?: string };
  joined: { orgKind: "association" | "community"; orgId: string };
  left: { orgKind: "association" | "community"; orgId: string };
  attended: { eventId: string };
  checked_in: { eventId?: string; locationId?: string };
  invited: { channel: "email" | "app" | "link" };
  accepted_invitation: { inviteId: string };
  connected: { requestNodeId?: string };
  disconnected: { reason?: "user" | "block" | "system" };
  custom: Record<string, unknown>;
}
```

## Delivery

- Emitted synchronously by Service writes; consumers subscribe via a
  topic-per-`kind` bus (design intent, no transport chosen here).
- At-least-once delivery; consumers must be idempotent by `event.id`.
- Retention and replay are per-tenant policy.

## Future Kinds

Reserved without implementation: `messaged`, `purchased`, `sold`,
`sponsored`, `hosted`, `spoke_at`, `bookmarked`, `followed`, `liked`.

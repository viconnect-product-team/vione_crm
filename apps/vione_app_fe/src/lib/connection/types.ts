// BC-5.0 — Canonical Connection domain (client-safe types).
//
// This layer is a THIN ADAPTER over the existing Global Networking engine
// (`user_connections` + `GlobalConnectionService`). BC-5.0 does not introduce
// a parallel table; it re-keys the public API on `personNodeId`
// (Relationship Graph `person` nodes) so product code speaks a single
// vocabulary and never touches raw user ids or graph edges directly.

/** Frozen canonical error codes for the Connection domain. */
export const CONNECTION_ERROR_CODES = [
  "UNAUTHENTICATED",
  "TARGET_NOT_FOUND",
  "SELF_CONNECTION_FORBIDDEN",
  "ALREADY_CONNECTED",
  "REQUEST_ALREADY_PENDING",
  "REQUEST_NOT_FOUND",
  "REQUEST_NOT_PENDING",
  "REQUEST_NOT_OWNED",
  "REQUEST_BLOCKED",
  "BLOCK_ALREADY_EXISTS",
  "BLOCK_NOT_FOUND",
  "NOT_CONNECTED",
  "IDEMPOTENCY_CONFLICT",
  "INVALID_INPUT",
  "FORBIDDEN",
  "INTERNAL_ERROR",
] as const;
export type ConnectionErrorCode = (typeof CONNECTION_ERROR_CODES)[number];

/** Frozen canonical relationship state (viewer-relative). */
export const CONNECTION_STATES = [
  "none",
  "outgoing_pending",
  "incoming_pending",
  "connected",
  "blocked_by_me",
  "blocked_me",
  "unavailable",
] as const;
export type ConnectionState = (typeof CONNECTION_STATES)[number];

/**
 * Frozen precedence for state resolution. Higher index = higher priority.
 * Documented in docs/business-connect/connection/CONNECTION_STATE_MACHINE.md.
 */
export const CONNECTION_STATE_PRECEDENCE: ConnectionState[] = [
  "none",
  "outgoing_pending",
  "incoming_pending",
  "connected",
  "blocked_me",
  "blocked_by_me",
  "unavailable",
];

export type ConnectionRequestStatus = "pending" | "accepted" | "declined" | "cancelled" | "expired";

export interface PersonRef {
  personNodeId: string;
  userId?: string | null;
}

export interface ConnectionRequestDTO {
  id: string;
  requester: PersonRef;
  recipient: PersonRef;
  status: ConnectionRequestStatus;
  message?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  cancelledAt?: string | null;
  expiresAt?: string | null;
}

export interface ConnectionRelationshipStateDTO {
  state: ConnectionState;
  updatedAt?: string | null;
  connectionId?: string | null;
  /** Viewer-authored request/connection id used by lifecycle actions. */
  requestId?: string | null;
}

export interface ConnectionSummaryDTO {
  person: PersonRef;
  connectionId: string;
  connectedAt: string;
}

export interface SendRequestInput {
  targetPersonNodeId: string;
  message?: string;
  mutationKey?: string;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
}

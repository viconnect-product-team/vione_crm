// BC-5.0 — ConnectionError + normalization from underlying engines.

import { CONNECTION_ERROR_CODES, type ConnectionErrorCode } from "./types";
import { GlobalNetworkError } from "@/lib/global-network/errors";
import { GraphError } from "@/lib/graph";

const CODE_SET: ReadonlySet<string> = new Set(CONNECTION_ERROR_CODES);

/** Stable, product-facing connection error. Never carries SQL / RLS detail. */
export class ConnectionError extends Error {
  readonly code: ConnectionErrorCode;
  constructor(code: ConnectionErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ConnectionError";
    this.code = code;
  }
}

const GN_MAP: Record<string, ConnectionErrorCode> = {
  NETWORK_AUTH_REQUIRED: "UNAUTHENTICATED",
  NETWORK_ACCOUNT_SUSPENDED: "FORBIDDEN",
  NETWORK_ACCOUNT_INACTIVE: "FORBIDDEN",
  NETWORK_TARGET_NOT_FOUND: "TARGET_NOT_FOUND",
  NETWORK_SELF_CONNECTION: "SELF_CONNECTION_FORBIDDEN",
  NETWORK_ALREADY_CONNECTED: "ALREADY_CONNECTED",
  NETWORK_ALREADY_PENDING: "REQUEST_ALREADY_PENDING",
  NETWORK_CONNECTION_NOT_FOUND: "REQUEST_NOT_FOUND",
  NETWORK_INVALID_TRANSITION: "REQUEST_NOT_PENDING",
  NETWORK_NOT_REQUESTER: "REQUEST_NOT_OWNED",
  NETWORK_NOT_RECIPIENT: "REQUEST_NOT_OWNED",
  NETWORK_NOT_PARTICIPANT: "FORBIDDEN",
  NETWORK_BLOCKED: "REQUEST_BLOCKED",
  NETWORK_BLOCK_EXISTS: "BLOCK_ALREADY_EXISTS",
  NETWORK_BLOCK_NOT_FOUND: "BLOCK_NOT_FOUND",
  NETWORK_IDEMPOTENCY_CONFLICT: "IDEMPOTENCY_CONFLICT",
  NETWORK_RATE_LIMITED: "FORBIDDEN",
  NETWORK_INVALID_INPUT: "INVALID_INPUT",
};

const GRAPH_MAP: Record<string, ConnectionErrorCode> = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  NODE_NOT_FOUND: "TARGET_NOT_FOUND",
  SOURCE_NODE_NOT_FOUND: "TARGET_NOT_FOUND",
  TARGET_NODE_NOT_FOUND: "TARGET_NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  WRITE_FORBIDDEN: "FORBIDDEN",
  IDEMPOTENCY_CONFLICT: "IDEMPOTENCY_CONFLICT",
  SELF_EDGE_FORBIDDEN: "SELF_CONNECTION_FORBIDDEN",
  EDGE_ALREADY_EXISTS: "ALREADY_CONNECTED",
};

export function toConnectionError(err: unknown): ConnectionError {
  if (err instanceof ConnectionError) return err;
  if (err instanceof GlobalNetworkError) {
    return new ConnectionError(GN_MAP[err.code] ?? "INTERNAL_ERROR");
  }
  if (err instanceof GraphError) {
    return new ConnectionError(GRAPH_MAP[err.code] ?? "INTERNAL_ERROR");
  }
  const code = (err as { code?: string } | null)?.code;
  if (code && CODE_SET.has(code)) return new ConnectionError(code as ConnectionErrorCode);
  return new ConnectionError("INTERNAL_ERROR");
}

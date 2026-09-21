// BC-4.1/4.2 — Relationship Graph Engine — Stable error contract.
// Consumers pattern-match on `code`; no SQL, table, RLS, or hidden-topology
// detail is ever leaked through `message` or `details`.

export type GraphErrorCode =
  // Read (BC-4.1)
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NODE_NOT_FOUND"
  | "EDGE_NOT_FOUND"
  | "KIND_NOT_REGISTERED"
  | "INVALID_NODE_KIND"
  | "INVALID_EDGE_KIND"
  | "INVALID_DIRECTION"
  | "INVALID_CURSOR"
  | "LIMIT_EXCEEDED"
  | "DEPTH_EXCEEDED"
  | "PATH_NOT_FOUND"
  | "CROSS_TENANT_FORBIDDEN"
  | "REGISTRY_VERSION_MISMATCH"
  // Write (BC-4.2)
  | "WRITE_FORBIDDEN"
  | "PRODUCER_CAPABILITY_REQUIRED"
  | "SOURCE_NODE_NOT_FOUND"
  | "TARGET_NODE_NOT_FOUND"
  | "EDGE_ALREADY_EXISTS"
  | "EDGE_ARCHIVED"
  | "CARDINALITY_VIOLATION"
  | "SELF_EDGE_FORBIDDEN"
  | "SCOPE_MISMATCH"
  | "VISIBILITY_INVALID"
  | "IDEMPOTENCY_CONFLICT"
  | "METADATA_INVALID"
  | "EVENT_EMISSION_FAILED"
  // Strength (BC-4.3)
  | "STRENGTH_NOT_AVAILABLE"
  | "STRENGTH_VERSION_UNSUPPORTED"
  | "STRENGTH_RECOMPUTE_REQUIRED"
  | "STRENGTH_SIGNAL_INVALID"
  | "STRENGTH_PRIVACY_RESTRICTED"
  // Recommendation (BC-4.4)
  | "RECOMMENDATION_CURSOR_INVALID"
  | "RECOMMENDATION_VERSION_UNSUPPORTED"
  | "RECOMMENDATION_SOURCE_DISABLED"
  | "RECOMMENDATION_PRIVACY_RESTRICTED"
  // Smart Introduction (BC-6.0)
  | "TARGET_NOT_FOUND"
  | "INTRODUCTION_NOT_AVAILABLE"
  | "NO_INTRODUCTION_PATH"
  | "TARGET_ALREADY_CONNECTED"
  | "INTRODUCTION_PRIVACY_RESTRICTED"
  | "INTRODUCTION_QUERY_INVALID"
  | "INTRODUCTION_CURSOR_INVALID"
  | "INTRODUCTION_VERSION_UNSUPPORTED"
  | "INTERNAL_ERROR";

export class GraphError extends Error {
  readonly code: GraphErrorCode;
  readonly details?: Readonly<Record<string, string | number | boolean>>;

  constructor(
    code: GraphErrorCode,
    message?: string,
    details?: Record<string, string | number | boolean>,
  ) {
    super(message ?? code);
    this.name = "GraphError";
    this.code = code;
    this.details = details ? Object.freeze({ ...details }) : undefined;
  }
}

export const graphErr = (
  code: GraphErrorCode,
  message?: string,
  details?: Record<string, string | number | boolean>,
) => new GraphError(code, message, details);

/** Normalize a Postgres exception (from a graph RPC) to a stable GraphError. */
export function graphErrorFromPg(e: unknown): GraphError {
  const msg = (e as { message?: string } | null)?.message ?? "";
  const code = msg.split(/[\s:]/)[0]?.trim() ?? "";
  const known: GraphErrorCode[] = [
    "UNAUTHENTICATED",
    "WRITE_FORBIDDEN",
    "SELF_EDGE_FORBIDDEN",
    "VISIBILITY_INVALID",
    "SOURCE_NODE_NOT_FOUND",
    "TARGET_NODE_NOT_FOUND",
    "EDGE_NOT_FOUND",
    "NODE_NOT_FOUND",
    "IDEMPOTENCY_CONFLICT",
    "METADATA_INVALID",
    "CARDINALITY_VIOLATION",
    "SCOPE_MISMATCH",
    "REGISTRY_VERSION_MISMATCH",
    "EDGE_ALREADY_EXISTS",
    "EDGE_ARCHIVED",
    "PRODUCER_CAPABILITY_REQUIRED",
    "EVENT_EMISSION_FAILED",
  ];
  if (known.includes(code as GraphErrorCode)) return new GraphError(code as GraphErrorCode);
  // Postgres unique_violation → collapsed
  if (/unique_violation|duplicate/i.test(msg)) return new GraphError("EDGE_ALREADY_EXISTS");
  if (/permission denied/i.test(msg)) return new GraphError("WRITE_FORBIDDEN");
  return new GraphError("INTERNAL_ERROR");
}

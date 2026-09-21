// BC-Mobile-5E — Connection Handshake domain types (client-safe).
//
// ONE viewer-relative shape crosses the wire. It NEVER carries the identity
// owner_user_id, identity ids, pair internals, requester/recipient fields, or
// raw connection rows — only the actionable state and, when the viewer may
// act on it, the connection id needed by the existing lifecycle RPCs.

/** Viewer-relative handshake state for the identity behind a share token. */
export type IdentityConnectionStateKind =
  | "self"
  | "none"
  | "outgoing_pending"
  | "incoming_pending"
  | "connected"
  | "unavailable";

export type IdentityConnectionState = {
  state: IdentityConnectionStateKind;
  /**
   * Present ONLY when the viewer may act on the pair:
   * - outgoing_pending → withdraw (cancel)
   * - incoming_pending → accept / decline
   * Null for self / none / connected / unavailable.
   */
  connectionId: string | null;
};

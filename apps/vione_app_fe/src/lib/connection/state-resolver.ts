// BC-5.0 — Pure state resolver with FROZEN precedence.
//
// Precedence (highest → lowest):
//   1. unavailable
//   2. blocked_by_me
//   3. blocked_me
//   4. connected
//   5. incoming_pending
//   6. outgoing_pending
//   7. none
//
// The resolver never queries the DB; the service layer feeds it already
// resolved signals so the same rules can be unit-tested in isolation.

import type { ConnectionState } from "./types";

export interface StateResolverInput {
  /** Target user/person exists and is currently reachable. */
  targetAvailable: boolean;
  /** Current viewer blocked the target. */
  blockedByMe: boolean;
  /** Target blocked the viewer. */
  blockedMe: boolean;
  /** Active accepted connection between viewer and target. */
  connected: boolean;
  /** Pending request the viewer received (target → viewer). */
  incomingPending: boolean;
  /** Pending request the viewer sent (viewer → target). */
  outgoingPending: boolean;
}

/** Deterministically resolve one canonical ConnectionState. */
export function resolveConnectionState(input: StateResolverInput): ConnectionState {
  if (!input.targetAvailable) return "unavailable";
  if (input.blockedByMe) return "blocked_by_me";
  if (input.blockedMe) return "blocked_me";
  if (input.connected) return "connected";
  if (input.incomingPending) return "incoming_pending";
  if (input.outgoingPending) return "outgoing_pending";
  return "none";
}

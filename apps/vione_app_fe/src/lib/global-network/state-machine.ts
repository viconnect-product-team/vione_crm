// BC-3.1A — Pure global connection state machine (frozen per BC3_0).
// No DB, no side effects. This mirrors the DB transition guard so the same
// rules can be unit-tested and reused in the service layer.

import type { GlobalConnectionOperation, GlobalConnectionStatus } from "./types";

export type LifecycleState = GlobalConnectionStatus | "none";
export type Actor = "requester" | "recipient" | "either" | "non_participant";

export type TransitionRequest = {
  from: LifecycleState;
  operation: GlobalConnectionOperation;
  actor: Actor;
};

export type TransitionResult =
  | { ok: true; to: GlobalConnectionStatus }
  | { ok: false; reason: string };

/**
 * Frozen transition table. Actor is resolved from trusted context (requester /
 * recipient / either participant), never from client input.
 */
export function evaluateTransition(req: TransitionRequest): TransitionResult {
  const { from, operation, actor } = req;

  if (actor === "non_participant") {
    return { ok: false, reason: "NETWORK_NOT_PARTICIPANT" };
  }

  switch (operation) {
    case "send_request":
      // none/terminal -> pending. Active/pending/blocked handled by caller.
      if (from === "pending") return { ok: false, reason: "NETWORK_ALREADY_PENDING" };
      if (from === "accepted") return { ok: false, reason: "NETWORK_ALREADY_CONNECTED" };
      if (from === "blocked") return { ok: false, reason: "NETWORK_BLOCKED" };
      return { ok: true, to: "pending" };

    case "accept":
      if (from !== "pending") return { ok: false, reason: "NETWORK_INVALID_TRANSITION" };
      if (actor !== "recipient") return { ok: false, reason: "NETWORK_NOT_RECIPIENT" };
      return { ok: true, to: "accepted" };

    case "decline":
      if (from !== "pending") return { ok: false, reason: "NETWORK_INVALID_TRANSITION" };
      if (actor !== "recipient") return { ok: false, reason: "NETWORK_NOT_RECIPIENT" };
      return { ok: true, to: "declined" };

    case "cancel":
      if (from !== "pending") return { ok: false, reason: "NETWORK_INVALID_TRANSITION" };
      if (actor !== "requester") return { ok: false, reason: "NETWORK_NOT_REQUESTER" };
      return { ok: true, to: "cancelled" };

    case "disconnect":
      if (from !== "accepted") return { ok: false, reason: "NETWORK_INVALID_TRANSITION" };
      return { ok: true, to: "disconnected" };

    case "block":
      if (from === "blocked") return { ok: false, reason: "NETWORK_INVALID_TRANSITION" };
      return { ok: true, to: "blocked" };

    default:
      return { ok: false, reason: "NETWORK_INVALID_TRANSITION" };
  }
}

/** Whether a status participates in the active-pair uniqueness window. */
export function isActiveStatus(status: LifecycleState): boolean {
  return status === "pending" || status === "accepted" || status === "blocked";
}

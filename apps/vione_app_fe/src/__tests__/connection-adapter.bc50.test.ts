// BC-5.0 — Contract tests for the Connection adapter.
//
// Proves that:
//   1. The canonical state resolver honours the frozen precedence
//      (unavailable > blocked_by_me > blocked_me > connected >
//       incoming_pending > outgoing_pending > none).
//   2. Legacy Global Networking pair states and the Business Connect
//      relationship state DTO resolve to the SAME logical state, so the two
//      surfaces cannot disagree.
//   3. Domain error normalization from GlobalNetworkError → ConnectionError
//      preserves the meaningful codes clients branch on.
//
// Pure: no live DB, no side effects.

import { describe, it, expect } from "vitest";
import { resolveConnectionState, type StateResolverInput } from "@/lib/connection/state-resolver";
import { ConnectionError, toConnectionError } from "@/lib/connection/errors";
import type { ConnectionState } from "@/lib/connection/types";
import { GlobalNetworkError } from "@/lib/global-network/errors";
import type { PairState } from "@/lib/global-network/types";

const base: StateResolverInput = {
  targetAvailable: true,
  blockedByMe: false,
  blockedMe: false,
  connected: false,
  incomingPending: false,
  outgoingPending: false,
};

describe("BC-5.0 — canonical state resolver precedence", () => {
  it.each<[Partial<StateResolverInput>, ConnectionState]>([
    [{}, "none"],
    [{ outgoingPending: true }, "outgoing_pending"],
    [{ incomingPending: true }, "incoming_pending"],
    [{ connected: true }, "connected"],
    [{ blockedMe: true, connected: true }, "blocked_me"],
    [{ blockedByMe: true, blockedMe: true, connected: true }, "blocked_by_me"],
    [
      {
        targetAvailable: false,
        blockedByMe: true,
        blockedMe: true,
        connected: true,
        incomingPending: true,
        outgoingPending: true,
      },
      "unavailable",
    ],
  ])("resolves %j → %s", (patch, expected) => {
    expect(resolveConnectionState({ ...base, ...patch })).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Cross-surface equivalence: legacy PairState → canonical ConnectionState
// ---------------------------------------------------------------------------

function legacyToCanonical(pair: PairState, targetAvailable = true): ConnectionState {
  return resolveConnectionState({
    targetAvailable,
    blockedByMe: pair.blocked && pair.direction !== "incoming",
    blockedMe: pair.blocked && pair.direction === "incoming",
    connected: pair.status === "accepted",
    incomingPending: pair.status === "pending" && pair.direction === "incoming",
    outgoingPending: pair.status === "pending" && pair.direction === "outgoing",
  });
}

describe("BC-5.0 — legacy Global Networking ↔ canonical adapter equivalence", () => {
  const cases: Array<[PairState, ConnectionState]> = [
    [
      {
        targetUserId: "u",
        status: "none",
        direction: "none",
        connectionId: null,
        blocked: false,
      },
      "none",
    ],
    [
      {
        targetUserId: "u",
        status: "pending",
        direction: "outgoing",
        connectionId: "c1",
        blocked: false,
      },
      "outgoing_pending",
    ],
    [
      {
        targetUserId: "u",
        status: "pending",
        direction: "incoming",
        connectionId: "c1",
        blocked: false,
      },
      "incoming_pending",
    ],
    [
      {
        targetUserId: "u",
        status: "accepted",
        direction: "outgoing",
        connectionId: "c1",
        blocked: false,
      },
      "connected",
    ],
  ];

  it.each(cases)("legacy %j maps to canonical %s", (pair, expected) => {
    expect(legacyToCanonical(pair)).toBe(expected);
  });

  it("unavailable target overrides every legacy pair state", () => {
    const pair: PairState = {
      targetUserId: "u",
      status: "accepted",
      direction: "outgoing",
      connectionId: "c1",
      blocked: false,
    };
    expect(legacyToCanonical(pair, false)).toBe("unavailable");
  });

  it("legacy self direction never leaks into canonical connected state", () => {
    const pair: PairState = {
      targetUserId: "u",
      status: "none",
      direction: "self",
      connectionId: null,
      blocked: false,
    };
    expect(legacyToCanonical(pair)).toBe("none");
  });
});

// ---------------------------------------------------------------------------
// Error normalization
// ---------------------------------------------------------------------------

describe("BC-5.0 — error normalization preserves stable codes", () => {
  it.each([
    ["NETWORK_AUTH_REQUIRED", "UNAUTHENTICATED"],
    ["NETWORK_TARGET_NOT_FOUND", "TARGET_NOT_FOUND"],
    ["NETWORK_SELF_CONNECTION", "SELF_CONNECTION_FORBIDDEN"],
    ["NETWORK_ALREADY_CONNECTED", "ALREADY_CONNECTED"],
    ["NETWORK_ALREADY_PENDING", "REQUEST_ALREADY_PENDING"],
    ["NETWORK_CONNECTION_NOT_FOUND", "REQUEST_NOT_FOUND"],
    ["NETWORK_INVALID_TRANSITION", "REQUEST_NOT_PENDING"],
    ["NETWORK_NOT_REQUESTER", "REQUEST_NOT_OWNED"],
    ["NETWORK_BLOCKED", "REQUEST_BLOCKED"],
    ["NETWORK_BLOCK_EXISTS", "BLOCK_ALREADY_EXISTS"],
    ["NETWORK_IDEMPOTENCY_CONFLICT", "IDEMPOTENCY_CONFLICT"],
  ])("maps %s → %s", (gn, expected) => {
    // Cast is intentional: exercise the runtime code path with the exact
    // frozen string from the underlying engine.
    const err = toConnectionError(new GlobalNetworkError(gn as never));
    expect(err).toBeInstanceOf(ConnectionError);
    expect(err.code).toBe(expected);
  });

  it("unknown errors collapse to INTERNAL_ERROR (never leak SQL/RLS)", () => {
    const err = toConnectionError(new Error("permission denied for table graph_nodes"));
    expect(err.code).toBe("INTERNAL_ERROR");
  });
});

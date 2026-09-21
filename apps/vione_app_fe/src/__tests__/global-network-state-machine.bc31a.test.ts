import { describe, it, expect } from "vitest";
import { evaluateTransition, isActiveStatus } from "@/lib/global-network/state-machine";
import { normalizeSourceType, normalizeSourceId } from "@/lib/global-network/source";
import { toGlobalNetworkError, GlobalNetworkError } from "@/lib/global-network/errors";
import { GLOBAL_CONNECTION_SOURCE_TYPES } from "@/lib/global-network/types";

// ---------------------------------------------------------------------------
// BC-3.1A — Global Connection state machine + normalization (PURE).
// Mirrors the frozen BC3_0 state machine and the DB transition guard.
// No live DB, no side effects.
// ---------------------------------------------------------------------------

describe("BC-3.1A state machine — allowed transitions", () => {
  it("1. none -> pending allowed (requester)", () => {
    expect(
      evaluateTransition({ from: "none", operation: "send_request", actor: "requester" }),
    ).toEqual({ ok: true, to: "pending" });
  });

  it("2. pending -> accepted by recipient", () => {
    expect(
      evaluateTransition({ from: "pending", operation: "accept", actor: "recipient" }),
    ).toEqual({ ok: true, to: "accepted" });
  });

  it("3. pending -> declined by recipient", () => {
    expect(
      evaluateTransition({ from: "pending", operation: "decline", actor: "recipient" }),
    ).toEqual({ ok: true, to: "declined" });
  });

  it("4. pending -> cancelled by requester", () => {
    expect(
      evaluateTransition({ from: "pending", operation: "cancel", actor: "requester" }),
    ).toEqual({ ok: true, to: "cancelled" });
  });

  it("5. accepted -> disconnected by either participant", () => {
    expect(
      evaluateTransition({ from: "accepted", operation: "disconnect", actor: "either" }),
    ).toEqual({ ok: true, to: "disconnected" });
  });

  it("6. any active -> blocked", () => {
    expect(evaluateTransition({ from: "accepted", operation: "block", actor: "either" })).toEqual({
      ok: true,
      to: "blocked",
    });
    expect(evaluateTransition({ from: "pending", operation: "block", actor: "requester" })).toEqual(
      { ok: true, to: "blocked" },
    );
  });
});

describe("BC-3.1A state machine — rejected transitions", () => {
  it("7. requester cannot accept own request", () => {
    const r = evaluateTransition({ from: "pending", operation: "accept", actor: "requester" });
    expect(r).toEqual({ ok: false, reason: "NETWORK_NOT_RECIPIENT" });
  });

  it("8. recipient cannot cancel requester's request", () => {
    const r = evaluateTransition({ from: "pending", operation: "cancel", actor: "recipient" });
    expect(r).toEqual({ ok: false, reason: "NETWORK_NOT_REQUESTER" });
  });

  it("non-participant cannot change status", () => {
    const r = evaluateTransition({
      from: "pending",
      operation: "accept",
      actor: "non_participant",
    });
    expect(r).toEqual({ ok: false, reason: "NETWORK_NOT_PARTICIPANT" });
  });

  it("accepted -> pending is invalid (no re-request via transition)", () => {
    const r = evaluateTransition({ from: "accepted", operation: "accept", actor: "recipient" });
    expect(r.ok).toBe(false);
  });

  it("declined -> accepted invalid without new request", () => {
    const r = evaluateTransition({ from: "declined", operation: "accept", actor: "recipient" });
    expect(r.ok).toBe(false);
  });

  it("disconnected -> accepted invalid without new request", () => {
    const r = evaluateTransition({ from: "disconnected", operation: "accept", actor: "recipient" });
    expect(r.ok).toBe(false);
  });

  it("blocked cannot be re-requested (pair uniqueness / block)", () => {
    const r = evaluateTransition({
      from: "blocked",
      operation: "send_request",
      actor: "requester",
    });
    expect(r).toEqual({ ok: false, reason: "NETWORK_BLOCKED" });
  });

  it("re-request while pending -> already pending", () => {
    expect(
      evaluateTransition({ from: "pending", operation: "send_request", actor: "requester" }),
    ).toEqual({ ok: false, reason: "NETWORK_ALREADY_PENDING" });
  });

  it("re-request while accepted -> already connected", () => {
    expect(
      evaluateTransition({ from: "accepted", operation: "send_request", actor: "requester" }),
    ).toEqual({ ok: false, reason: "NETWORK_ALREADY_CONNECTED" });
  });

  it("disconnect on non-accepted invalid", () => {
    expect(
      evaluateTransition({ from: "pending", operation: "disconnect", actor: "either" }).ok,
    ).toBe(false);
  });

  it("block on already-blocked invalid", () => {
    expect(evaluateTransition({ from: "blocked", operation: "block", actor: "either" }).ok).toBe(
      false,
    );
  });
});

describe("BC-3.1A active-status window", () => {
  it("pending/accepted/blocked are active (span pair uniqueness)", () => {
    expect(isActiveStatus("pending")).toBe(true);
    expect(isActiveStatus("accepted")).toBe(true);
    expect(isActiveStatus("blocked")).toBe(true);
  });
  it("declined/cancelled/disconnected/none are not active (historical)", () => {
    expect(isActiveStatus("declined")).toBe(false);
    expect(isActiveStatus("cancelled")).toBe(false);
    expect(isActiveStatus("disconnected")).toBe(false);
    expect(isActiveStatus("none")).toBe(false);
  });
});

describe("BC-3.1A source normalization", () => {
  it("accepts every frozen source type", () => {
    for (const s of GLOBAL_CONNECTION_SOURCE_TYPES) {
      expect(normalizeSourceType(s)).toBe(s);
    }
  });
  it("rejects arbitrary client strings -> manual", () => {
    expect(normalizeSourceType("hacker")).toBe("manual");
    expect(normalizeSourceType(null)).toBe("manual");
    expect(normalizeSourceType(42)).toBe("manual");
  });
  it("normalizes source id to uuid or null", () => {
    expect(normalizeSourceId("11111111-1111-4111-8111-111111111111")).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(normalizeSourceId("not-a-uuid")).toBeNull();
    expect(normalizeSourceId(123)).toBeNull();
  });
});

describe("BC-3.1A error mapping", () => {
  it("passes through known domain codes", () => {
    const e = toGlobalNetworkError(new Error("boom NETWORK_ALREADY_PENDING boom"));
    expect(e).toBeInstanceOf(GlobalNetworkError);
    expect(e.code).toBe("NETWORK_ALREADY_PENDING");
  });
  it("maps unique violations to mutation conflict", () => {
    expect(toGlobalNetworkError(new Error("duplicate key value")).code).toBe(
      "NETWORK_MUTATION_CONFLICT",
    );
  });
  it("collapses unknown SQL text to NETWORK_UNKNOWN (no leak)", () => {
    expect(toGlobalNetworkError(new Error("relation x does not exist")).code).toBe(
      "NETWORK_UNKNOWN",
    );
  });
});

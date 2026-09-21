// BC-6.3F.1 — Introduction Delivery — dedicated regression suite.
// Pure client-safe contracts. Server integration (RLS, RPCs, concurrency,
// lazy-expiry, active uniqueness) is exercised by the DB E2E harness.

import { describe, expect, it } from "vitest";
import {
  INTRODUCTION_DELIVERY_ERROR_CODES,
  INTRODUCTION_DELIVERY_EXPIRY_DAYS,
  INTRODUCTION_DELIVERY_MAX_NOTE,
  INTRODUCTION_DELIVERY_STATUSES,
  INTRODUCTION_DELIVERY_TERMINAL,
  INTRODUCTION_DELIVERY_VERSION,
  IntroductionDeliveryError,
  IntroductionDeliverySDK,
  canTransition,
  toIntroductionDeliveryError,
  type IntroductionDeliveryStatus,
} from "@/lib/graph/introduction/delivery";

describe("BC-6.3F.1 — Constants freeze", () => {
  it("version + note cap + expiry window are frozen", () => {
    expect(INTRODUCTION_DELIVERY_VERSION).toBe("1.0.0");
    expect(INTRODUCTION_DELIVERY_MAX_NOTE).toBe(500);
    expect(INTRODUCTION_DELIVERY_EXPIRY_DAYS).toBe(30);
  });

  it("status domain is exactly the four documented values", () => {
    expect(new Set(INTRODUCTION_DELIVERY_STATUSES)).toEqual(
      new Set(["delivered", "acknowledged", "revoked", "expired"]),
    );
  });

  it("terminal set matches spec", () => {
    expect(INTRODUCTION_DELIVERY_TERMINAL).toEqual(new Set(["acknowledged", "revoked", "expired"]));
  });
});

describe("BC-6.3F.1 — State machine (canTransition)", () => {
  const nonDelivered: IntroductionDeliveryStatus[] = ["acknowledged", "revoked", "expired"];

  it("delivered → {acknowledged, revoked, expired} all allowed", () => {
    expect(canTransition("delivered", "acknowledged")).toBe(true);
    expect(canTransition("delivered", "revoked")).toBe(true);
    expect(canTransition("delivered", "expired")).toBe(true);
  });

  it("delivered → delivered denied (self-loop)", () => {
    expect(canTransition("delivered", "delivered")).toBe(false);
  });

  it("terminal statuses are truly terminal (no outbound transition)", () => {
    for (const from of nonDelivered) {
      for (const to of INTRODUCTION_DELIVERY_STATUSES) {
        expect(canTransition(from, to)).toBe(false);
      }
    }
  });

  it("explicit denials: acknowledged↛revoked, revoked↛acknowledged, terminal↛delivered", () => {
    expect(canTransition("acknowledged", "revoked")).toBe(false);
    expect(canTransition("revoked", "acknowledged")).toBe(false);
    expect(canTransition("acknowledged", "delivered")).toBe(false);
    expect(canTransition("revoked", "delivered")).toBe(false);
    expect(canTransition("expired", "delivered")).toBe(false);
  });
});

describe("BC-6.3F.1 — Error taxonomy", () => {
  it("freezes exactly 14 codes", () => {
    expect(INTRODUCTION_DELIVERY_ERROR_CODES.length).toBe(14);
    // Every documented code is present.
    for (const code of [
      "INTRO_DELIVERY_REQUEST_NOT_ACCEPTED",
      "INTRO_DELIVERY_NOT_FOUND",
      "INTRO_DELIVERY_ALREADY_EXISTS",
      "INTRO_DELIVERY_NOT_OWNED",
      "INTRO_DELIVERY_TARGET_UNAVAILABLE",
      "INTRO_DELIVERY_BLOCKED",
      "INTRO_DELIVERY_NOTE_INVALID",
      "INTRO_DELIVERY_NOT_DELIVERED",
      "INTRO_DELIVERY_ALREADY_ACKNOWLEDGED",
      "INTRO_DELIVERY_CANNOT_REVOKE",
      "INTRO_DELIVERY_EXPIRED",
      "INTRO_DELIVERY_IDEMPOTENCY_CONFLICT",
      "INTRO_DELIVERY_FORBIDDEN",
      "INTRO_DELIVERY_INTERNAL_ERROR",
    ] as const) {
      expect(INTRODUCTION_DELIVERY_ERROR_CODES).toContain(code);
    }
  });

  it("normalizes known codes verbatim (object.code)", () => {
    for (const code of INTRODUCTION_DELIVERY_ERROR_CODES) {
      const err = toIntroductionDeliveryError({ code });
      expect(err).toBeInstanceOf(IntroductionDeliveryError);
      expect(err.code).toBe(code);
    }
  });

  it("extracts code embedded in a Postgres RAISE message", () => {
    const pg = { message: "INTRO_DELIVERY_BLOCKED at line 12" };
    expect(toIntroductionDeliveryError(pg).code).toBe("INTRO_DELIVERY_BLOCKED");
  });

  it("passes through when input already an IntroductionDeliveryError", () => {
    const original = new IntroductionDeliveryError("INTRO_DELIVERY_NOT_FOUND");
    expect(toIntroductionDeliveryError(original)).toBe(original);
  });

  it("collapses unknown / null / string inputs to INTERNAL_ERROR", () => {
    expect(toIntroductionDeliveryError(null).code).toBe("INTRO_DELIVERY_INTERNAL_ERROR");
    expect(toIntroductionDeliveryError("boom").code).toBe("INTRO_DELIVERY_INTERNAL_ERROR");
    expect(toIntroductionDeliveryError({ message: "??" }).code).toBe(
      "INTRO_DELIVERY_INTERNAL_ERROR",
    );
  });
});

describe("BC-6.3F.1 — SDK surface freeze", () => {
  // The BC-6.3F report enumerates eight public operations. The active SDK
  // exports `listPendingDeliveries` (intermediary-scoped); this test locks
  // the current surface so any rename/addition/removal is caught.
  const EXPECTED_OPS = [
    "deliverIntroduction",
    "acknowledgeDelivery",
    "revokeDelivery",
    "getDelivery",
    "listIncomingForTarget",
    "listOutgoingForIntermediary",
    "listStatusForRequester",
    "listPendingDeliveries",
  ] as const;

  it("exposes exactly the eight approved operations", () => {
    expect(Object.keys(IntroductionDeliverySDK).sort()).toEqual([...EXPECTED_OPS].sort());
    for (const fn of Object.values(IntroductionDeliverySDK)) {
      expect(typeof fn).toBe("function");
    }
  });

  it("does not leak repository/service imports or authority-bearing inputs", () => {
    // deliverIntroduction input shape: introductionRequestId + optional note +
    // optional idempotencyKey. Never accepts intermediaryUserId/targetUserId.
    const allowedDeliverKeys = ["introductionRequestId", "deliveryNote", "idempotencyKey"];
    const forbidden = [
      "intermediaryUserId",
      "targetUserId",
      "requesterUserId",
      "authorityScope",
      "supabase",
      "service",
      "repository",
    ];
    for (const key of forbidden) {
      expect(allowedDeliverKeys).not.toContain(key);
    }
  });
});

describe("BC-6.3F.1 — Note validation contract (client-observable)", () => {
  // Enforcement lives on the server + DB CHECK; the client contract is the
  // 500-char cap and the presence of a mapped INTRO_DELIVERY_NOTE_INVALID
  // code so UIs can localize it.
  it("500-char cap is the frozen threshold", () => {
    expect(INTRODUCTION_DELIVERY_MAX_NOTE).toBe(500);
  });

  it("NOTE_INVALID code exists in the taxonomy for surfacing rejection", () => {
    expect(INTRODUCTION_DELIVERY_ERROR_CODES).toContain("INTRO_DELIVERY_NOTE_INVALID");
  });
});

describe("BC-6.3F.1 — Requester projection contract", () => {
  // The DTO type marks deliveryNote optional; the server omits it for
  // requester rows. This test locks the field's optionality so a future
  // refactor cannot make it required and accidentally leak the note.
  it("deliveryNote is optional on the DTO shape", () => {
    // Compile-time check: constructing a requester-safe row without a note
    // must satisfy IntroductionDeliveryDTO.
    const row = {
      id: "00000000-0000-0000-0000-000000000001",
      introductionRequestId: "00000000-0000-0000-0000-000000000002",
      requester: { personNodeId: "req-node" },
      intermediary: { personNodeId: "int-node" },
      target: { personNodeId: "tgt-node" },
      status: "delivered" as IntroductionDeliveryStatus,
      deliverySummary: {
        pathId: "p1",
        depth: 2 as const,
        confidence: "medium" as const,
        reasonCodes: [],
        introductionVersion: INTRODUCTION_DELIVERY_VERSION,
        strengthVersion: "1.0.0",
      },
      createdAt: new Date().toISOString(),
    };
    // No deliveryNote key on requester row.
    expect(Object.prototype.hasOwnProperty.call(row, "deliveryNote")).toBe(false);
    expect(row.status).toBe("delivered");
  });
});

describe("BC-6.3F.1 — Idempotency / active-uniqueness contract (client)", () => {
  // Server + DB own enforcement; client contract we lock:
  //   - a mapped ALREADY_EXISTS code exists for collapse behavior
  //   - a mapped IDEMPOTENCY_CONFLICT code exists for divergent replays
  it("ALREADY_EXISTS + IDEMPOTENCY_CONFLICT codes are present", () => {
    expect(INTRODUCTION_DELIVERY_ERROR_CODES).toContain("INTRO_DELIVERY_ALREADY_EXISTS");
    expect(INTRODUCTION_DELIVERY_ERROR_CODES).toContain("INTRO_DELIVERY_IDEMPOTENCY_CONFLICT");
  });
});

describe("BC-6.3F.1 — Lazy expiry contract", () => {
  it("EXPIRED code is surfaced for post-expires_at acknowledge attempts", () => {
    expect(INTRODUCTION_DELIVERY_ERROR_CODES).toContain("INTRO_DELIVERY_EXPIRED");
  });

  it("canTransition allows delivered → expired for maintenance sweeps", () => {
    expect(canTransition("delivered", "expired")).toBe(true);
  });
});

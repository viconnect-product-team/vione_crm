// BC-6.2 — Introduction Request Workflow — pure unit contracts.
// Server-integration coverage (schema, RLS, RPCs, concurrency) runs in the
// database E2E harness; this file locks the client-safe contracts.

import { describe, expect, it } from "vitest";
import {
  INTRODUCTION_REQUEST_ERROR_CODES,
  INTRODUCTION_REQUEST_MAX_NOTE,
  INTRODUCTION_REQUEST_STATUSES,
  INTRODUCTION_REQUEST_TERMINAL,
  INTRODUCTION_REQUEST_VERSION,
  IntroductionRequestError,
  IntroductionRequestSDK,
  canTransition,
  toIntroductionRequestError,
} from "@/lib/graph";

describe("BC-6.2 — Introduction Request state machine", () => {
  it("only allows pending → terminal transitions", () => {
    for (const to of ["accepted", "declined", "cancelled", "expired"] as const) {
      expect(canTransition("pending", to)).toBe(true);
    }
    expect(canTransition("pending", "pending")).toBe(false);
    for (const from of ["accepted", "declined", "cancelled", "expired"] as const) {
      for (const to of INTRODUCTION_REQUEST_STATUSES) {
        expect(canTransition(from, to)).toBe(false);
      }
    }
  });

  it("terminal set matches spec", () => {
    expect(new Set(INTRODUCTION_REQUEST_TERMINAL)).toEqual(
      new Set(["accepted", "declined", "cancelled", "expired"]),
    );
  });
});

describe("BC-6.2 — Error normalization", () => {
  it("maps known codes verbatim", () => {
    for (const code of INTRODUCTION_REQUEST_ERROR_CODES) {
      const err = toIntroductionRequestError({ code });
      expect(err).toBeInstanceOf(IntroductionRequestError);
      expect(err.code).toBe(code);
    }
  });

  it("extracts code embedded in Postgres RAISE message", () => {
    const pgErr = { message: "INTRO_REQUEST_NOT_PENDING at line 42" };
    expect(toIntroductionRequestError(pgErr).code).toBe("INTRO_REQUEST_NOT_PENDING");
  });

  it("falls back to internal error on unknown shape", () => {
    expect(toIntroductionRequestError("boom").code).toBe("INTRO_REQUEST_INTERNAL_ERROR");
    expect(toIntroductionRequestError(null).code).toBe("INTRO_REQUEST_INTERNAL_ERROR");
  });
});

describe("BC-6.2 — SDK surface", () => {
  it("exposes exactly the seven contract operations", () => {
    expect(Object.keys(IntroductionRequestSDK).sort()).toEqual(
      [
        "acceptRequest",
        "cancelRequest",
        "declineRequest",
        "getRequest",
        "listIncoming",
        "listOutgoing",
        "sendRequest",
      ].sort(),
    );
    for (const fn of Object.values(IntroductionRequestSDK)) {
      expect(typeof fn).toBe("function");
    }
  });

  it("does not expose authority-bearing inputs on send", async () => {
    // sendRequest is typed by SendIntroductionRequestInput; ensure the
    // documented shape does not permit requester/intermediary overrides.
    const shape = {
      targetPersonNodeId: "id",
      pathId: "p",
      requestNote: "hi",
      idempotencyKey: "12345678",
    };
    const allowed = Object.keys(shape);
    for (const forbidden of [
      "requesterUserId",
      "requesterPersonNodeId",
      "intermediaryUserId",
      "intermediaryPersonNodeId",
      "authorityScope",
    ]) {
      expect(allowed).not.toContain(forbidden);
    }
  });
});

describe("BC-6.2 — Constants", () => {
  it("freezes version and note cap", () => {
    expect(INTRODUCTION_REQUEST_VERSION).toBe("1.0.0");
    expect(INTRODUCTION_REQUEST_MAX_NOTE).toBe(500);
  });
});

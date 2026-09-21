// BC-5.1 — Smoke test: canonical error → i18n mapping and query-key stability.

import { describe, expect, it } from "vitest";
import { ConnectionError } from "@/lib/connection";
import { connectionErrorTKey, connectionKeys } from "@/hooks/use-connection";

describe("BC-5.1 connection hooks — pure helpers", () => {
  it("maps every ConnectionError code to a stable i18n key (no INTERNAL_ERROR fallback for known codes)", () => {
    const codes = [
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
    for (const code of codes) {
      const key = connectionErrorTKey(new ConnectionError(code));
      expect(key.startsWith("bc.conn.err.")).toBe(true);
    }
  });

  it("unknown / non-ConnectionError values fall back to internal", () => {
    expect(connectionErrorTKey(new Error("boom"))).toBe("bc.conn.err.internal");
    expect(connectionErrorTKey(null)).toBe("bc.conn.err.internal");
  });

  it("query-key factory is stable across calls and namespaced under bc51", () => {
    expect(connectionKeys.root).toEqual(["bc51", "connection"]);
    expect(connectionKeys.state("abc")).toEqual(["bc51", "connection", "state", "abc"]);
    expect(connectionKeys.incoming()).toEqual(["bc51", "connection", "incoming", 20]);
    expect(connectionKeys.outgoing()).toEqual(["bc51", "connection", "outgoing", 20]);
    expect(connectionKeys.connected()).toEqual(["bc51", "connection", "connected", 20]);
    // Sorted → order-independent counterpart cache key.
    expect(connectionKeys.counterparts(["b", "a"])).toEqual(["bc51", "counterparts", "a,b"]);
  });
});

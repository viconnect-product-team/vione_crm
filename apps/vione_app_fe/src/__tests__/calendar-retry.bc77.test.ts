// BC-7.7 Turn B2 — Retry classifier + backoff unit tests.
import { describe, it, expect } from "vitest";
import { classifyRetry, RETRY_POLICY } from "@/lib/meeting/calendar/retry";

const NOW = new Date("2026-07-15T10:00:00Z");

describe("classifyRetry", () => {
  it("marks permanent for account-revoked", () => {
    const d = classifyRetry({
      errorCode: "CALENDAR_ACCOUNT_REVOKED",
      currentRetryCount: 0,
      now: NOW,
    });
    expect(d.kind).toBe("permanent");
  });

  it("retries transient CALENDAR_PROVIDER_UNAVAILABLE with bounded backoff", () => {
    const d = classifyRetry({
      errorCode: "CALENDAR_PROVIDER_UNAVAILABLE",
      currentRetryCount: 0,
      now: NOW,
      random: () => 0.5, // deterministic
    });
    expect(d.kind).toBe("retry");
    if (d.kind === "retry") {
      const ms = new Date(d.nextRetryAfterAt).getTime() - NOW.getTime();
      expect(ms).toBeGreaterThanOrEqual(1000);
      expect(ms).toBeLessThanOrEqual(RETRY_POLICY.MAX_DELAY_MS);
      expect(d.retryCount).toBe(1);
    }
  });

  it("gives up after MAX_ATTEMPTS", () => {
    const d = classifyRetry({
      errorCode: "CALENDAR_SYNC_FAILED",
      currentRetryCount: RETRY_POLICY.MAX_ATTEMPTS - 1,
      now: NOW,
    });
    expect(d.kind).toBe("permanent");
    if (d.kind === "permanent") expect(d.reason).toBe("max_attempts_exceeded");
  });

  it("backoff grows exponentially with retry_count", () => {
    const a = classifyRetry({
      errorCode: "CALENDAR_INTERNAL_ERROR",
      currentRetryCount: 0,
      now: NOW,
      random: () => 0.5,
    });
    const b = classifyRetry({
      errorCode: "CALENDAR_INTERNAL_ERROR",
      currentRetryCount: 3,
      now: NOW,
      random: () => 0.5,
    });
    if (a.kind === "retry" && b.kind === "retry") {
      const aMs = new Date(a.nextRetryAfterAt).getTime() - NOW.getTime();
      const bMs = new Date(b.nextRetryAfterAt).getTime() - NOW.getTime();
      expect(bMs).toBeGreaterThan(aMs);
    } else {
      throw new Error("expected retries");
    }
  });

  it("abandons when no error code is present", () => {
    const d = classifyRetry({ errorCode: null, currentRetryCount: 0, now: NOW });
    expect(d.kind).toBe("abandon");
  });
});

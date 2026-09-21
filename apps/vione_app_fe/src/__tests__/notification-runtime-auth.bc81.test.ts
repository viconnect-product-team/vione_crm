// BC-8.1 Turn C Phase 0 — Runtime endpoint authorization tests.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { authorize, ACTION_ALLOWLIST } from "@/routes/api/public/hooks/notification-runtime";
import { NOTIFICATION_SDK_METHODS } from "@/lib/business-connect/notification-orchestration/sdk";

const SECRET = "test-cron-secret-abc123-abc123-abc123";

function req(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/public/hooks/notification-runtime", { headers });
}

describe("BC-8.1 Phase 0 — runtime authorization", () => {
  const original = process.env.NOTIFICATION_RUNTIME_CRON_SECRET;

  beforeEach(() => {
    process.env.NOTIFICATION_RUNTIME_CRON_SECRET = SECRET;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.NOTIFICATION_RUNTIME_CRON_SECRET;
    else process.env.NOTIFICATION_RUNTIME_CRON_SECRET = original;
  });

  it("denies missing authorization header", () => {
    expect(authorize(req())).toBe(false);
  });

  it("denies the Supabase anon apikey alone (apikey header, no bearer)", () => {
    expect(
      authorize(
        req({
          apikey: "eyJhbGciOiJIUzI1NiJ9.public.anon.key",
        }),
      ),
    ).toBe(false);
  });

  it("denies an ordinary authenticated user JWT", () => {
    expect(authorize(req({ authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.user.jwt.token" }))).toBe(
      false,
    );
  });

  it("denies a malformed bearer token", () => {
    expect(authorize(req({ authorization: "Basic dXNlcjpwYXNz" }))).toBe(false);
    expect(authorize(req({ authorization: "Bearer" }))).toBe(false);
    expect(authorize(req({ authorization: "Bearer   " }))).toBe(false);
  });

  it("denies an incorrect secret", () => {
    expect(authorize(req({ authorization: `Bearer ${SECRET}-wrong` }))).toBe(false);
    expect(authorize(req({ authorization: "Bearer completely-different" }))).toBe(false);
  });

  it("accepts the correct secret via Bearer", () => {
    expect(authorize(req({ authorization: `Bearer ${SECRET}` }))).toBe(true);
    expect(authorize(req({ authorization: `bearer ${SECRET}` }))).toBe(true);
  });

  it("denies any request when the env secret is unset", () => {
    delete process.env.NOTIFICATION_RUNTIME_CRON_SECRET;
    expect(authorize(req({ authorization: `Bearer ${SECRET}` }))).toBe(false);
  });

  it("freezes the action allowlist and rejects unsupported actions", () => {
    expect(ACTION_ALLOWLIST).toEqual(
      expect.arrayContaining(["consume", "dispatch", "schedule", "reconcile"]),
    );
    expect(ACTION_ALLOWLIST.length).toBe(4);
    // Ensure it's frozen (mutation throws in strict mode / no-op otherwise).
    expect(Object.isFrozen(ACTION_ALLOWLIST)).toBe(true);
  });

  it("keeps runtime worker methods OUT of the public SDK surface", () => {
    for (const forbidden of [
      "consume",
      "dispatch",
      "schedule",
      "reconcile",
      "retry",
      "escalate",
      "replay",
    ]) {
      expect(NOTIFICATION_SDK_METHODS).not.toContain(forbidden);
    }
  });
});

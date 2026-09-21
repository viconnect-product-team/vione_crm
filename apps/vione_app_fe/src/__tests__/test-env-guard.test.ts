import { describe, it, expect, afterEach } from "vitest";
import { isStagingTarget, requireStagingSupabase } from "./helpers/test-env";

const KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_TEST_ENV",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

function snapshot() {
  const s: Record<string, string | undefined> = {};
  for (const k of KEYS) s[k] = process.env[k];
  return s;
}

function restore(s: Record<string, string | undefined>) {
  for (const k of KEYS) {
    if (s[k] === undefined) delete process.env[k];
    else process.env[k] = s[k];
  }
}

describe("test-env guard", () => {
  const original = snapshot();
  afterEach(() => restore(original));

  it("rejects the production host even with valid keys", () => {
    process.env.SUPABASE_URL = "https://wutbrzvqyyegkthtzgcd.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
    delete process.env.SUPABASE_TEST_ENV;
    expect(() => requireStagingSupabase()).toThrow(/production host/i);
  });

  it("rejects an unknown host without explicit opt-in", () => {
    process.env.SUPABASE_URL = "https://prod-something.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
    delete process.env.SUPABASE_TEST_ENV;
    expect(() => requireStagingSupabase()).toThrow(/does not look like a staging/i);
  });

  it("accepts hosts with staging-like tokens", () => {
    process.env.SUPABASE_URL = "https://qlhh-staging.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
    delete process.env.SUPABASE_TEST_ENV;
    const env = requireStagingSupabase();
    expect(env.url).toContain("staging");
  });

  it("honours SUPABASE_TEST_ENV=staging as explicit opt-in", () => {
    process.env.SUPABASE_URL = "https://anything.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
    process.env.SUPABASE_TEST_ENV = "staging";
    expect(() => requireStagingSupabase()).not.toThrow();
  });

  it("still refuses production host even with SUPABASE_TEST_ENV=staging", () => {
    process.env.SUPABASE_URL = "https://wutbrzvqyyegkthtzgcd.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
    process.env.SUPABASE_TEST_ENV = "staging";
    expect(() => requireStagingSupabase()).toThrow(/production host/i);
  });

  it("reports missing env vars clearly", () => {
    for (const k of KEYS) delete process.env[k];
    expect(() => requireStagingSupabase()).toThrow(/Missing Supabase env vars/);
  });

  it("isStagingTarget detects local dev URLs", () => {
    expect(isStagingTarget("http://127.0.0.1:54321")).toBe(true);
    expect(isStagingTarget("http://localhost:54321")).toBe(true);
  });
});

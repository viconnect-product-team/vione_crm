import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// BC-1.0 — Platform Identity contract tests (deterministic, no DB/network).
// Locks in the frozen non-negotiable rules of the identity foundation.
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const IDENTITY = join(ROOT, "src", "lib", "identity");
const read = (f: string) => readFileSync(join(IDENTITY, f), "utf8");

const migrations = (() => {
  const dir = join(ROOT, "supabase", "migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");
})();

describe("identity foundation files", () => {
  it("ships SDK, resolver, functions, server helpers and types", () => {
    for (const f of [
      "identity.types.ts",
      "platform-identity.server.ts",
      "platform-identity.functions.ts",
      "platform-identity-sdk.ts",
    ]) {
      expect(read(f).length).toBeGreaterThan(0);
    }
  });

  it("SDK exposes the frozen surface", () => {
    const sdk = read("platform-identity-sdk.ts");
    for (const m of [
      "getCurrentUser",
      "getProfile",
      "getContexts",
      "hasAssociation",
      "getAssociations",
      "hasCommunity",
      "resolvePlatformIdentity",
    ]) {
      expect(sdk).toContain(m);
    }
  });

  it("server helpers exist and do NOT redefine the member/association path", () => {
    const srv = read("platform-identity.server.ts");
    for (const h of [
      "requirePlatformUser",
      "resolveUserProfile",
      "buildGlobalIdentityContext",
      "getAssociationContexts",
    ]) {
      expect(srv).toContain(h);
    }
    // Must not re-implement the frozen RPC helpers.
    expect(srv).not.toMatch(/function\s+current_member_id/);
    expect(srv).not.toMatch(/function\s+current_association_id/);
  });

  it("resolver never throws for a missing member (documented + empty communities)", () => {
    const fns = read("platform-identity.functions.ts");
    expect(fns).toContain("communities: []");
  });
});

describe("user_profiles migration contract", () => {
  it("creates user_profiles with GRANT, RLS, policies, index, trigger", () => {
    expect(migrations).toMatch(/CREATE TABLE IF NOT EXISTS public\.user_profiles/);
    expect(migrations).toMatch(/GRANT[^;]*ON public\.user_profiles TO authenticated/);
    expect(migrations).toMatch(/ALTER TABLE public\.user_profiles ENABLE ROW LEVEL SECURITY/);
    expect(migrations).toMatch(/CREATE POLICY[^;]*ON public\.user_profiles/);
    expect(migrations).toMatch(/CREATE INDEX[^;]*ON public\.user_profiles/);
    expect(migrations).toMatch(/CREATE TRIGGER trg_user_profiles_updated_at/);
  });

  it("has NO anon grant on user_profiles", () => {
    expect(migrations).not.toMatch(/GRANT[^;]*ON public\.user_profiles TO anon/);
  });

  it("user_profiles carries NO association/member/fee columns", () => {
    const block = migrations.slice(
      migrations.indexOf("CREATE TABLE IF NOT EXISTS public.user_profiles"),
    );
    const table = block.slice(0, block.indexOf(");"));
    expect(table).not.toMatch(/association_id/);
    expect(table).not.toMatch(/member_id/);
    expect(table).not.toMatch(/tax_code/);
    expect(table).not.toMatch(/fee|renewal|invoice/i);
  });

  it("backfill is guarded: unique member mapping, no overwrite", () => {
    expect(migrations).toMatch(/HAVING count\(\*\) = 1/);
    expect(migrations).toMatch(/ON CONFLICT \(user_id\) DO NOTHING/);
    expect(migrations).toMatch(/identity_backfill_reports/);
  });
});

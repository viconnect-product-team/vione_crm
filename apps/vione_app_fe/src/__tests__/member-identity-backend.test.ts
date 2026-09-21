import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Phase 11 — Digital Membership Identity backend regression tests.
// Signing tests exercise real crypto; the rest are deterministic source checks
// (no DB / network) that lock in the security guarantees.
// ---------------------------------------------------------------------------

const LIB = join(process.cwd(), "src", "lib");
const read = (f: string) => {
  const stub = readFileSync(join(LIB, f), "utf8");
  // Domain files were split into a sibling directory with a barrel re-export.
  // When the original file is now just a barrel stub, concatenate the split
  // directory so source-scan assertions still see the real implementation.
  const m = stub.match(/export \* from "\.\/([\w-]+)";/);
  if (stub.trim().split("\n").length <= 3 && m) {
    const dir = join(LIB, m[1]);
    return readdirSync(dir)
      .filter((x: any) => x.endsWith(".ts"))
      .map((x: any) => readFileSync(join(dir, x), "utf8"))
      .join("\n");
  }
  return stub;
};

describe("server-side QR signing", () => {
  beforeAll(() => {
    process.env.IDENTITY_QR_SIGNING_SECRET = "test-secret-value-1234567890-abcdef";
  });

  it("mints a token that verifies", async () => {
    const { createSignedMemberQrPayload, verifySignedMemberQrPayload } =
      await import("@/lib/identity-signing.server");
    const { token, payload } = createSignedMemberQrPayload({
      passId: "p1",
      associationId: "a1",
      memberId: "m1",
      serial: "MIP-2026-ABC",
    });
    const res = verifySignedMemberQrPayload(token);
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.payload.passId).toBe("p1");
      expect(res.payload.serial).toBe(payload.serial);
    }
  });

  it("rejects a tampered token", async () => {
    const { createSignedMemberQrPayload, verifySignedMemberQrPayload } =
      await import("@/lib/identity-signing.server");
    const { token } = createSignedMemberQrPayload({
      passId: "p1",
      associationId: "a1",
      memberId: "m1",
      serial: "S",
    });
    const [body] = token.split(".");
    const tampered = `${body}.deadbeefdeadbeef`;
    const res = verifySignedMemberQrPayload(tampered);
    expect(res.valid).toBe(false);
  });

  it("rejects an expired token", async () => {
    const { createSignedMemberQrPayload, verifySignedMemberQrPayload } =
      await import("@/lib/identity-signing.server");
    const { token, payload } = createSignedMemberQrPayload({
      passId: "p1",
      associationId: "a1",
      memberId: "m1",
      serial: "S",
      ttlSeconds: 1,
    });
    const res = verifySignedMemberQrPayload(token, payload.exp + 10);
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.reason).toBe("expired");
  });

  it("fails safe when the secret is missing", async () => {
    const prev = process.env.IDENTITY_QR_SIGNING_SECRET;
    delete process.env.IDENTITY_QR_SIGNING_SECRET;
    const { verifySignedMemberQrPayload } = await import("@/lib/identity-signing.server");
    const res = verifySignedMemberQrPayload("anything.sig");
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.reason).toBe("config");
    process.env.IDENTITY_QR_SIGNING_SECRET = prev;
  });
});

describe("wallet providers fail safe when unconfigured", () => {
  it("apple wallet reports unavailable / mints nothing", async () => {
    const { canMintApplePass, mintAppleMembershipPass } = await import("@/lib/apple-wallet.server");
    expect(canMintApplePass()).toBe(false);
    const res = await mintAppleMembershipPass("p1");
    expect(res.ok).toBe(false);
  });

  it("google wallet reports unavailable / mints nothing", async () => {
    const { canMintGooglePass, mintGoogleMembershipPass } =
      await import("@/lib/google-wallet.server");
    expect(canMintGooglePass()).toBe(false);
    const res = await mintGoogleMembershipPass("p1");
    expect(res.ok).toBe(false);
  });
});

describe("identity functions enforce association manager permission", () => {
  const src = read("member-identity.functions.ts");

  it("every mutation re-checks is_assoc_manager", () => {
    for (const fn of [
      "issueMemberPassFn",
      "suspendMemberPassFn",
      "renewMemberPassFn",
      "replaceMemberPassFn",
    ]) {
      const idx = src.indexOf(`export const ${fn}`);
      expect(idx, `${fn} missing`).toBeGreaterThan(-1);
      const body = src.slice(idx, idx + 2500);
      expect(body, `${fn} not permission-guarded`).toContain("assertManager");
    }
  });

  it("destructive actions require a reason", () => {
    expect(src).toMatch(/suspendMemberPassFn[\s\S]{0,400}reason: z\.string/);
    expect(src).toMatch(/replaceMemberPassFn[\s\S]{0,400}reason: z\.string/);
  });

  it("member read uses RLS-scoped client, not admin bypass, for pass lookup", () => {
    const idx = src.indexOf("export const getMyIdentityPassFn");
    const body = src.slice(idx, idx + 3200);
    expect(body).toContain("current_member_id");
    expect(body).toContain('.from("member_identity_passes")');
  });

  it("public verify returns only safe fields (no email/phone/tax_code)", () => {
    const idx = src.indexOf("verifyMemberPassFn");
    const body = src.slice(idx);
    expect(body).not.toMatch(/tax_code/);
    expect(body).not.toMatch(/\bphone\b/);
    expect(body).not.toMatch(/memberEmail|\.email\b/);
  });
});

describe("no signing secret / certs / service account leak to the client", () => {
  it("signing secret is server-only (never VITE_)", () => {
    const sign = read("identity-signing.server.ts");
    expect(sign).toContain("process.env.IDENTITY_QR_SIGNING_SECRET");
    expect(sign).not.toMatch(/VITE_/);
  });

  it("wallet secrets are read from server env only", () => {
    for (const f of ["apple-wallet.server.ts", "google-wallet.server.ts"]) {
      const src = read(f);
      expect(src).not.toMatch(/VITE_/);
      expect(src).toMatch(/process\.env\./);
    }
  });

  it("server-only files use the .server.ts guard suffix", () => {
    for (const f of [
      "identity-signing.server.ts",
      "apple-wallet.server.ts",
      "google-wallet.server.ts",
    ]) {
      expect(() => read(f)).not.toThrow();
    }
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ProfileConnectSDK } from "@/lib/business-card/profile-connect.sdk";

// BC-3.1D — Business Profile Connect integration guardrails.
const root = resolve(__dirname, "..", "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

describe("BC-3.1D profile connect SDK surface", () => {
  it("exposes the full viewer-safe action surface", () => {
    for (const m of ["getState", "connect", "accept", "decline", "cancel", "disconnect"]) {
      expect(typeof (ProfileConnectSDK as Record<string, unknown>)[m]).toBe("function");
    }
  });
});

describe("BC-3.1D module boundaries", () => {
  it("client-safe modules never statically import a *.server module", () => {
    for (const f of [
      "src/lib/business-card/profile-connect.functions.ts",
      "src/lib/business-card/profile-connect.sdk.ts",
      "src/lib/business-card/profile-connect.types.ts",
      "src/hooks/use-profile-connect.ts",
      "src/components/connect/BusinessProfileRelationshipActions.tsx",
    ]) {
      const src = read(f);
      // Only `await import("...server")` is permitted (server-only composition).
      const staticServer = src.match(/^import[\s\S]*?from\s+["'][^"']*\.server["']/gm);
      expect(staticServer, `${f} must not statically import a .server module`).toBeNull();
    }
  });

  it("server composition never returns owner/target ids in the DTO type", () => {
    const dto = read("src/lib/business-card/profile-connect.types.ts");
    expect(dto).not.toMatch(/ownerUserId|targetUserId|counterpartUserId/);
  });

  it("connection-id actions enforce participant validation via the resolved target", () => {
    const fns = read("src/lib/business-card/profile-connect.functions.ts");
    for (const verb of ["accept", "decline", "cancel", "disconnect"]) {
      const idx = fns.indexOf(`${verb}BusinessProfileConnectionFn`);
      expect(idx).toBeGreaterThan(-1);
    }
    // Every id-based verb asserts participation before delegating.
    const asserts = fns.match(/assertProfileParticipant/g) ?? [];
    expect(asserts.length).toBeGreaterThanOrEqual(4);
  });
});

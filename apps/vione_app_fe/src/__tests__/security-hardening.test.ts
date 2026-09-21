import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Deterministic security-hardening regression checks (no DB / network).
// These lock in the guarantees added by the SECURITY DEFINER + server-function
// audit so a future refactor can't silently regress them.
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

describe("member account functions are association-scoped", () => {
  const src = read("member-account.functions.ts");

  it("defines an association-scoped authorization guard", () => {
    expect(src).toMatch(/async function assertAssocAdmin\(/);
    expect(src).toMatch(/has_role/); // authentication gate still present
  });

  it("guards every member-targeting mutation with assertAssocAdmin", () => {
    for (const fn of [
      "assignMemberUserFn",
      "createMemberUserFn",
      "sendMemberInviteFn",
      "unassignMemberUserFn",
    ]) {
      const idx = src.indexOf(`export const ${fn}`);
      expect(idx, `${fn} missing`).toBeGreaterThan(-1);
      const body = src.slice(idx, idx + 1600);
      expect(body, `${fn} not association-scoped`).toContain("assertAssocAdmin");
    }
  });

  it("scopes bulk list endpoints to the caller's associations", () => {
    expect(src).toMatch(/callerScope/);
    const listIdx = src.indexOf("listMemberAccountStatusesFn");
    const body = src.slice(listIdx, listIdx + 900);
    expect(body).toContain("association_id");
  });
});

describe("public card never leaks sensitive fields", () => {
  const src = read("card.functions.ts");

  it("never returns a raw tax_code on the public endpoint", () => {
    expect(src).toContain("taxCode: null");
    // No code path assigns m.tax_code into the public payload.
    expect(src).not.toMatch(/taxCode:\s*\(?m\.tax_code/);
  });

  it("gates contact/title behind the name display setting", () => {
    expect(src).toMatch(/title: showName \?/);
  });

  it("respects association-level public card settings", () => {
    expect(src).toContain("public_card_enabled");
    expect(src).toContain("public_card_requires_active_member");
  });
});

describe("syncMemberCheckins is authenticated and server-authoritative", () => {
  const src = read("member-checkin.functions.ts");

  it("requires auth (no longer a public service-role write)", () => {
    expect(src).toContain("requireSupabaseAuth");
    expect(src).toMatch(/\.middleware\(\[requireSupabaseAuth\]\)/);
  });

  it("derives member/association/status server-side", () => {
    expect(src).toMatch(/\.eq\("user_id", userId\)/); // member from session
    expect(src).toMatch(/status = doneEventIds\.has/); // status derived, not trusted
    expect(src).toMatch(/eventById\.has\(r\.eventId\)/); // event validated
  });
});

describe("view-increment writes are tenant-scoped", () => {
  it("scopes product/opportunity view bumps by association_id", () => {
    for (const f of ["marketplace.functions.ts", "opportunities.functions.ts"]) {
      const src = read(f);
      expect(src, `${f} view increment not tenant-scoped`).toMatch(
        /\.update\(\{ views:[\s\S]{0,120}\.eq\("association_id"/,
      );
    }
  });
});

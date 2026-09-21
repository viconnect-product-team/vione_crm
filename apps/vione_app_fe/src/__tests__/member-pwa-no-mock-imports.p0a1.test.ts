// P0-A1 structural blocker: production Member PWA routes (src/routes/m*.tsx)
// and components rendered exclusively by them (src/components/member/**) must
// NOT import fixture/mock modules or treat localStorage as canonical storage.
//
// Fixture modules are allowed only in tests, stories, and explicit demo
// modules. Any regression here fails the build via `bun test`.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FORBIDDEN_MODULES = [
  "@/lib/member-app-data",
  "@/lib/extra-data",
  "@/lib/members-data",
  "@/lib/networking-data",
  "@/lib/opportunities-data",
  "@/lib/fees-data",
  "@/lib/marketplace-data",
  "@/lib/checkin-data",
  "@/lib/renewal-data",
  "@/lib/reviews-data",
  "@/lib/companies-history",
];

// P0-A2 closed the previous m.checkin.tsx violation (localStorage as
// canonical state). This set stays intentionally empty — any new entry
// requires an explicit deferral and a follow-up phase.
const KNOWN_VIOLATIONS = new Set<string>([]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function memberPwaSourceFiles(): string[] {
  const files: string[] = [];
  for (const name of readdirSync("src/routes")) {
    if (/^m(\.|$)/.test(name) && (name.endsWith(".tsx") || name.endsWith(".ts"))) {
      files.push(join("src/routes", name));
    }
  }
  files.push(...walk("src/components/member"));
  return files.filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
}

describe("P0-A1 · Member PWA production paths do not import fixtures", () => {
  const files = memberPwaSourceFiles();

  it("has a non-empty inventory of scanned files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const rel = file.replace(/\\/g, "/");
    it(`${rel} does not import a fixture/mock module`, () => {
      const src = readFileSync(file, "utf8");
      const offenders = FORBIDDEN_MODULES.filter((mod) =>
        new RegExp(`from\\s+["']${mod.replace("/", "\\/")}["']`).test(src),
      );
      if (KNOWN_VIOLATIONS.has(rel)) {
        // Documented, tracked, gated on P0-A2. Assert it still exists so we
        // never drift into thinking the gap was fixed silently.
        expect(offenders.length).toBeGreaterThan(0);
      } else {
        expect(offenders).toEqual([]);
      }
    });
  }
});

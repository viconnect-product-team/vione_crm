// Integration guardrail: routes must talk to real Supabase, not *-data.ts
// fixtures. Runs as part of the standard `bun test` suite and fails the
// build if:
//
//   1) A route imports a mock data module we've flagged as forbidden and
//      the route is NOT on the documented KNOWN_VIOLATIONS ratchet
//      (P0-A cleanup backlog).
//   2) A route that clearly does data loading (loader / useQuery /
//      useMutation / useServerFn) does not touch a real Supabase surface
//      (@/integrations/supabase/* or any *.functions module).
//
// This is a static import-graph gate — cheap, deterministic, and CI-safe.
// It complements the runtime MockModeBanner + [MOCK-MODE] server logs.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Modules that ship RUNTIME mock rows (arrays, seeded generators, ephemeral
// in-memory state). Importing any of them from a route is a mock leak.
const FORBIDDEN_MOCK_MODULES = [
  "@/lib/member-app-data",
  "@/lib/extra-data",
  "@/lib/members-data",
  "@/lib/networking-data",
  "@/lib/opportunities-data",
  "@/lib/marketplace-data",
  "@/lib/renewal-data",
  "@/lib/reviews-data",
  // Pure-utility/type modules `@/lib/fees-data` and `@/lib/checkin-data`
  // are intentionally NOT in this list — they expose formatting helpers
  // and shared types, not fixture rows. Add them here the moment they
  // gain a mock export.
];

// Ratchet: current routes still on legacy mock modules. Do NOT add new
// entries here without an explicit migration ticket. Removing entries is
// how we prove progress on the backend-reality cutover.
const KNOWN_VIOLATIONS = new Set<string>([
  "src/routes/activity.tsx",
  "src/routes/companies.$companyId.tsx",
  "src/routes/companies.tsx",
  "src/routes/fees.tsx",
  "src/routes/marketplace.$productId.tsx",
  "src/routes/marketplace.my-quotes.tsx",
  "src/routes/marketplace.tsx",
  "src/routes/marketplace.workspace.tsx",
  "src/routes/members.$memberId.tsx",
  "src/routes/members.index.tsx",
  "src/routes/network.tsx",
  "src/routes/news.tsx",
  "src/routes/notifications.tsx",
  "src/routes/opportunities.$id.edit.tsx",
  "src/routes/opportunities.$id.tsx",
  "src/routes/opportunities.tsx",
  "src/routes/renewal.tsx",
  "src/routes/segments.tsx",
]);

const IMPORT_RE = (mod: string) => new RegExp(`from\\s+["']${mod.replace(/\//g, "\\/")}["']`);

// Capture the full import statement (single or multi-line) so we can point
// the developer at exact symbols + line numbers when a mock module leaks.
const IMPORT_STATEMENT_RE = (mod: string) =>
  new RegExp(`import[\\s\\S]*?from\\s+["']${mod.replace(/\//g, "\\/")}["'];?`, "g");

type MockOffender = {
  module: string;
  line: number;
  statement: string;
};

function findMockOffenders(src: string): MockOffender[] {
  const offenders: MockOffender[] = [];
  for (const mod of FORBIDDEN_MOCK_MODULES) {
    if (!IMPORT_RE(mod).test(src)) continue;
    const re = IMPORT_STATEMENT_RE(mod);
    let match: RegExpExecArray | null;
    while ((match = re.exec(src)) !== null) {
      const line = src.slice(0, match.index).split("\n").length;
      offenders.push({
        module: mod,
        line,
        statement: match[0].replace(/\s+/g, " ").trim(),
      });
    }
  }
  return offenders;
}

function formatOffenders(rel: string, offenders: MockOffender[]): string {
  const lines = offenders.map(
    (o) => `    - ${rel}:${o.line}  →  ${o.module}\n      ${o.statement}`,
  );
  return `\n${lines.join("\n")}\n`;
}

const REAL_SUPABASE_HINTS = [
  /from\s+["']@\/integrations\/supabase\//,
  /from\s+["']@[^"']*\.functions["']/,
  /from\s+["']@[^"']*\.functions\.[^"']+["']/,
];

const DATA_USAGE_HINTS = [
  /\bloader\s*:/,
  /\buseQuery\s*\(/,
  /\buseSuspenseQuery\s*\(/,
  /\buseMutation\s*\(/,
  /\buseServerFn\s*\(/,
  /\bensureQueryData\s*\(/,
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) out.push(full);
  }
  return out;
}

const ROUTE_FILES = walk("src/routes").filter(
  (f) => !f.endsWith(".d.ts") && !f.includes("routeTree.gen"),
);

describe("Integration · routes read/write against real Supabase", () => {
  it("has a non-empty route inventory", () => {
    expect(ROUTE_FILES.length).toBeGreaterThan(20);
  });

  describe("no NEW imports of *-data.ts mock modules", () => {
    for (const file of ROUTE_FILES) {
      const rel = file.replace(/\\/g, "/");
      it(`${rel}`, () => {
        const src = readFileSync(file, "utf8");
        const offenders = findMockOffenders(src);
        if (KNOWN_VIOLATIONS.has(rel)) {
          expect(
            offenders.length,
            `${rel} is on the KNOWN_VIOLATIONS ratchet but no longer imports mock modules — remove it from the list.`,
          ).toBeGreaterThan(0);
        } else {
          expect(
            offenders,
            `\n${rel} imports forbidden mock module(s). Migrate to a real Supabase query (server fn or @/integrations/supabase/client).\n\n  Offending imports:${formatOffenders(rel, offenders)}`,
          ).toEqual([]);
        }
      });
    }
  });

  describe("data-loading routes reach a real Supabase surface", () => {
    for (const file of ROUTE_FILES) {
      const rel = file.replace(/\\/g, "/");
      // Routes still on the mock ratchet are exempt until they migrate.
      if (KNOWN_VIOLATIONS.has(rel)) continue;
      it(`${rel}`, () => {
        const src = readFileSync(file, "utf8");
        const doesDataWork = DATA_USAGE_HINTS.some((re) => re.test(src));
        if (!doesDataWork) return; // static/marketing route — nothing to prove.
        const touchesReal = REAL_SUPABASE_HINTS.some((re) => re.test(src));
        expect(
          touchesReal,
          `${rel} performs data loading but does not import from @/integrations/supabase/* or any *.functions module. Wire it to a real Supabase query.`,
        ).toBe(true);
      });
    }
  });
});

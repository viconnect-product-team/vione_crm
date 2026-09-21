// BC-RC1 S0-01 — Static contract proof for the two card-AI server functions:
// authenticated, identity from verified context, rate-limited, fail-closed,
// and no provider-secret exposure to the client.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = readFileSync("src/lib/card-ai.functions.ts", "utf8");

function fnBlock(exportedName: string, nextExportedName?: string): string {
  const start = SRC.indexOf(`export const ${exportedName}`);
  expect(start).toBeGreaterThan(-1);
  const end = nextExportedName ? SRC.indexOf(`export const ${nextExportedName}`) : SRC.length;
  return SRC.slice(start, end === -1 ? SRC.length : end);
}

describe("BC-RC1 S0-01 — card AI endpoints require verified auth", () => {
  it("both AI functions use requireSupabaseAuth middleware", () => {
    for (const block of [
      fnBlock("analyzeCardImage", "recommendOptimalTemplate"),
      fnBlock("recommendOptimalTemplate"),
    ]) {
      expect(block).toContain(".middleware([requireSupabaseAuth])");
    }
  });

  it("identity and rate limit come from the verified auth context, never client input", () => {
    for (const block of [
      fnBlock("analyzeCardImage", "recommendOptimalTemplate"),
      fnBlock("recommendOptimalTemplate"),
    ]) {
      expect(block).toContain("checkAiRateLimit({");
      expect(block).toContain("userId: context.userId");
      expect(block).toContain("if (!rl.allowed) throw new Error(rl.message);");
    }
    // Input schemas must not accept a caller-supplied userId.
    expect(SRC).not.toMatch(/InputSchema\s*=\s*z\.object\(\{[^}]*userId/s);
    expect(SRC).not.toMatch(/OptimalInput\s*=\s*z\.object\(\{[^}]*userId/s);
  });

  it("fails closed when the provider key is missing", () => {
    expect(SRC).toContain('if (!apiKey) throw new Error("LOVABLE_API_KEY missing on server")');
  });

  it("provider key is only read inside handlers, never at module scope", () => {
    const moduleScope = SRC.slice(0, SRC.indexOf("export const analyzeCardImage"));
    expect(moduleScope).not.toContain("process.env.LOVABLE_API_KEY");
    expect(moduleScope).not.toContain('process.env["LOVABLE_API_KEY"]');
  });

  it("no client-reachable source exposes the provider secret env name", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry.startsWith(".")) continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry) || entry.includes(".test.")) continue;
        const code = readFileSync(full, "utf8");
        if (/VITE_LOVABLE_API_KEY|import\.meta\.env\.[A-Z_]*LOVABLE_API_KEY/.test(code)) {
          offenders.push(full);
        }
      }
    };
    walk("src");
    expect(offenders).toEqual([]);
  });
});

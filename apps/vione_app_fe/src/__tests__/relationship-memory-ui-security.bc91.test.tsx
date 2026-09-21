// BC-9.1 Turn C1 — Structural / security guardrails for the read UI.
//
// These are pure source-scan tests: they enforce architectural invariants
// so future edits cannot regress the frozen memory boundary.
//   1. UI files never import server-only modules.
//   2. UI files never import excluded source domains (private notes etc.).
//   3. UI files consume the frozen SDK only through the client-safe barrel.
//   4. UI files never spread `canonicalValue` directly into the DOM (which
//      could leak arbitrary structured payloads).

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const UI_DIR = "src/components/business-connect/relationship-memory";
const UI_ROUTE = "src/routes/business-connect.memory.tsx";
const UI_HOOK = "src/hooks/use-relationship-memory.ts";

const FORBIDDEN_SUBSTRINGS = [
  "repository.server",
  "service.server",
  "extraction-worker",
  "embedding-provider.server",
  "embedding-lifecycle.server",
  "retrieval.server",
  "graph-context.server",
  "supabaseAdmin",
  "client.server",
  "auth-middleware",
  "business_meeting_private_notes",
  "private_meeting_notes",
  "private-notes",
  "raw_email_inbox",
  "provider_secrets",
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(p);
  }
  return out;
}

const uiFiles = [...walk(UI_DIR), UI_ROUTE, UI_HOOK];

describe("BC-9.1 C1 — structural guardrails", () => {
  it("scans at least the expected number of UI files", () => {
    expect(uiFiles.length).toBeGreaterThanOrEqual(8);
  });

  it("never imports server-only or forbidden modules", () => {
    for (const f of uiFiles) {
      const src = readFileSync(f, "utf8");
      for (const bad of FORBIDDEN_SUBSTRINGS) {
        expect(src.includes(bad), `UI file ${f} must not reference "${bad}"`).toBe(false);
      }
    }
  });

  it("only imports memory types/SDK via the client-safe barrel", () => {
    // Any RM import must resolve to the barrel path exactly, not to a
    // deep internal module like `.../repository.server` or `.../functions`.
    const importRe = /from\s+["']@\/lib\/business-connect\/relationship-memory(?:\/([^"']+))?["']/g;
    for (const f of uiFiles) {
      const src = readFileSync(f, "utf8");
      let m: RegExpExecArray | null;
      while ((m = importRe.exec(src))) {
        const sub = m[1];
        expect(
          sub,
          `UI file ${f} must import from the barrel, got sub-path "${sub}"`,
        ).toBeUndefined();
      }
    }
  });

  it("never dumps canonicalValue as JSON into the DOM", () => {
    for (const f of uiFiles) {
      const src = readFileSync(f, "utf8");
      expect(
        /JSON\.stringify\s*\(\s*[a-zA-Z_$][\w$]*\.canonicalValue/.test(src),
        `UI file ${f} must not JSON.stringify canonicalValue`,
      ).toBe(false);
      expect(
        /\{\s*\.\.\.[a-zA-Z_$][\w$]*\.canonicalValue\s*\}/.test(src),
        `UI file ${f} must not spread canonicalValue into JSX`,
      ).toBe(false);
    }
  });

  it("route has ssr: false and noindex meta (viewer-private surface)", () => {
    const src = readFileSync(UI_ROUTE, "utf8");
    expect(src.includes("ssr: false")).toBe(true);
    expect(src.includes("noindex")).toBe(true);
  });
});

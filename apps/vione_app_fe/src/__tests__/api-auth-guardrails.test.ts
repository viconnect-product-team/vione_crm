import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Deterministic guardrail (no DB / network).
//
// Multi-tenant isolation in this app relies on every server function running
// through `requireSupabaseAuth`, which gives the handler a `(null as any)`
// client scoped to the signed-in user. Row Level Security then enforces both
// "must be authenticated" and "cannot read/write another association's data".
//
// If a new server function ships WITHOUT `requireSupabaseAuth` (or reaches for
// `supabaseAdmin`, which BYPASSES RLS), cross-association isolation silently
// breaks. This test scans every `*.functions.ts` file and fails the build when
// that happens, unless the endpoint is explicitly listed as an audited public
// endpoint below.
// ---------------------------------------------------------------------------

const LIB_DIR = join(process.cwd(), "src", "lib");

// Server functions that are intentionally public (no auth middleware). Each one
// is audited to NOT leak cross-association data:
//  - getPublicCard: public QR card lookup by code; returns only fields the
//    member opted to expose via card_settings, gated by association-level
//    public_card_enabled / public_card_requires_active_member settings.
//  - getPublicAssociationFn / resolveAssociationByHostFn: public landing-page
//    reads via the publishable (anon) client; RLS applies and only safe
//    landing fields are projected.
//  - getPublicBusinessCardFn: public digital business card by slug (BC-Mobile-5D);
//    projects only published, opted-in public fields; neutral failure.
//  - listPublicProfileSlugsFn: sitemap feed (BC-2.3 SEO); returns only
//    published + fully-public profile slugs — already public by definition.
//  - getDemoAvailability / bookDemoSlot: marketing-site demo booking (pre-auth
//    by design); availability exposes only taken slot keys, no PII; booking
//    writes only the submitter's own request row.
//  - getMockModeStatusFn: MockModeBanner status; reveals only mock/real
//    provider mode — no data, no secrets.
const PUBLIC_ALLOWLIST = new Set<string>([
  "getPublicCard",
  "getPublicAssociationFn",
  "resolveAssociationByHostFn",
  "getPublicBusinessCardFn",
  "listPublicProfileSlugsFn",
  "getDemoAvailability",
  "bookDemoSlot",
  "getMockModeStatusFn",
]);

function listFunctionFiles(): string[] {
  return readdirSync(LIB_DIR)
    .filter((f) => f.endsWith(".functions.ts"))
    .map((f) => join(LIB_DIR, f));
}

/** Crudely split a file into per-export `createServerFn` blocks. */
function extractServerFns(src: string): { name: string; body: string }[] {
  const out: { name: string; body: string }[] = [];
  // Match: export const NAME = createServerFn( ... up to the next top-level
  // `export const` or end of file.
  const re = /export const (\w+)\s*=\s*createServerFn\b/g;
  const marks: { name: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) marks.push({ name: m[1], index: m.index });
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : src.length;
    out.push({ name: marks[i].name, body: src.slice(start, end) });
  }
  return out;
}

describe("API guardrails — every server function authenticates the user", () => {
  const files = listFunctionFiles();

  it("discovers server function files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const fns = extractServerFns(src);
    const short = file.split("/").slice(-1)[0];

    for (const fn of fns) {
      const isPublic = PUBLIC_ALLOWLIST.has(fn.name);

      it(`${short} › ${fn.name} ${isPublic ? "is an audited public endpoint" : "uses requireSupabaseAuth"}`, () => {
        const hasAuth = fn.body.includes(".middleware([requireSupabaseAuth])");
        if (isPublic) {
          // Audited public endpoints must NOT silently gain auth expectations
          // here; we only assert they remain in the allowlist intentionally.
          expect(hasAuth).toBe(false);
        } else {
          expect(hasAuth).toBe(true);
        }
      });
    }
  }

  it("auth-protected functions do not use supabaseAdmin at module scope (RLS bypass)", () => {
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      // supabaseAdmin must only be loaded lazily inside a handler via dynamic
      // import — never a top-level static import that ships to the client and
      // bypasses RLS by default.
      const hasStaticAdminImport = /^\s*import\s+.*client\.server.*$/m.test(src);
      expect(hasStaticAdminImport, `${file} statically imports client.server`).toBe(false);
    }
  });
});

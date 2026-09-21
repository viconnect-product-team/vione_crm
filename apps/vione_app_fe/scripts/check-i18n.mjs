// Build-time guard: fail the build when a literal i18n key used anywhere in
// the app (t("...")) is missing from locales JSON, or is defined but empty.
//
// Runs in prebuild (see package.json). Exits non-zero so broken/half-translated
// labels are caught before shipping instead of rendering raw keys.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const repoRoot = resolve(root, "../..");

const localesDir = resolve(repoRoot, "packages/shared/locales");
const SCAN_DIRS = ["src/routes", "src/components"].map((d) => resolve(root, d));
const EXTS = new Set([".ts", ".tsx"]);

// ---- 1. Load JSON translation dictionaries --------------------
const vi = JSON.parse(readFileSync(join(localesDir, "vi.json"), "utf8"));
const en = JSON.parse(readFileSync(join(localesDir, "en.json"), "utf8"));
const lo = JSON.parse(readFileSync(join(localesDir, "lo.json"), "utf8"));
const km = JSON.parse(readFileSync(join(localesDir, "km.json"), "utf8"));
const my = JSON.parse(readFileSync(join(localesDir, "my.json"), "utf8"));

const defined = new Map();
for (const key of Object.keys(vi)) {
  defined.set(key, {
    vi: !!vi[key] && vi[key].trim().length > 0,
    en: !!en[key] && en[key].trim().length > 0,
    lo: !!lo[key] && lo[key].trim().length > 0,
    km: !!km[key] && km[key].trim().length > 0,
    my: !!my[key] && my[key].trim().length > 0,
  });
}

// ---- 2. Collect literal keys used across the app -------------------------
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (EXTS.has(extname(p))) out.push(p);
  }
  return out;
}

const used = new Map(); // key -> Set(relative file paths)
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const src = readFileSync(file, "utf8");
    if (!/\buseT\s*\(/.test(src)) continue;
    for (const m of src.matchAll(/\bt\(\s*"([^"]+)"/g)) {
      const key = m[1];
      if (!used.has(key)) used.set(key, new Set());
      used.get(key).add(file.replace(root + "/", ""));
    }
  }
}

// ---- 3. Report ------------------------------------------------------------
const missing = [];
const emptyLang = [];
for (const [key, files] of used) {
  const def = defined.get(key);
  const where = ` (${[...files].join(", ")})`;
  if (!def) {
    missing.push(`${key}${where}`);
  } else if (!def.vi || !def.en || !def.lo || !def.km || !def.my) {
    const langs = [!def.vi && "vi", !def.en && "en", !def.lo && "lo", !def.km && "km", !def.my && "my"].filter(Boolean).join(", ");
    emptyLang.push(`${key} — thiếu/để trống: ${langs}${where}`);
  }
}

if (missing.length || emptyLang.length) {
  console.error("\n[i18n-check] Phát hiện key i18n không hợp lệ:\n");
  if (missing.length) {
    console.error(`Thiếu định nghĩa (${missing.length}):`);
    for (const k of missing.sort()) console.error(`  - ${k}`);
  }
  if (emptyLang.length) {
    console.error(`\nThiếu bản dịch (${emptyLang.length}):`);
    for (const k of emptyLang.sort()) console.error(`  - ${k}`);
  }
  console.error(`\nCập nhật file JSON tương ứng trong packages/shared/locales/ rồi build lại.\n`);
  process.exit(1);
}

console.log(`[i18n-check] OK — ${used.size} key i18n dùng trong app đều có bản dịch đầy đủ.`);

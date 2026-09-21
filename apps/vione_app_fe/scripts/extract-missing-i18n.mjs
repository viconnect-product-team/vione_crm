import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const I18N_FILE = resolve(root, "src/lib/i18n.ts");
const SCAN_DIRS = ["src/routes", "src/components"].map((d) => resolve(root, d));
const EXTS = new Set([".ts", ".tsx"]);

// ---- 1. Collect defined keys + per-key vi/en presence --------------------
const i18nSrc = readFileSync(I18N_FILE, "utf8");

const entryStarts = [...i18nSrc.matchAll(/"([^"\n]+)"\s*:\s*\{/g)].map((m) => ({
  key: m[1],
  index: m.index,
}));

const defined = new Map();
for (let i = 0; i < entryStarts.length; i++) {
  const { key, index } = entryStarts[i];
  const end = i + 1 < entryStarts.length ? entryStarts[i + 1].index : i18nSrc.length;
  const body = i18nSrc.slice(index, end);
  
  const vi = /\bvi\s*:\s*(?:"([^]*?)"|'([^]*?)')/.exec(body);
  const en = /\ben\s*:\s*(?:"([^]*?)"|'([^]*?)')/.exec(body);
  const lo = /\blo\s*:\s*(?:"([^]*?)"|'([^]*?)')/.exec(body);
  const km = /\bkm\s*:\s*(?:"([^]*?)"|'([^]*?)')/.exec(body);
  const my = /\bmy\s*:\s*(?:"([^]*?)"|'([^]*?)')/.exec(body);
  
  const val = (m) => (m ? (m[1] ?? m[2] ?? "") : "");
  
  defined.set(key, {
    viText: val(vi),
    enText: val(en),
    vi: !!vi && val(vi).trim().length > 0,
    en: !!en && val(en).trim().length > 0,
    lo: !!lo && val(lo).trim().length > 0,
    km: !!km && val(km).trim().length > 0,
    my: !!my && val(my).trim().length > 0,
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

const used = new Map();
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

// ---- 3. Extract missing ----------------------------------------------------
const missingDict = {};
let count = 0;

for (const [key, files] of used) {
  const def = defined.get(key);
  if (!def) continue;
  
  // If missing ANY of the languages
  if (!def.lo || !def.km || !def.my) {
    missingDict[key] = {
      en: def.enText,
      vi: def.viText
    };
    count++;
  }
}

writeFileSync(resolve(root, "missing_i18n.json"), JSON.stringify(missingDict, null, 2));
console.log(`Extracted ${count} missing keys to missing_i18n.json`);

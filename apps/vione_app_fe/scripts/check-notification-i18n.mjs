// Build-time guard: warn/fail when i18n keys used for notification
// status / priority / unread labels do not exist in locales JSON.
//
// Runs in prebuild (see package.json). Exits non-zero on missing keys so
// broken labels are caught before shipping instead of rendering raw keys.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const repoRoot = resolve(root, "../..");

const localesDir = resolve(repoRoot, "packages/shared/locales");
const SCREEN_FILE = resolve(root, "src/routes/m.notifications.tsx");

// Only guard the label groups the notification screen relies on.
const GUARDED = /^m\.notifications\.(status|priority|filter)\./;

const screenSrc = readFileSync(SCREEN_FILE, "utf8");

// Load JSON translation dictionaries
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

// Collect keys referenced anywhere in the notifications screen (t("..."),
// label maps, aria-labels, etc.) that belong to the guarded groups.
const used = new Set(
  [...screenSrc.matchAll(/"(m\.notifications\.[^"]+)"/g)]
    .map((m) => m[1])
    .filter((k) => GUARDED.test(k)),
);

const missing = [...used].filter((k) => !defined.has(k)).sort();

if (missing.length > 0) {
  console.error(
    "\n[i18n-check] Thiếu key i18n cho nhãn trạng thái/priority/unread trong màn hình thông báo:",
  );
  for (const k of missing) console.error(`  - ${k}`);
  console.error(`\nThêm các key trên vào file JSON tương ứng trong packages/shared/locales/ rồi build lại.\n`);
  process.exit(1);
}

console.log(
  `[i18n-check] OK — ${used.size} key trạng thái/priority/unread hợp lệ trong màn hình thông báo.`,
);

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const I18N_FILE = resolve(root, "src/lib/i18n.ts");

function main() {
  let src = readFileSync(I18N_FILE, "utf8");
  
  // Fix double commas caused by trailing commas in original file
  // e.g. `en: "...",\n  , lo: "..."` -> `en: "...",\n  lo: "..."`
  src = src.replace(/,\s*,\s*lo:/g, ",\nlo:");
  
  writeFileSync(I18N_FILE, src, "utf8");
  console.log("✅ Fixed double commas in src/lib/i18n.ts");
}

main();

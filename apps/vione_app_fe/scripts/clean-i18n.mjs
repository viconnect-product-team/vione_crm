import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const I18N_FILE = resolve(root, "src/lib/i18n.ts");

function main() {
  let src = readFileSync(I18N_FILE, "utf8");
  
  // The exact pattern we injected in the first script, replacing the first `}` it found.
  // We need to replace it back with `}`
  const regex = /\n      lo: "(?:[^"\\]|\\.)*",\n      km: "(?:[^"\\]|\\.)*",\n      my: "(?:[^"\\]|\\.)*",\n    \}/g;
  
  let matchCount = 0;
  src = src.replace(regex, () => {
    matchCount++;
    return "}";
  });
  
  writeFileSync(I18N_FILE, src, "utf8");
  console.log(`✅ Cleaned up ${matchCount} broken injections from src/lib/i18n.ts`);
}

main();

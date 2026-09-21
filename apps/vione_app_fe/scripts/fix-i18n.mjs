import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const MISSING_FILE = resolve(root, "missing_i18n.json");
const TRANSLATED_FILE = resolve(root, "translated_i18n.json");
const I18N_FILE = resolve(root, "src/lib/i18n.ts");

function main() {
  const missing = JSON.parse(readFileSync(MISSING_FILE, "utf8"));
  const translated = JSON.parse(readFileSync(TRANSLATED_FILE, "utf8"));
  let src = readFileSync(I18N_FILE, "utf8");

  let brokenKeys = [];
  for (const [key, { vi, en }] of Object.entries(missing)) {
    if (vi.includes("{") || en.includes("{")) {
      brokenKeys.push(key);
    }
  }
  console.log(`Found ${brokenKeys.length} broken keys`);
  
  // For each broken key, let's fix it!
  for (const key of brokenKeys) {
    const origVi = missing[key].vi;
    const origEn = missing[key].en;
    const tr = translated[key];
    
    // The broken injected block looks something like:
    // "key": { vi: "some text {var
    //       lo: "...",
    //       km: "...",
    //       my: "...",
    //     }", en: ...
    
    // Let's just find "key": { ... } using brace matching and replace the whole thing!
    const search1 = `"${key}": {`;
    const search2 = `'${key}': {`;
    let keyIdx = src.indexOf(search1);
    if (keyIdx === -1) keyIdx = src.indexOf(search2);
    
    if (keyIdx !== -1) {
      const startBrace = src.indexOf("{", keyIdx);
      let braceCount = 1;
      let endBrace = -1;
      // Because there are broken strings with { and } inside quotes, a naive brace matcher might fail if the quotes are unclosed.
      // Actually, since it's just broken TS, let's just use regex to replace the specific broken pattern.
    }
  }
  
  writeFileSync("broken_keys.json", JSON.stringify(brokenKeys, null, 2));
}

main();

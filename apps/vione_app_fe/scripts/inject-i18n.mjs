import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const I18N_FILE = resolve(root, "src/lib/i18n.ts");
const TRANSLATED_FILE = resolve(root, "translated_i18n.json");

function escapeVal(str) {
  return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function main() {
  const translated = JSON.parse(readFileSync(TRANSLATED_FILE, "utf8"));
  let src = readFileSync(I18N_FILE, "utf8");
  let injectCount = 0;

  for (const [key, { lo, km, my }] of Object.entries(translated)) {
    // Find the key definition
    const search1 = `"${key}": {`;
    const search2 = `'${key}': {`;
    const search3 = `"${key}":{`;
    
    let keyIdx = src.indexOf(search1);
    if (keyIdx === -1) keyIdx = src.indexOf(search2);
    if (keyIdx === -1) keyIdx = src.indexOf(search3);
    
    if (keyIdx === -1) {
      console.warn(`Could not find key: ${key}`);
      continue;
    }

    // Find the opening brace of the object
    const startBraceIdx = src.indexOf("{", keyIdx);
    
    // Find the matching closing brace, accounting for strings
    let braceCount = 1;
    let endBraceIdx = -1;
    let inString = false;
    let stringChar = '';
    let escape = false;

    for (let i = startBraceIdx + 1; i < src.length; i++) {
      const char = src[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
        continue;
      }
      if (inString && char === stringChar) {
        inString = false;
        continue;
      }
      
      if (!inString) {
        if (char === "{") braceCount++;
        else if (char === "}") braceCount--;
        
        if (braceCount === 0) {
          endBraceIdx = i;
          break;
        }
      }
    }

    if (endBraceIdx !== -1) {
      // Find out if there's a trailing comma before endBraceIdx
      let trailingCommaStr = "";
      let j = endBraceIdx - 1;
      while (j >= 0 && /\s/.test(src[j])) j--;
      if (j >= 0 && src[j] !== ',') {
        trailingCommaStr = ","; // Add a comma if there isn't one
      }

      const injected = `${trailingCommaStr} lo: "${escapeVal(lo)}", km: "${escapeVal(km)}", my: "${escapeVal(my)}" `;
      
      // We will insert right before the closing brace
      src = src.slice(0, endBraceIdx) + injected + src.slice(endBraceIdx);
      injectCount++;
    }
  }

  writeFileSync(I18N_FILE, src, "utf8");
  console.log(`✅ Injected translations safely for ${injectCount} keys into src/lib/i18n.ts`);
}

main();

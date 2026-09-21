import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const MISSING_FILE = resolve(root, "missing_i18n.json");
const OUTPUT_FILE = resolve(root, "translated_i18n.json");

async function translateText(text, targetLang) {
  // Free Google Translate API (gtx)
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    // data[0] contains array of translated sentences
    return data[0].map(x => x[0]).join("");
  } catch (err) {
    console.error(`Error translating "${text}" to ${targetLang}:`, err.message);
    return text; // fallback to english
  }
}

async function main() {
  const missing = JSON.parse(readFileSync(MISSING_FILE, "utf8"));
  const translated = {};
  
  const keys = Object.keys(missing);
  console.log(`Starting translation for ${keys.length} keys...`);
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const enText = missing[key].en;
    
    // Skip empty
    if (!enText) {
      translated[key] = { lo: "", km: "", my: "" };
      continue;
    }

    console.log(`[${i+1}/${keys.length}] Translating: ${key}`);
    
    // To avoid rate limiting, we wait a tiny bit and do them sequentially
    const lo = await translateText(enText, "lo");
    const km = await translateText(enText, "km");
    const my = await translateText(enText, "my");
    
    translated[key] = { lo, km, my };
    
    // Add a small delay to prevent being blocked by Google
    await new Promise(r => setTimeout(r, 200));
  }
  
  writeFileSync(OUTPUT_FILE, JSON.stringify(translated, null, 2));
  console.log(`\n✅ Translation complete! Saved to ${OUTPUT_FILE}`);
}

main();

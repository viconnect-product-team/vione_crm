import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const i18nPath = path.resolve(__dirname, '../src/lib/i18n.ts');

const TARGET_LANGS = ['vi', 'en', 'lo', 'km', 'my'];

async function translateText(text, targetLang, sourceLang = 'en') {
    if (!text || text.trim() === '') return text;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data[0].map(s => s[0]).join('');
    } catch (err) {
        console.error(`Error translating to ${targetLang}:`, err.message);
        return text; 
    }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log('Reading i18n.ts...');
    let content = fs.readFileSync(i18nPath, 'utf-8');
    
    // We use matchAll to get all entries in translations object reliably
    const entryRegex = /("[^"]+"|'[^']+'|[a-zA-Z0-9_.-]+)\s*:\s*\{([^}]+)\}/g;
    
    let match;
    const matches = [];
    while ((match = entryRegex.exec(content)) !== null) {
        matches.push({
            fullMatch: match[0],
            key: match[1],
            body: match[2],
            index: match.index
        });
    }

    console.log(`Found ${matches.length} translation entries.`);
    
    let newContent = content;
    let modifiedCount = 0;

    for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        const body = m.body;
        
        let allExist = true;
        for (const lang of TARGET_LANGS) {
            if (!new RegExp(`\\b${lang}\\s*:`).test(body)) {
                allExist = false;
                break;
            }
        }
        
        if (allExist) continue;

        let sourceText = '';
        let sourceLang = '';

        const enMatch = /\ben\s*:\s*(?:"([\s\S]*?)"|'([\s\S]*?)'|`([\s\S]*?)`)/.exec(body);
        if (enMatch) {
            sourceText = enMatch[1] ?? enMatch[2] ?? enMatch[3] ?? '';
            sourceLang = 'en';
        }

        if (!sourceText) {
            const viMatch = /\bvi\s*:\s*(?:"([\s\S]*?)"|'([\s\S]*?)'|`([\s\S]*?)`)/.exec(body);
            if (viMatch) {
                sourceText = viMatch[1] ?? viMatch[2] ?? viMatch[3] ?? '';
                sourceLang = 'vi';
            }
        }

        if (!sourceText) {
            console.log(`Skipping empty source for key: ${m.key}, body: ${body}`);
            continue;
        }

        let newBody = body.replace(/,\s*$/, ''); 
        
        console.log(`[${i+1}/${matches.length}] Translating key: ${m.key} from ${sourceLang}`);
        
        const tasks = TARGET_LANGS.filter(lang => lang !== sourceLang && !new RegExp(`\\b${lang}\\s*:`).test(body)).map(async lang => {
            const translated = await translateText(sourceText, lang, sourceLang);
            const safeTranslated = translated.replace(/"/g, '\\"').replace(/\n/g, '\\n');
            return `, ${lang}: "${safeTranslated}"`;
        });
        
        const results = await Promise.all(tasks);
        newBody += results.join('');

        const newMatchString = `${m.key}: {${newBody} }`;
        newContent = newContent.replace(m.fullMatch, newMatchString);
        modifiedCount++;
        
        await sleep(10); // Be gentle with the API
        
        // Save progressively every 50 to avoid losing data if script fails
        if (modifiedCount > 0 && modifiedCount % 100 === 0) {
            fs.writeFileSync(i18nPath, newContent, 'utf-8');
            console.log('Saved progress...');
        }
    }

    if (modifiedCount > 0) {
        fs.writeFileSync(i18nPath, newContent, 'utf-8');
        console.log(`Successfully updated ${modifiedCount} entries.`);
    } else {
        console.log('No entries needed updating.');
    }
}

main().catch(console.error);

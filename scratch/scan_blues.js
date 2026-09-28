const fs = require('fs');
const path = require('path');

const bluePatterns = [
  /#0052CC/gi,
  /#003B95/gi,
  /#1D4ED8/gi,
  /#2563EB/gi,
  /#3B82F6/gi,
  /#0284C7/gi,
  /#0369A1/gi,
  /#0EA5E9/gi,
  /text-blue-\d+/g,
  /bg-blue-\d+/g,
  /border-blue-\d+/g,
  /ring-blue-\d+/g,
  /text-sky-\d+/g,
  /bg-sky-\d+/g,
  /border-sky-\d+/g,
  /ring-sky-\d+/g,
  /--bc-mobile-navy/g
];

function scanDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.output' && entry.name !== 'dist') {
        scanDir(full, results);
      }
    } else if (entry.isFile() && /\.(tsx|ts|css|html)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      const found = [];
      for (const pat of bluePatterns) {
        const matches = content.match(pat);
        if (matches) {
          found.push(...matches);
        }
      }
      if (found.length > 0) {
        results.push({ file: full, count: found.length, samples: Array.from(new Set(found)) });
      }
    }
  }
  return results;
}

const targetDir = path.resolve('apps/vione_app_fe/src');
const list = scanDir(targetDir);
console.log(`Found ${list.length} files with blue colors in apps/vione_app_fe/src:`);
for (const item of list) {
  console.log(`- ${path.relative(targetDir, item.file)}: ${item.count} occurrences (${item.samples.join(', ')})`);
}

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

function scanFiles(dirs) {
  const results = [];
  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.output' && entry.name !== 'dist') {
          scan(full);
        }
      } else if (entry.isFile() && /\.(tsx|ts|css)$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf8');
        const found = [];
        for (const pat of bluePatterns) {
          const matches = content.match(pat);
          if (matches) found.push(...matches);
        }
        if (found.length > 0) {
          results.push({ file: full, count: found.length, samples: Array.from(new Set(found)) });
        }
      }
    }
  }
  for (const d of dirs) {
    if (fs.existsSync(d)) scan(d);
  }
  return results;
}

const vioneDirs = [
  path.resolve('apps/vione_app_fe/src/components/business-connect'),
  path.resolve('apps/vione_app_fe/src/routes/connect-app*')
];

// Scan individual files for routes/connect-app.*
const routesDir = path.resolve('apps/vione_app_fe/src/routes');
const connectAppRoutes = fs.readdirSync(routesDir)
  .filter(f => f.startsWith('connect-app'))
  .map(f => path.join(routesDir, f));

const bcDir = path.resolve('apps/vione_app_fe/src/components/business-connect');
const allVioneResults = scanFiles([bcDir, ...connectAppRoutes.filter(f => fs.statSync(f).isDirectory())]);

for (const r of connectAppRoutes.filter(f => fs.statSync(f).isFile())) {
  const content = fs.readFileSync(r, 'utf8');
  const found = [];
  for (const pat of bluePatterns) {
    const matches = content.match(pat);
    if (matches) found.push(...matches);
  }
  if (found.length > 0) {
    allVioneResults.push({ file: r, count: found.length, samples: Array.from(new Set(found)) });
  }
}

console.log(`VIONE APP BLUE COLOR AUDIT (${allVioneResults.length} files):`);
for (const item of allVioneResults) {
  console.log(`- ${path.relative(path.resolve('apps/vione_app_fe/src'), item.file)}: ${item.count} items -> ${item.samples.join(', ')}`);
}

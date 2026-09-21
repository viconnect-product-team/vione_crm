const fs = require('fs');
const path = require('path');

function getFiles(dir, filter) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full, filter));
    } else if (file.endsWith(filter)) {
      results.push(full);
    }
  });
  return results;
}

const controllerFiles = getFiles('apps/vione_app_be/src', 'controller.ts');
const apiList = [];

controllerFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const controllerMatch = content.match(/@Controller\((?:['"`](.*?)['"`])?\)/);
  const basePath = controllerMatch && controllerMatch[1] ? controllerMatch[1] : '';

  // Match decorators: @Get('...'), @Post('...'), etc.
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const decMatch = line.match(/^@(Get|Post|Put|Patch|Delete)\((?:['"`](.*?)['"`])?\)/);
    if (decMatch) {
      const httpMethod = decMatch[1].toUpperCase();
      const subPath = decMatch[2] || '';
      // find the next method definition
      let handler = '';
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const hMatch = lines[j].trim().match(/^(?:async\s+)?([a-zA-Z0-9_]+)\s*\(/);
        if (hMatch && !lines[j].trim().startsWith('@')) {
          handler = hMatch[1];
          break;
        }
      }
      const fullPath = ('/' + basePath + (subPath ? '/' + subPath : '')).replace(/\/+/g, '/');
      apiList.push({
        file: path.relative('apps/vione_app_be/src', file).replace(/\\/g, '/'),
        basePath,
        method: httpMethod,
        subPath,
        fullPath,
        handler,
      });
    }
  }
});

console.log('Total APIs found:', apiList.length);
fs.writeFileSync('scripts/api_catalog.json', JSON.stringify(apiList, null, 2));
console.log('Saved to scripts/api_catalog.json');

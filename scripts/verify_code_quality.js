const ts = require('typescript');
const fs = require('fs');

const files = [
  'apps/vione_app_fe/src/routes/association.profile.tsx',
  'apps/vione_app_fe/src/routes/association.index.tsx',
  'apps/vione_app_fe/src/routes/association.card.tsx',
  'apps/vione_app_be/src/upload/upload.controller.ts'
];

let totalErrors = 0;

for (const f of files) {
  const code = fs.readFileSync(f, 'utf8');
  const sourceFile = ts.createSourceFile(
    f,
    code,
    ts.ScriptTarget.Latest,
    true,
    f.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const diagnostics = sourceFile.parseDiagnostics || [];
  if (diagnostics.length === 0) {
    console.log(`[PASS] ${f}: 0 syntax/AST errors`);
  } else {
    console.error(`[FAIL] ${f}: ${diagnostics.length} errors found:`, diagnostics);
    totalErrors += diagnostics.length;
  }
}

if (totalErrors === 0) {
  console.log('\n>>> ALL 4 MODIFIED FILES PASSED AST SYNTAX VALIDATION (0 ERRORS)! <<<');
  process.exit(0);
} else {
  console.error(`\n>>> FAILED WITH ${totalErrors} ERRORS <<<`);
  process.exit(1);
}

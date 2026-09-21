import { Project, SyntaxKind } from "ts-morph";
import { writeFileSync, readFileSync } from "fs";

function injectMissing() {
  const translated = JSON.parse(readFileSync("translated_i18n.json", "utf8"));
  
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath("src/lib/i18n.ts");
  
  const varDecl = sourceFile.getVariableDeclaration("translations");
  let initializer = varDecl.getInitializer();
  if (initializer && initializer.isKind(SyntaxKind.AsExpression)) {
    initializer = initializer.getExpression();
  }
  
  let sourceText = sourceFile.getFullText();
  const replacements = [];
  
  for (const prop of initializer.getProperties()) {
    if (prop.isKind(SyntaxKind.PropertyAssignment)) {
      const keyNode = prop.getNameNode();
      let key = prop.getName();
      if (keyNode.isKind(SyntaxKind.StringLiteral)) {
        key = keyNode.getLiteralText();
      } else {
        key = key.replace(/['"]/g, '');
      }

      if (translated[key]) {
        const { lo, km, my } = translated[key];
        const value = prop.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
        
        if (value) {
          let hasLo = false, hasKm = false, hasMy = false;
          for (const langProp of value.getProperties()) {
            if (langProp.isKind(SyntaxKind.PropertyAssignment)) {
              const langKey = langProp.getName();
              if (langKey === "lo") hasLo = true;
              if (langKey === "km") hasKm = true;
              if (langKey === "my") hasMy = true;
            }
          }

          if (!hasLo || !hasKm || !hasMy) {
            const closeBrace = value.getFirstChildByKind(SyntaxKind.CloseBraceToken);
            if (!closeBrace) continue;
            
            const endPos = closeBrace.getStart();
            
            let injection = "";
            if (!hasLo && lo) injection += `lo: ${JSON.stringify(lo)}, `;
            if (!hasKm && km) injection += `km: ${JSON.stringify(km)}, `;
            if (!hasMy && my) injection += `my: ${JSON.stringify(my)}`;
            if (injection.endsWith(", ")) injection = injection.slice(0, -2); // remove trailing comma of injection itself
            
            // Look backward from endPos for a trailing comma
            let trailingCommaPos = -1;
            for (let i = endPos - 1; i >= 0; i--) {
              const char = sourceText[i];
              if (char === ' ' || char === '\n' || char === '\r' || char === '\t') continue;
              if (char === ',') trailingCommaPos = i;
              break;
            }
            
            if (trailingCommaPos !== -1) {
              replacements.push({
                startPos: trailingCommaPos,
                endPos: trailingCommaPos + 1, // replace the comma
                text: `, ` + injection
              });
            } else {
              replacements.push({
                startPos: endPos,
                endPos: endPos, // insert before `}`
                text: `, ` + injection + ` `
              });
            }
          }
        }
      }
    }
  }
  
  // Apply replacements from bottom to top
  replacements.sort((a, b) => b.startPos - a.startPos);
  
  for (const rep of replacements) {
    sourceText = sourceText.slice(0, rep.startPos) + rep.text + sourceText.slice(rep.endPos);
  }
  
  writeFileSync("src/lib/i18n.ts", sourceText, "utf8");
  console.log(`✅ Safely injected translations for ${replacements.length} keys using precise AST offsets.`);
}

injectMissing();

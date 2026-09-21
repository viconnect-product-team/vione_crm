import { Project, SyntaxKind } from "ts-morph";
import { writeFileSync, readFileSync } from "fs";

function injectMissing() {
  const translated = JSON.parse(readFileSync("translated_i18n.json", "utf8"));
  
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath("src/lib/i18n.ts");
  
  // Find the translations object
  const varDecl = sourceFile.getVariableDeclaration("translations");
  if (!varDecl) throw new Error("Could not find translations variable");
  
  let initializer = varDecl.getInitializer();
  if (initializer && initializer.isKind(SyntaxKind.AsExpression)) {
    initializer = initializer.getExpression();
  }
  
  if (!initializer || !initializer.isKind(SyntaxKind.ObjectLiteralExpression)) {
    throw new Error("Translations variable is not an object literal");
  }
  
  let injectCount = 0;
  
  // Iterate through all properties in the translations object
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

          if (!hasLo && lo) value.addPropertyAssignment({ name: "lo", initializer: writer => writer.quote(lo) });
          if (!hasKm && km) value.addPropertyAssignment({ name: "km", initializer: writer => writer.quote(km) });
          if (!hasMy && my) value.addPropertyAssignment({ name: "my", initializer: writer => writer.quote(my) });
          
          injectCount++;
        }
      }
    }
  }
  
  sourceFile.saveSync();
  console.log(`✅ Safely injected translations for ${injectCount} keys using AST (ts-morph).`);
}

injectMissing();

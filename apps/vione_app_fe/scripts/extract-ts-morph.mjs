import { Project, SyntaxKind } from "ts-morph";
import { writeFileSync } from "fs";

function extractMissing() {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath("src/lib/i18n.ts");
  
  // Find the translations object
  const varDecl = sourceFile.getVariableDeclaration("translations");
  if (!varDecl) throw new Error("Could not find translations variable");
  
  const initializer = varDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
  
  const missing = {};
  
  // Iterate through all properties in the translations object
  for (const prop of initializer.getProperties()) {
    if (prop.isKind(SyntaxKind.PropertyAssignment)) {
      const key = prop.getName().replace(/['"]/g, ''); // Remove quotes if any
      const value = prop.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
      
      if (value) {
        let hasVi = false;
        let hasEn = false;
        let hasLo = false;
        let hasKm = false;
        let hasMy = false;
        
        let viText = "";
        let enText = "";
        
        for (const langProp of value.getProperties()) {
          if (langProp.isKind(SyntaxKind.PropertyAssignment)) {
            const langKey = langProp.getName();
            const langVal = langProp.getInitializer();
            
            if (langVal && langVal.isKind(SyntaxKind.StringLiteral) || langVal?.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
              const text = langVal.getLiteralText();
              if (langKey === "vi") { hasVi = true; viText = text; }
              if (langKey === "en") { hasEn = true; enText = text; }
              if (langKey === "lo") hasLo = true;
              if (langKey === "km") hasKm = true;
              if (langKey === "my") hasMy = true;
            }
          }
        }
        
        if (hasVi && hasEn && (!hasLo || !hasKm || !hasMy)) {
          missing[key] = { vi: viText, en: enText };
        }
      }
    }
  }
  
  writeFileSync("missing_i18n.json", JSON.stringify(missing, null, 2));
  console.log(`Found ${Object.keys(missing).length} missing translations.`);
}

extractMissing();

/**
 * Codemod: chuyển các class màu hardcode (Tailwind palette) sang semantic tokens
 * của design system (primary / success / warning / destructive / card / border / muted).
 *
 * Chạy: node scripts/codemod-semantic-tokens.mjs [--dry]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const DRY = process.argv.includes("--dry");

const FAMILY = {
  emerald: "success",
  green: "success",
  teal: "success",
  lime: "success",
  amber: "warning",
  yellow: "warning",
  orange: "warning",
  red: "destructive",
  rose: "destructive",
  sky: "primary",
  blue: "primary",
  cyan: "primary",
  indigo: "primary",
  violet: "primary",
  purple: "primary",
  fuchsia: "primary",
  pink: "primary",
};

const NEUTRAL = new Set(["slate", "gray", "zinc", "neutral", "stone"]);

const UTILS =
  "(?:text|bg|border|from|to|via|ring|fill|stroke|divide|shadow|outline|decoration|accent|caret)";
const VARIANT = "(?:[a-z-]+:)*";

function mapNeutral(util, shade) {
  const n = Number(shade ?? 500);
  switch (util) {
    case "text":
    case "fill":
    case "stroke":
    case "decoration":
      return n >= 600 ? "foreground" : "muted-foreground";
    case "bg":
    case "from":
    case "to":
    case "via":
      return n >= 600 ? "foreground" : "muted";
    default:
      return "border";
  }
}

function mapPlain(util, name) {
  // white / black
  if (name === "white") {
    switch (util) {
      case "text":
      case "fill":
      case "stroke":
        return "primary-foreground";
      case "bg":
      case "from":
      case "to":
      case "via":
        return "card";
      case "ring":
        return "ring";
      case "shadow":
        return "foreground";
      default:
        return "border";
    }
  }
  // black
  switch (util) {
    case "bg":
    case "from":
    case "to":
    case "via":
    case "shadow":
      return "foreground";
    case "text":
    case "fill":
    case "stroke":
      return "foreground";
    case "ring":
      return "ring";
    default:
      return "border";
  }
}

const re = new RegExp(
  `\\b(${VARIANT})(${UTILS})-(white|black|${Object.keys(FAMILY).join("|")}|${[...NEUTRAL].join("|")})(?:-(\\d{2,3}))?(\\/\\d{1,3})?\\b`,
  "g",
);

function transform(src) {
  return src.replace(re, (full, variant, util, name, shade, opacity) => {
    let token;
    if (name === "white" || name === "black") {
      token = mapPlain(util, name);
      if (!shade && !opacity && name === "white" && util === "bg") token = "card";
    } else if (NEUTRAL.has(name)) {
      token = mapNeutral(util, shade);
    } else {
      token = FAMILY[name];
      if (!token) return full;
      // border/ring/divide dùng token màu trực tiếp với opacity giữ nguyên
    }
    return `${variant}${util}-${token}${opacity ?? ""}`;
  });
}

// Loại bỏ các biến thể dark: trùng lặp với class base trong cùng chuỗi className
function dedupeDark(src) {
  return src.replace(/(class(?:Name)?=(?:"|'|`))([^"'`]*)(\1[\s\S]{0})?/g, (m) => m);
}

const files = execSync(
  `rg -l -e '\\b(text|bg|border|from|to|via|ring|fill|stroke|divide|shadow)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-[0-9]{2,3})?' src --glob '*.tsx'`,
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

let changed = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  let out = transform(src);
  // gộp các cặp "X-token dark:X-token" trùng nhau
  out = out.replace(
    /\b((?:text|bg|border|ring|fill|stroke|from|to|via)-[a-z-]+(?:\/\d{1,3})?)\s+dark:\1\b/g,
    "$1",
  );
  if (out !== src) {
    changed++;
    if (!DRY) writeFileSync(f, out);
  }
}
console.log(`${DRY ? "[dry] " : ""}files changed: ${changed}/${files.length}`);

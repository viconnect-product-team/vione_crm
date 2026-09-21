// QR contrast utilities.
//
// Purpose: guarantee that a card template's colour choices don't degrade QR
// scannability. Scanners rely on high luminance contrast between modules
// (`dark`) and background (`light`). ISO/IEC 18004 recommends ≥ 40% contrast
// difference; in practice we target the WCAG large-text threshold (≥ 3:1) as
// a hard minimum and ≥ 7:1 as the "reliable" target for camera decoding on
// mid-range phones under variable lighting.

export type ContrastLevel = "excellent" | "ok" | "warn" | "fail";

export type QrContrastReport = {
  /** WCAG luminance contrast ratio (1..21). */
  ratio: number;
  level: ContrastLevel;
  /** True when the input colours are safe to hand directly to a QR encoder. */
  safe: boolean;
  /** True when at least one input was a gradient/unparseable value. */
  hadInvalidInput: boolean;
};

export type SafeQrColors = {
  dark: string;
  light: string;
  report: QrContrastReport;
  /** True when we substituted safer colours for the caller's request. */
  substituted: boolean;
};

const HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const HEX8 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGB = /rgba?\(\s*([-\d.]+)\s*[, ]\s*([-\d.]+)\s*[, ]\s*([-\d.]+)/i;

/** Extract the first solid RGB triple from a CSS colour string. Returns null
 *  for gradients or unrecognised inputs. */
export function parseColor(input: string): [number, number, number] | null {
  if (!input) return null;
  const s = input.trim();
  // If it's a gradient, try to salvage the first colour inside.
  if (s.includes("gradient(")) {
    const inner = s.slice(s.indexOf("(") + 1);
    const hex = inner.match(/#[0-9a-f]{3,8}/i);
    if (hex) return parseColor(hex[0]);
    const rgb = inner.match(RGB);
    if (rgb) return [+rgb[1], +rgb[2], +rgb[3]].map(clamp255) as [number, number, number];
    return null;
  }
  const m8 = s.match(HEX8);
  if (m8) return [parseInt(m8[1], 16), parseInt(m8[2], 16), parseInt(m8[3], 16)];
  const m6 = s.match(HEX6);
  if (m6) return [parseInt(m6[1], 16), parseInt(m6[2], 16), parseInt(m6[3], 16)];
  const m3 = s.match(HEX3);
  if (m3)
    return [parseInt(m3[1] + m3[1], 16), parseInt(m3[2] + m3[2], 16), parseInt(m3[3] + m3[3], 16)];
  const m = s.match(RGB);
  if (m) return [+m[1], +m[2], +m[3]].map(clamp255) as [number, number, number];
  return null;
}

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** WCAG relative luminance (0..1). */
export function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c: any) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio in [1, 21]. */
export function contrastRatio(a: string, b: string): number {
  const ra = parseColor(a);
  const rb = parseColor(b);
  if (!ra || !rb) return 1;
  const la = relativeLuminance(ra);
  const lb = relativeLuminance(rb);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function classifyContrast(ratio: number): ContrastLevel {
  if (ratio >= 7) return "excellent";
  if (ratio >= 4.5) return "ok";
  if (ratio >= 3) return "warn";
  return "fail";
}

function isGradient(s: string | undefined | null): boolean {
  return !!s && s.includes("gradient(");
}

export function evaluateQrContrast(dark: string, light: string): QrContrastReport {
  const parsedDark = parseColor(dark);
  const parsedLight = parseColor(light);
  // A gradient can be parsed (we grab its first stop) but is never a valid
  // solid colour for a QR encoder, so flag it as invalid input.
  const hadInvalidInput = !parsedDark || !parsedLight || isGradient(dark) || isGradient(light);
  const ratio = !parsedDark || !parsedLight ? 1 : contrastRatio(dark, light);
  const level = hadInvalidInput ? "fail" : classifyContrast(ratio);
  return {
    ratio,
    level,
    safe: !hadInvalidInput && ratio >= 4.5,
    hadInvalidInput,
  };
}

const SAFE_DARK = "#0a1834";
const SAFE_LIGHT = "#ffffff";

/**
 * Resolve a scannable QR colour pair for the given template-like theme.
 * Strategy:
 *  1. Try requested `dark`/`light` — if both are solid and contrast ≥ 4.5, keep.
 *  2. Otherwise pick the darker of {theme.text, theme.accent, SAFE_DARK} on
 *     white; fall back to (SAFE_DARK, SAFE_LIGHT) if nothing meets 4.5.
 */
export function resolveSafeQrColors(input: {
  requestedDark?: string;
  requestedLight?: string;
  theme?: { text?: string; accent?: string; surface?: string };
}): SafeQrColors {
  const { requestedDark, requestedLight, theme } = input;

  if (requestedDark && requestedLight) {
    const rep = evaluateQrContrast(requestedDark, requestedLight);
    if (rep.safe) {
      return { dark: requestedDark, light: requestedLight, report: rep, substituted: false };
    }
  }

  // Build candidate darks: template text, template accent, safe navy.
  const candidates = [theme?.text, theme?.accent, SAFE_DARK].filter(
    (c): c is string => typeof c === "string" && !!parseColor(c),
  );

  let best: { dark: string; ratio: number } = {
    dark: SAFE_DARK,
    ratio: contrastRatio(SAFE_DARK, SAFE_LIGHT),
  };
  for (const c of candidates) {
    const r = contrastRatio(c, SAFE_LIGHT);
    if (r > best.ratio) best = { dark: c, ratio: r };
  }
  const report: QrContrastReport = {
    ratio: best.ratio,
    level: classifyContrast(best.ratio),
    safe: best.ratio >= 4.5,
    hadInvalidInput: false,
  };
  return { dark: best.dark, light: SAFE_LIGHT, report, substituted: true };
}

/** Convenience: evaluate a template's "natural" QR colours (accent on surface). */
export function evaluateTemplateQr(theme: {
  accent?: string;
  surface?: string;
  text?: string;
}): QrContrastReport {
  // What a naïve implementation would use: modules in `accent`, background in `surface`.
  return evaluateQrContrast(theme.accent ?? SAFE_DARK, theme.surface ?? SAFE_LIGHT);
}

// QR auto-optimize: combines contrast + logo-safety heuristics to suggest
// the best qrOptions for scannability given a template theme.
//
// Rules
// -----
// * Background: choose the plate whose (theme.text × plate) WCAG ratio is
//   highest and ≥ 4.5. Preference order on ties: `template` (most on-brand)
//   → `white` (safest) → `transparent` (never auto-picked; only kept if the
//   user already had it and it stays scannable on a light template surface).
// * Logo placement: run `clampPlacement` — shrinks the badge until neither
//   a finder pattern nor the quiet zone is violated.
//
// The optimizer is pure: it does not mutate anything. Callers apply the
// returned `next` options and show `changes` to the user.

import { contrastRatio } from "@/lib/qr-contrast";
import { clampPlacement, evaluateLogoPlacement } from "@/lib/qr-safety";
import type { QrOptions } from "@/lib/business-card/business-card.types";

export type QrOptimizeTheme = {
  text?: string;
  surface?: string;
  accent?: string;
};

export type QrOptimizeChange = "background" | "logoScale" | "logoOffsetX" | "logoOffsetY";

export type QrOptimizeResult = {
  next: QrOptions;
  changed: boolean;
  changes: QrOptimizeChange[];
  /** Best-case module/plate contrast the recommendation delivers. */
  contrastRatio: number;
  /** Reason codes for UX copy. */
  notes: Array<"bgLowContrast" | "logoFinder" | "logoQuietZone">;
};

const WHITE = "#ffffff";
const SAFE_DARK = "#0a1834";

function ratioFor(bg: QrOptions["background"], theme: QrOptimizeTheme): number {
  const dark = theme.text ?? SAFE_DARK;
  const light =
    bg === "template"
      ? (theme.surface ?? WHITE)
      : bg === "transparent"
        ? WHITE // exports composite over white
        : WHITE;
  return contrastRatio(dark, light);
}

/** Pure recommender. Given the current qrOptions + template theme, produce
 *  the safest scannable configuration and a list of what changed. */
export function autoOptimizeQr(current: QrOptions, theme: QrOptimizeTheme): QrOptimizeResult {
  const notes: QrOptimizeResult["notes"] = [];

  // 1. Pick background. Score = ratio, with a small tie-break bias so that
  //    template beats white only when their ratios are within ~10%.
  const options: Array<{ bg: QrOptions["background"]; ratio: number; score: number }> = [
    { bg: "white", ratio: ratioFor("white", theme), score: 0 },
    { bg: "template", ratio: ratioFor("template", theme), score: 0 },
  ];
  // Only consider transparent if the user already opted into it AND the
  // template surface still gives a scannable ratio.
  if (current.background === "transparent") {
    options.push({
      bg: "transparent",
      ratio: ratioFor("transparent", theme),
      score: 0,
    });
  }
  const whiteRatio = options[0].ratio;
  for (const o of options) {
    // Boost template when ratio is close to white so we keep the brand feel.
    const bias = o.bg === "template" && o.ratio >= 4.5 && o.ratio >= whiteRatio * 0.9 ? 0.5 : 0;
    o.score = o.ratio + bias;
  }
  options.sort((a, b) => b.score - a.score);
  const bestBg = options[0];

  const nextBg: QrOptions["background"] = bestBg.ratio >= 4.5 ? bestBg.bg : "white";
  if (bestBg.ratio < 4.5) notes.push("bgLowContrast");

  // 2. Snap placement to nearest safe spot.
  const placementReport = evaluateLogoPlacement({
    logoScale: current.logoScale,
    logoOffsetX: current.logoOffsetX,
    logoOffsetY: current.logoOffsetY,
  });
  const safePlacement = clampPlacement({
    logoScale: current.logoScale,
    logoOffsetX: current.logoOffsetX,
    logoOffsetY: current.logoOffsetY,
  });
  if (placementReport.issues.includes("finder")) notes.push("logoFinder");
  if (placementReport.issues.includes("quiet")) notes.push("logoQuietZone");

  const next: QrOptions = {
    background: nextBg,
    logoScale: safePlacement.logoScale,
    logoOffsetX: safePlacement.logoOffsetX,
    logoOffsetY: safePlacement.logoOffsetY,
  };

  const changes: QrOptimizeChange[] = [];
  if (next.background !== current.background) changes.push("background");
  if (Math.abs(next.logoScale - current.logoScale) > 0.001) changes.push("logoScale");
  if (Math.abs(next.logoOffsetX - current.logoOffsetX) > 0.001) changes.push("logoOffsetX");
  if (Math.abs(next.logoOffsetY - current.logoOffsetY) > 0.001) changes.push("logoOffsetY");

  return {
    next,
    changed: changes.length > 0,
    changes,
    contrastRatio: ratioFor(next.background, theme),
    notes,
  };
}

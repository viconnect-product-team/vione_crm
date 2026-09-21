// QR logo placement safety.
//
// A centered logo obstructs QR modules. Even at error-correction level H
// (~30% recovery), scanners will fail when the logo intrudes on one of the
// three finder patterns (top-left, top-right, bottom-left) or eats into the
// mandatory quiet zone at the edges. This module models the QR as a unit
// square and checks the logo's bounding circle against those reserved areas.
//
// Coordinates are normalised (0..1). Origin is top-left; center is (0.5,0.5).
// The three finder-pattern squares each occupy ~8/N of the side (7-module
// pattern + 1-module separator). For typical vCard-ish payloads (~60–120
// chars at ECC H) the encoded matrix is version 4–6 → N ≈ 33–41. Using
// N = 33 gives the most conservative (largest) finder footprint at ~0.243.
//
// Quiet zone: ISO/IEC 18004 requires ≥ 4 modules of clear space around the
// symbol. The renderer already applies a margin, but a logo pushed toward
// an edge can still clip it. We enforce the logo's bounding box stays
// within [QUIET_MARGIN, 1 - QUIET_MARGIN].

export type LogoPlacement = {
  /** Diameter as a fraction of the QR side (0..1). */
  logoScale: number;
  /** Horizontal offset as a fraction of QR side, from center (-0.5..0.5). */
  logoOffsetX: number;
  /** Vertical offset as a fraction of QR side, from center (-0.5..0.5). */
  logoOffsetY: number;
};

export type LogoSafetyIssue = "finder" | "quiet";

export type LogoSafetyReport = {
  safe: boolean;
  issues: LogoSafetyIssue[];
  /** Nearest safe placement (clamped scale + offsets). */
  suggestion: LogoPlacement;
};

// Conservative footprint of a finder pattern (7 modules + 1 separator) on
// a 33-module symbol.
const FINDER = 8 / 33; // ~0.2424
// Padding around the logo badge as a fraction of the badge itself (matches
// QrCanvas' rendered halo).
const BADGE_PADDING = 0.12;
// Minimum clear margin from each QR edge (quiet zone budget).
const QUIET_MARGIN = 0.04;
// Hard clamps that match the builder UI's ranges.
const MIN_SCALE = 0.14;
const MAX_SCALE = 0.3;
const MAX_OFFSET = 0.25;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Bounding box of the logo badge in unit-square coordinates. */
function bbox(p: LogoPlacement) {
  const r = (p.logoScale * (1 + BADGE_PADDING)) / 2;
  const cx = 0.5 + p.logoOffsetX;
  const cy = 0.5 + p.logoOffsetY;
  return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r, r };
}

function overlapsFinder(p: LogoPlacement): boolean {
  const b = bbox(p);
  // Three finder squares.
  const finders = [
    { x0: 0, y0: 0, x1: FINDER, y1: FINDER }, // top-left
    { x0: 1 - FINDER, y0: 0, x1: 1, y1: FINDER }, // top-right
    { x0: 0, y0: 1 - FINDER, x1: FINDER, y1: 1 }, // bottom-left
  ];
  return finders.some((f) => b.x0 < f.x1 && b.x1 > f.x0 && b.y0 < f.y1 && b.y1 > f.y0);
}

function violatesQuietZone(p: LogoPlacement): boolean {
  const b = bbox(p);
  return (
    b.x0 < QUIET_MARGIN || b.y0 < QUIET_MARGIN || b.x1 > 1 - QUIET_MARGIN || b.y1 > 1 - QUIET_MARGIN
  );
}

/** Nearest safe placement: shrink scale until neither finder nor quiet zone
 *  is violated, keeping the requested offsets when possible. */
export function clampPlacement(p: LogoPlacement): LogoPlacement {
  let scale = clamp(p.logoScale, MIN_SCALE, MAX_SCALE);
  const ox = clamp(p.logoOffsetX, -MAX_OFFSET, MAX_OFFSET);
  const oy = clamp(p.logoOffsetY, -MAX_OFFSET, MAX_OFFSET);
  // Shrink in 1% steps until safe or we hit the floor.
  for (let i = 0; i < 20; i++) {
    const trial = { logoScale: scale, logoOffsetX: ox, logoOffsetY: oy };
    if (!overlapsFinder(trial) && !violatesQuietZone(trial)) {
      return trial;
    }
    scale = Math.max(MIN_SCALE, scale - 0.01);
    if (scale <= MIN_SCALE) break;
  }
  // Last resort: recenter at min scale.
  const centered = { logoScale: MIN_SCALE, logoOffsetX: 0, logoOffsetY: 0 };
  if (!overlapsFinder(centered) && !violatesQuietZone(centered)) return centered;
  return { logoScale: MIN_SCALE, logoOffsetX: 0, logoOffsetY: 0 };
}

export function evaluateLogoPlacement(p: LogoPlacement): LogoSafetyReport {
  const issues: LogoSafetyIssue[] = [];
  if (overlapsFinder(p)) issues.push("finder");
  if (violatesQuietZone(p)) issues.push("quiet");
  return {
    safe: issues.length === 0,
    issues,
    suggestion: clampPlacement(p),
  };
}

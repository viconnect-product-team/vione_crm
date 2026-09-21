// BC-Mobile-4A — auto-capture heuristics for the live card viewfinder.
//
// Deterministic, pure image analysis on a downscaled grayscale sample of the
// viewfinder region. No ML, no network, no persistence: the numbers below only
// decide whether the on-screen frame looks like a readable, steady card.

export type CardFrameReason = "dark" | "glare" | "blurry" | "empty" | "motion" | "ok";

export type CardFrameAnalysis = {
  /** Mean luminance 0..255. */
  brightness: number;
  /** Luminance standard deviation — proxy for card-vs-background contrast. */
  contrast: number;
  /** Mean absolute gradient — proxy for text sharpness. */
  sharpness: number;
  /** Mean absolute luminance delta vs the previous sample (0 when first). */
  motion: number;
  /** True when every gate passes for this single frame. */
  ok: boolean;
  reason: CardFrameReason;
};

export const CARD_FRAME_GATES = {
  minBrightness: 55,
  maxBrightness: 232,
  minContrast: 26,
  minSharpness: 9,
  maxMotion: 7,
} as const;

/** Consecutive passing frames required before an automatic shot is taken. */
export const AUTO_CAPTURE_STABLE_FRAMES = 8;

/** Convert RGBA pixels to a grayscale array (values 0..255). */
export function toGrayscale(data: Uint8ClampedArray): Uint8Array {
  const out = new Uint8Array(data.length / 4);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    out[p] = (data[i]! * 299 + data[i + 1]! * 587 + data[i + 2]! * 114) / 1000;
  }
  return out;
}

/**
 * Analyse one grayscale sample of the viewfinder region.
 * `previous` (same dimensions) enables the motion gate.
 */
export function analyzeCardFrame(
  gray: Uint8Array,
  width: number,
  height: number,
  previous?: Uint8Array | null,
): CardFrameAnalysis {
  const n = gray.length;
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += gray[i]!;
  const brightness = sum / n;

  let variance = 0;
  for (let i = 0; i < n; i += 1) {
    const d = gray[i]! - brightness;
    variance += d * d;
  }
  const contrast = Math.sqrt(variance / n);

  let gradSum = 0;
  let gradCount = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      gradSum += Math.abs(gray[i]! - gray[i + 1]!) + Math.abs(gray[i]! - gray[i + width]!);
      gradCount += 2;
    }
  }
  const sharpness = gradCount > 0 ? gradSum / gradCount : 0;

  let motion = 0;
  if (previous && previous.length === n) {
    let diff = 0;
    for (let i = 0; i < n; i += 1) diff += Math.abs(gray[i]! - previous[i]!);
    motion = diff / n;
  }

  const g = CARD_FRAME_GATES;
  let reason: CardFrameReason = "ok";
  if (brightness < g.minBrightness) reason = "dark";
  else if (brightness > g.maxBrightness) reason = "glare";
  else if (contrast < g.minContrast) reason = "empty";
  else if (sharpness < g.minSharpness) reason = "blurry";
  else if (motion > g.maxMotion) reason = "motion";

  return { brightness, contrast, sharpness, motion, ok: reason === "ok", reason };
}

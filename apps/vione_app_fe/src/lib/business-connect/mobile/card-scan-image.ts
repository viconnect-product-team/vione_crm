// BC-Mobile-4A — card image pipeline (client).
//
// Adapter of the BC-Mobile-2E moment-image pipeline with OCR-specific limits.
// Canvas re-encode strips ALL EXIF metadata (including GPS) by construction —
// OCR never sees device model, location, or original capture identity. SVG is
// rejected (scriptable); HEIC/HEIF fail truthfully at decode. Exactly ONE
// image per scan attempt — provenance stays unambiguous.

export const CARD_SCAN_ACCEPT = "image/jpeg,image/png,image/webp";
export const CARD_SCAN_SOURCE_MAX_BYTES = 12 * 1024 * 1024; // 12MB source ceiling
export const CARD_SCAN_MAX_EDGE = 2048; // practical OCR resolution, not raw 48MP
export const CARD_SCAN_TARGET_BYTES = 2 * 1024 * 1024; // soft target for upload
export const CARD_SCAN_MIME = "image/jpeg";

const SUPPORTED = new Set(["image/jpeg", "image/png", "image/webp"]);

export type CardScanImageErrorCode = "unsupported_type" | "too_large" | "decode_failed";

export function validateCardScanImageFile(file: {
  type: string;
  size: number;
}): CardScanImageErrorCode | null {
  if (!SUPPORTED.has(file.type)) return "unsupported_type";
  if (file.size <= 0) return "decode_failed";
  if (file.size > CARD_SCAN_SOURCE_MAX_BYTES) return "too_large";
  return null;
}

export function cardScanTargetSize(
  width: number,
  height: number,
): { width: number; height: number } {
  const edge = Math.max(width, height);
  if (edge <= CARD_SCAN_MAX_EDGE) return { width, height };
  const scale = CARD_SCAN_MAX_EDGE / edge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export type CardScanImageProcessed = {
  /** JPEG data URL — the ONLY form the server accepts. */
  dataUrl: string;
  width: number;
  height: number;
  /** Approximate binary bytes of the processed image. */
  bytes: number;
};

/**
 * Decodes (respecting EXIF orientation), bounds the longest edge, and
 * re-encodes to JPEG data URL. The canvas re-encode drops every EXIF block —
 * privacy without a metadata parser. Quality steps down toward the soft byte
 * target but never hard-fails a legitimate photo.
 */
export async function processCardScanImage(
  file: File,
): Promise<
  { ok: true; image: CardScanImageProcessed } | { ok: false; error: CardScanImageErrorCode }
> {
  const invalid = validateCardScanImageFile(file);
  if (invalid) return { ok: false, error: invalid };

  let source: ImageBitmap | HTMLImageElement | null = null;
  let sourceWidth = 0;
  let sourceHeight = 0;
  let cleanup = () => {};

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      source = bitmap;
      sourceWidth = bitmap.width;
      sourceHeight = bitmap.height;
      cleanup = () => bitmap.close?.();
    } catch {
      try {
        const bitmap = await createImageBitmap(file);
        source = bitmap;
        sourceWidth = bitmap.width;
        sourceHeight = bitmap.height;
        cleanup = () => bitmap.close?.();
      } catch {
        source = null;
      }
    }
  }

  if (!source) {
    try {
      const url = URL.createObjectURL(file);
      cleanup = () => URL.revokeObjectURL(url);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = url;
      });
      source = img;
      sourceWidth = img.naturalWidth || img.width;
      sourceHeight = img.naturalHeight || img.height;
    } catch {
      cleanup();
      return { ok: false, error: "decode_failed" };
    }
  }

  const { width, height } = cardScanTargetSize(sourceWidth, sourceHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    cleanup();
    return { ok: false, error: "decode_failed" };
  }
  ctx.drawImage(source, 0, 0, width, height);
  cleanup();

  for (const quality of [0.85, 0.78, 0.7, 0.62]) {
    const dataUrl = canvas.toDataURL(CARD_SCAN_MIME, quality);
    if (!dataUrl.startsWith("data:image/jpeg")) return { ok: false, error: "decode_failed" };
    const bytes = Math.round(dataUrl.length * 0.75);
    if (bytes <= CARD_SCAN_TARGET_BYTES || quality === 0.62) {
      return { ok: true, image: { dataUrl, width, height, bytes } };
    }
  }
  return { ok: false, error: "decode_failed" };
}

export type CardScanCropRect = { x: number; y: number; width: number; height: number };

/**
 * Crops an already-processed card image (normalized rect) and re-encodes it
 * through the same JPEG pipeline. Stays fully client-side and EXIF-free.
 */
export async function cropCardScanImage(
  dataUrl: string,
  rect: CardScanCropRect,
): Promise<
  { ok: true; image: CardScanImageProcessed } | { ok: false; error: CardScanImageErrorCode }
> {
  let bitmap: ImageBitmap;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    return { ok: false, error: "decode_failed" };
  }

  const sx = Math.max(0, Math.round(rect.x * bitmap.width));
  const sy = Math.max(0, Math.round(rect.y * bitmap.height));
  const sw = Math.max(1, Math.min(bitmap.width - sx, Math.round(rect.width * bitmap.width)));
  const sh = Math.max(1, Math.min(bitmap.height - sy, Math.round(rect.height * bitmap.height)));
  const { width, height } = cardScanTargetSize(sw, sh);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { ok: false, error: "decode_failed" };
  }
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.85, 0.78, 0.7, 0.62]) {
    const out = canvas.toDataURL(CARD_SCAN_MIME, quality);
    if (!out.startsWith("data:image/jpeg")) return { ok: false, error: "decode_failed" };
    const bytes = Math.round(out.length * 0.75);
    if (bytes <= CARD_SCAN_TARGET_BYTES || quality === 0.62) {
      return { ok: true, image: { dataUrl: out, width, height, bytes } };
    }
  }
  return { ok: false, error: "decode_failed" };
}

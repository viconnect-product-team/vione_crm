// BC-Mobile-2E — Moment photo pipeline (client).
//
// Validation + compression for Moment photos. Canvas re-encode strips ALL
// EXIF metadata (including GPS) by construction — the only location data a
// Moment can hold is the explicit place_label the user typed. SVG is
// rejected (scriptable), HEIC/HEIF fail truthfully at decode (no fake
// support claim). Pure validators are exported for tests.

export const MOMENT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const MOMENT_IMAGE_SOURCE_MAX_BYTES = 20 * 1024 * 1024;
export const MOMENT_IMAGE_MAX_EDGE = 2048;
export const MOMENT_IMAGE_TARGET_BYTES = 2 * 1024 * 1024; // soft target
export const MOMENT_IMAGE_MIME = "image/jpeg";

const SUPPORTED = new Set(["image/jpeg", "image/png", "image/webp"]);

export type MomentImageErrorCode = "unsupported_type" | "too_large" | "decode_failed";

export function validateMomentImageFile(file: {
  type: string;
  size: number;
}): MomentImageErrorCode | null {
  if (!SUPPORTED.has(file.type)) return "unsupported_type";
  if (file.size <= 0) return "decode_failed";
  if (file.size > MOMENT_IMAGE_SOURCE_MAX_BYTES) return "too_large";
  return null;
}

export function momentImageTargetSize(
  width: number,
  height: number,
): { width: number; height: number } {
  const edge = Math.max(width, height);
  if (edge <= MOMENT_IMAGE_MAX_EDGE) return { width, height };
  const scale = MOMENT_IMAGE_MAX_EDGE / edge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export type MomentImageProcessed = {
  blob: Blob;
  width: number;
  height: number;
};

/**
 * Decodes, respects EXIF orientation, bounds the longest edge, and
 * re-encodes to JPEG. The canvas re-encode drops every EXIF block —
 * privacy without a metadata parser. Quality steps down toward the soft
 * byte target but never hard-fails a legitimate photo.
 */
export async function processMomentImage(
  file: File,
): Promise<{ ok: true; image: MomentImageProcessed } | { ok: false; error: MomentImageErrorCode }> {
  const invalid = validateMomentImageFile(file);
  if (invalid) return { ok: false, error: invalid };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { ok: false, error: "decode_failed" };
  }

  const { width, height } = momentImageTargetSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { ok: false, error: "decode_failed" };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.85, 0.78, 0.7, 0.62]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, MOMENT_IMAGE_MIME, quality),
    );
    if (!blob) return { ok: false, error: "decode_failed" };
    if (blob.size <= MOMENT_IMAGE_TARGET_BYTES || quality === 0.62) {
      return { ok: true, image: { blob, width, height } };
    }
  }
  return { ok: false, error: "decode_failed" };
}

export type MomentCropRect = { x: number; y: number; width: number; height: number };

/**
 * Crops an already-processed Moment photo to a normalized rect (0..1 of the
 * source image) and re-encodes to JPEG through the same canvas pipeline, so
 * the output stays EXIF-free and bounded like every other Moment photo.
 */
export async function cropMomentImage(
  source: Blob,
  rect: MomentCropRect,
): Promise<{ ok: true; image: MomentImageProcessed } | { ok: false; error: MomentImageErrorCode }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  } catch {
    return { ok: false, error: "decode_failed" };
  }

  const sx = Math.max(0, Math.round(rect.x * bitmap.width));
  const sy = Math.max(0, Math.round(rect.y * bitmap.height));
  const sw = Math.max(1, Math.min(bitmap.width - sx, Math.round(rect.width * bitmap.width)));
  const sh = Math.max(1, Math.min(bitmap.height - sy, Math.round(rect.height * bitmap.height)));
  const { width, height } = momentImageTargetSize(sw, sh);

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
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, MOMENT_IMAGE_MIME, quality),
    );
    if (!blob) return { ok: false, error: "decode_failed" };
    if (blob.size <= MOMENT_IMAGE_TARGET_BYTES || quality === 0.62) {
      return { ok: true, image: { blob, width, height } };
    }
  }
  return { ok: false, error: "decode_failed" };
}

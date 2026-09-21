import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";
import { BrowserQRCodeReader, HTMLCanvasElementLuminanceSource } from "@zxing/browser";

interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

// Cached singletons for high performance
let cachedBrowserReader: BrowserQRCodeReader | null = null;
function getBrowserReader(): BrowserQRCodeReader {
  if (!cachedBrowserReader) {
    cachedBrowserReader = new BrowserQRCodeReader();
  }
  return cachedBrowserReader;
}

let cachedZxingReader: MultiFormatReader | null = null;
function getZxingReader(): MultiFormatReader {
  if (!cachedZxingReader) {
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    const reader = new MultiFormatReader();
    reader.setHints(hints);
    cachedZxingReader = reader;
  }
  return cachedZxingReader;
}

/**
 * High-reliability QR decoder for static images (photos taken by camera, gallery uploads, screenshots).
 * Resolves the issue where high-res 12MP-50MP raw camera images fail on standard web ZXing.
 */
export async function decodeQrFromImage(
  source: File | Blob | HTMLImageElement | HTMLCanvasElement | string,
): Promise<string | null> {
  try {
    let img: HTMLImageElement | null = null;
    let cleanupUrl: string | null = null;

    if (typeof source === "string") {
      img = new Image();
      img.crossOrigin = "anonymous";
      img.src = source;
      await new Promise<void>((resolve, reject) => {
        img!.onload = () => resolve();
        img!.onerror = () => reject(new Error("Failed to load image"));
      });
    } else if (source instanceof HTMLImageElement) {
      img = source;
      if (!img.complete || img.naturalWidth === 0) {
        await new Promise<void>((resolve, reject) => {
          img!.onload = () => resolve();
          img!.onerror = () => reject(new Error("Failed to load image element"));
        });
      }
    } else if (source instanceof HTMLCanvasElement) {
      return decodeFromCanvas(source);
    } else {
      // File or Blob
      const url = URL.createObjectURL(source);
      cleanupUrl = url;
      img = new Image();
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img!.onload = () => resolve();
        img!.onerror = () => reject(new Error("Failed to load blob image"));
      });
    }

    try {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      if (origW === 0 || origH === 0) return null;

      // 1. Try Native BarcodeDetector on raw image first (very fast if supported)
      const NativeDetector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
      if (NativeDetector) {
        try {
          const detector = new NativeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(img);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            return barcodes[0].rawValue;
          }
        } catch {
          /* continue to multi-pass canvas decoding */
        }
      }

      // Multi-scale targets: 1000px, 600px, 1500px, 400px
      const targetScales = [1000, 600, 1500, 400];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;

      for (const maxDim of targetScales) {
        const scale = Math.min(1, maxDim / Math.max(origW, origH));
        const w = Math.max(1, Math.round(origW * scale));
        const h = Math.max(1, Math.round(origH * scale));

        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        // Pass 1: Standard color frame
        const res1 = await decodeFromCanvas(canvas);
        if (res1) return res1;

        // Pass 2: Grayscale + Contrast Stretch
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const len = data.length;

        for (let i = 0; i < len; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = (r * 77 + g * 150 + b * 29) >> 8;
          const contrastGray = gray < 110 ? Math.max(0, gray - 30) : Math.min(255, gray + 30);
          data[i] = contrastGray;
          data[i + 1] = contrastGray;
          data[i + 2] = contrastGray;
        }
        ctx.putImageData(imgData, 0, 0);

        const res2 = await decodeFromCanvas(canvas);
        if (res2) return res2;

        // Pass 3: Inverted colors (for Dark-Mode / Light-on-dark QR codes)
        for (let i = 0; i < len; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
        ctx.putImageData(imgData, 0, 0);

        const res3 = await decodeFromCanvas(canvas);
        if (res3) return res3;

        // Pass 4: Quadrant & Region Crops for Business Cards (bottom-right, bottom-left, top-right, center)
        const regions = [
          // Bottom-Right (Most common business card QR location)
          { sx: origW * 0.45, sy: origH * 0.45, sw: origW * 0.55, sh: origH * 0.55 },
          // Bottom-Left
          { sx: 0, sy: origH * 0.45, sw: origW * 0.55, sh: origH * 0.55 },
          // Top-Right
          { sx: origW * 0.45, sy: 0, sw: origW * 0.55, sh: origH * 0.55 },
          // Center 60%
          { sx: origW * 0.2, sy: origH * 0.2, sw: origW * 0.6, sh: origH * 0.6 },
        ];

        for (const reg of regions) {
          const regW = Math.min(600, Math.round(reg.sw));
          const regH = Math.min(600, Math.round(reg.sh));
          const cropCanvas = document.createElement("canvas");
          cropCanvas.width = regW;
          cropCanvas.height = regH;
          const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });
          if (cropCtx) {
            cropCtx.drawImage(img, reg.sx, reg.sy, reg.sw, reg.sh, 0, 0, regW, regH);
            const resCrop = await decodeFromCanvas(cropCanvas);
            if (resCrop) return resCrop;
          }
        }
      }
    } finally {
      if (cleanupUrl) {
        URL.revokeObjectURL(cleanupUrl);
      }
    }
  } catch (err) {
    console.warn("[decodeQrFromImage] Decode exception:", err);
  }
  return null;
}

/**
 * Decodes a single canvas using BarcodeDetector, BrowserQRCodeReader and ZXing MultiFormatReader
 */
export async function decodeFromCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  // 1. Hardware BarcodeDetector
  const NativeDetector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  if (NativeDetector) {
    try {
      const detector = new NativeDetector({ formats: ["qr_code"] });
      const codes = await detector.detect(canvas);
      if (codes.length > 0 && codes[0].rawValue) {
        return codes[0].rawValue;
      }
    } catch {
      /* continue to BrowserQRCodeReader */
    }
  }

  // 2. BrowserQRCodeReader from @zxing/browser
  try {
    const browserReader = getBrowserReader();
    const result = await browserReader.decodeFromCanvas(canvas);
    if (result && result.getText()) {
      return result.getText();
    }
  } catch {
    /* continue to ZXing library fallback */
  }

  // 3. Fallback: ZXing library with HTMLCanvasElementLuminanceSource
  try {
    const lumSource = new HTMLCanvasElementLuminanceSource(canvas);
    const binarizer = new HybridBinarizer(lumSource);
    const bitmap = new BinaryBitmap(binarizer);
    const reader = getZxingReader();
    const result = reader.decode(bitmap);
    if (result && result.getText()) {
      return result.getText();
    }
  } catch {
    /* not detected */
  }

  return null;
}


// High-resolution QR export helpers for print & share.
// - PNG: rendered off-screen at `pixelSize` (default 1024) with a generous
//   quiet zone so it stays crisp when scaled up on posters / name tags.
// - SVG: vector output — infinitely scalable for print (business cards,
//   banners, large-format).
//
// Both variants respect the current builder state:
//   • background = white | template color | fully transparent
//   • centered logo with configurable scale + X/Y offset
// so downloads visually match the live QrCanvas preview.
import QRCode from "qrcode";

export type QrExportOpts = {
  /** URL / text to encode. */
  value: string;
  /** File basename without extension. */
  filename: string;
  /** Foreground module color. */
  dark?: string;
  /** Background color. Ignored when `transparent` is true. */
  light?: string;
  /** Render background as fully transparent (PNG alpha / SVG no rect). */
  transparent?: boolean;
  /** Quiet-zone size in modules. Higher = safer for scanning after resizing. */
  margin?: number;
  /** PNG pixel size (square). Default 1024 for print. */
  pixelSize?: number;
  /** Optional centered logo (URL or data URI). */
  logoUrl?: string | null;
  /** Logo diameter as a fraction of the QR size (0.14–0.30). */
  logoScale?: number;
  /** Horizontal logo offset as a fraction of QR size (-0.25 to 0.25). */
  logoOffsetX?: number;
  /** Vertical logo offset as a fraction of QR size (-0.25 to 0.25). */
  logoOffsetY?: number;
  /** Solid badge color behind the logo (keeps it readable on any QR). */
  logoBg?: string;
};

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function clampLogo(o: QrExportOpts) {
  const scale = Math.min(0.3, Math.max(0.14, o.logoScale ?? 0.22));
  const ox = Math.min(0.25, Math.max(-0.25, o.logoOffsetX ?? 0));
  const oy = Math.min(0.25, Math.max(-0.25, o.logoOffsetY ?? 0));
  return { scale, ox, oy };
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("logo-load-failed"));
    img.src = src;
  });
}

/** Renders the QR to a large PNG data URL and triggers a download. */
export async function downloadQrPng(opts: QrExportOpts): Promise<void> {
  const {
    value,
    filename,
    dark = "#0a1834",
    light = "#ffffff",
    transparent = false,
    margin = 4,
    pixelSize = 1024,
    logoUrl,
    logoBg = "#ffffff",
  } = opts;

  const canvas = document.createElement("canvas");
  canvas.width = pixelSize;
  canvas.height = pixelSize;
  await QRCode.toCanvas(canvas, value, {
    errorCorrectionLevel: "H",
    margin,
    width: pixelSize,
    color: { dark, light: transparent ? "#00000000" : light },
  });

  if (logoUrl) {
    try {
      const img = await loadImage(logoUrl);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const { scale, ox, oy } = clampLogo(opts);
        const badge = Math.round(pixelSize * scale);
        const pad = Math.round(badge * 0.12);
        const cx = pixelSize / 2 + pixelSize * ox;
        const cy = pixelSize / 2 + pixelSize * oy;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, badge / 2 + pad, 0, Math.PI * 2);
        ctx.fillStyle = logoBg;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, badge / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, cx - badge / 2, cy - badge / 2, badge, badge);
        ctx.restore();
      }
    } catch {
      /* logo failed — export plain QR */
    }
  }

  triggerDownload(canvas.toDataURL("image/png"), `${filename}.png`);
}

async function fetchAsDataUri(url: string): Promise<string | null> {
  try {
    if (url.startsWith("data:")) return url;
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("read-failed"));
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Renders the QR to a vector SVG blob and triggers a download. */
export async function downloadQrSvg(opts: QrExportOpts): Promise<void> {
  const {
    value,
    filename,
    dark = "#0a1834",
    light = "#ffffff",
    transparent = false,
    margin = 4,
    logoUrl,
    logoBg = "#ffffff",
  } = opts;

  let svg = await QRCode.toString(value, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin,
    color: { dark, light: transparent ? "#ffffff" : light },
  });

  // Drop the background rect for transparent exports (qrcode always emits one).
  if (transparent) {
    svg = svg.replace(
      /<rect[^/]*fill="#ffffff"[^/]*\/>/i,
      '<rect width="100%" height="100%" fill="none"/>',
    );
  }

  if (logoUrl) {
    const dataUri = await fetchAsDataUri(logoUrl);
    if (dataUri) {
      // qrcode emits `viewBox="0 0 N N"` — parse N to place the logo in QR units.
      const vb = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) \1"/);
      const size = vb ? Number(vb[1]) : 0;
      if (size > 0) {
        const { scale, ox, oy } = clampLogo(opts);
        const badge = size * scale;
        const pad = badge * 0.12;
        const cx = size / 2 + size * ox;
        const cy = size / 2 + size * oy;
        const clipId = `qr-logo-clip-${Math.random().toString(36).slice(2, 8)}`;
        const overlay =
          `<defs><clipPath id="${clipId}">` +
          `<circle cx="${cx}" cy="${cy}" r="${badge / 2}"/></clipPath></defs>` +
          `<circle cx="${cx}" cy="${cy}" r="${badge / 2 + pad}" fill="${logoBg}"/>` +
          `<image href="${dataUri}" x="${cx - badge / 2}" y="${cy - badge / 2}" ` +
          `width="${badge}" height="${badge}" clip-path="url(#${clipId})" ` +
          `preserveAspectRatio="xMidYMid slice"/>`;
        svg = svg.replace(/<\/svg>\s*$/, `${overlay}</svg>`);
      }
    }
  }

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  try {
    triggerDownload(href, `${filename}.svg`);
  } finally {
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
}

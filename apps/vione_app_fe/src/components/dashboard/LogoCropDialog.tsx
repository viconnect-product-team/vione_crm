import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Square, X } from "lucide-react";
import { useT } from "@/lib/i18n";

const VIEW = 280;
const OUTPUT = 512;

type Shape = "square" | "round";

interface Props {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File, previewUrl: string) => void;
}

export function LogoCropDialog({ file, onCancel, onConfirm }: Props) {
  const t = useT();
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [shape, setShape] = useState<Shape>("square");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const image = new Image();
    image.onload = () => {
      const bs = Math.max(VIEW / image.naturalWidth, VIEW / image.naturalHeight);
      setBaseScale(bs);
      setImg(image);
      setOffset({ x: 0, y: 0 });
      setZoom(1);
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const scale = baseScale * zoom;

  const clamp = useCallback(
    (o: { x: number; y: number }) => {
      if (!img) return o;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const maxX = Math.max(0, (w - VIEW) / 2);
      const maxY = Math.max(0, (h - VIEW) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, o.x)),
        y: Math.min(maxY, Math.max(-maxY, o.y)),
      };
    },
    [img, scale],
  );

  useEffect(() => {
    setOffset((o) => clamp(o));
  }, [clamp]);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setOffset(
      clamp({
        x: drag.current.ox + (e.clientX - drag.current.x),
        y: drag.current.oy + (e.clientY - drag.current.y),
      }),
    );
  }
  function onPointerUp() {
    drag.current = null;
  }

  function handleConfirm() {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = OUTPUT / VIEW;
    if (shape === "round") {
      ctx.beginPath();
      ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    const dw = img.naturalWidth * scale * ratio;
    const dh = img.naturalHeight * scale * ratio;
    const dx = OUTPUT / 2 - dw / 2 + offset.x * ratio;
    const dy = OUTPUT / 2 - dh / 2 + offset.y * ratio;
    ctx.drawImage(img, dx, dy, dw, dh);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const out = new File([blob], "logo.png", { type: "image/png" });
      onConfirm(out, URL.createObjectURL(blob));
    }, "image/png");
  }

  const imgStyle: React.CSSProperties = img
    ? {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: img.naturalWidth * scale,
        height: img.naturalHeight * scale,
        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
        maxWidth: "none",
      }
    : {};

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{t("set.org.logoCropTitle")}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{t("set.org.logoCropDesc")}</p>

        <div className="mx-auto mb-4" style={{ width: VIEW }}>
          <div
            className="relative touch-none select-none overflow-hidden bg-muted"
            style={{
              width: VIEW,
              height: VIEW,
              borderRadius: shape === "round" ? "50%" : "0.75rem",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {src && <img src={src} alt="" style={imgStyle} draggable={false} />}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{t("set.org.logoZoom")}</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
        </div>

        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() => setShape("square")}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
              shape === "square"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            <Square className="h-4 w-4" />
            {t("set.org.logoShapeSquare")}
          </button>
          <button
            type="button"
            onClick={() => setShape("round")}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
              shape === "round"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            <Circle className="h-4 w-4" />
            {t("set.org.logoShapeRound")}
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            {t("set.org.logoCropCancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {t("set.org.logoCropConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

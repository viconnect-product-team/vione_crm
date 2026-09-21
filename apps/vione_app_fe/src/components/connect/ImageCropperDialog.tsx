// Simple rectangular image cropper. User drags to draw a selection, or drags
// the existing box/handles to adjust. Returns a cropped JPEG data URL sized
// to the natural pixels of the source image (respecting the source resolution
// used for AI analysis, which is already downscaled to ≤1600px).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crop, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";

type Rect = { x: number; y: number; w: number; h: number };
type Mode =
  | { kind: "idle" }
  | { kind: "draw"; startX: number; startY: number }
  | { kind: "move"; startX: number; startY: number; origin: Rect }
  | {
      kind: "resize";
      handle: "nw" | "ne" | "sw" | "se";
      origin: Rect;
    };

const MIN = 0.05; // 5% of image

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageUrl,
  onConfirm,
  busy,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  imageUrl: string | null;
  onConfirm: (croppedDataUrl: string) => void | Promise<void>;
  busy?: boolean;
}) {
  const t = useT();
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [rect, setRect] = useState<Rect | null>(null); // in normalized 0..1
  const [mode, setMode] = useState<Mode>({ kind: "idle" });

  // Reset selection whenever a new image is loaded
  useEffect(() => {
    if (open) setRect(null);
  }, [open, imageUrl]);

  const toLocal = useCallback((e: React.PointerEvent) => {
    const el = boxRef.current;
    if (!el) return { nx: 0, ny: 0 };
    const r = el.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    return { nx, ny };
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (busy) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { nx, ny } = toLocal(e);
    setMode({ kind: "draw", startX: nx, startY: ny });
    setRect({ x: nx, y: ny, w: 0, h: 0 });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (mode.kind === "idle") return;
    const { nx, ny } = toLocal(e);
    if (mode.kind === "draw") {
      const x = Math.min(mode.startX, nx);
      const y = Math.min(mode.startY, ny);
      const w = Math.abs(nx - mode.startX);
      const h = Math.abs(ny - mode.startY);
      setRect({ x, y, w, h });
    } else if (mode.kind === "move" && rect) {
      const dx = nx - mode.startX;
      const dy = ny - mode.startY;
      const x = Math.min(1 - mode.origin.w, Math.max(0, mode.origin.x + dx));
      const y = Math.min(1 - mode.origin.h, Math.max(0, mode.origin.y + dy));
      setRect({ ...mode.origin, x, y });
    } else if (mode.kind === "resize" && rect) {
      const o = mode.origin;
      let x1 = o.x;
      let y1 = o.y;
      let x2 = o.x + o.w;
      let y2 = o.y + o.h;
      if (mode.handle.includes("w")) x1 = Math.min(nx, x2 - MIN);
      if (mode.handle.includes("e")) x2 = Math.max(nx, x1 + MIN);
      if (mode.handle.includes("n")) y1 = Math.min(ny, y2 - MIN);
      if (mode.handle.includes("s")) y2 = Math.max(ny, y1 + MIN);
      setRect({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
    }
  }

  function onPointerUp() {
    if (mode.kind === "draw" && rect) {
      // enforce minimum size
      if (rect.w < MIN || rect.h < MIN) setRect(null);
    }
    setMode({ kind: "idle" });
  }

  function startMove(e: React.PointerEvent) {
    if (!rect || busy) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { nx, ny } = toLocal(e);
    setMode({ kind: "move", startX: nx, startY: ny, origin: rect });
  }

  function startResize(e: React.PointerEvent, handle: "nw" | "ne" | "sw" | "se") {
    if (!rect || busy) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setMode({ kind: "resize", handle, origin: rect });
  }

  const canApply = !!rect && rect.w >= MIN && rect.h >= MIN && !busy;

  async function apply() {
    const img = imgRef.current;
    if (!img || !rect) return;
    const nat = { w: img.naturalWidth, h: img.naturalHeight };
    const sx = Math.round(rect.x * nat.w);
    const sy = Math.round(rect.y * nat.h);
    const sw = Math.max(1, Math.round(rect.w * nat.w));
    const sh = Math.max(1, Math.round(rect.h * nat.h));
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    await onConfirm(dataUrl);
  }

  const overlayStyle = useMemo(() => {
    if (!rect) return null;
    return {
      left: `${rect.x * 100}%`,
      top: `${rect.y * 100}%`,
      width: `${rect.w * 100}%`,
      height: `${rect.h * 100}%`,
    } as const;
  }, [rect]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="size-4 text-primary" />
            {t("connect.ai.import.crop.title")}
          </DialogTitle>
          <DialogDescription>{t("connect.ai.import.crop.desc")}</DialogDescription>
        </DialogHeader>

        {imageUrl && (
          <div className="relative select-none overflow-hidden rounded-lg border border-border bg-muted/20">
            <div
              ref={boxRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative touch-none"
              style={{ cursor: busy ? "not-allowed" : "crosshair" }}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt=""
                draggable={false}
                className="pointer-events-none block max-h-[60vh] w-full object-contain"
              />
              {rect && overlayStyle && (
                <>
                  {/* dimmed backdrop */}
                  <div className="pointer-events-none absolute inset-0 bg-background/50" />
                  {/* selection */}
                  <div
                    className="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
                    style={overlayStyle}
                    onPointerDown={startMove}
                  >
                    {(["nw", "ne", "sw", "se"] as const).map((h) => (
                      <span
                        key={h}
                        onPointerDown={(e) => startResize(e, h)}
                        className={`absolute h-3 w-3 rounded-sm border border-primary bg-background ${
                          h === "nw"
                            ? "-left-1.5 -top-1.5 cursor-nw-resize"
                            : h === "ne"
                              ? "-right-1.5 -top-1.5 cursor-ne-resize"
                              : h === "sw"
                                ? "-bottom-1.5 -left-1.5 cursor-sw-resize"
                                : "-bottom-1.5 -right-1.5 cursor-se-resize"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {rect ? t("connect.ai.import.crop.hintSelected") : t("connect.ai.import.crop.hintEmpty")}
        </p>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setRect(null)} disabled={!rect || busy}>
            <RotateCcw className="size-4" />
            {t("connect.ai.import.crop.clear")}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button onClick={apply} disabled={!canApply}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Crop className="size-4" />}
            {busy ? t("connect.ai.import.crop.applying") : t("connect.ai.import.crop.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

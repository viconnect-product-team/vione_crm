// BC-Mobile-4A — pre-OCR crop step. Purely client-side framing: the user
// drags/resizes a crop box over the already-processed photo, then applying
// re-encodes through cropCardScanImage (canvas → JPEG, EXIF-free).

import { useEffect, useRef, useState } from "react";
import { Check, Crop as CropIcon, RotateCcw, X } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import {
  cropCardScanImage,
  type CardScanCropRect,
  type CardScanImageProcessed,
} from "@/lib/business-connect/mobile/card-scan-image";

type AspectKey = "free" | "card";
const ASPECTS: { key: AspectKey; ratio: number | null }[] = [
  { key: "free", ratio: null },
  { key: "card", ratio: 85.6 / 53.98 },
];

const MIN = 0.12;
const DEFAULT_RECT: CardScanCropRect = { x: 0.05, y: 0.15, width: 0.9, height: 0.7 };
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

type Handle = "move" | "nw" | "ne" | "sw" | "se";

export function BusinessCardCropper({
  image,
  onCancel,
  onApply,
}: {
  image: CardScanImageProcessed;
  onCancel: () => void;
  onApply: (cropped: CardScanImageProcessed) => void;
}) {
  const t = useT();
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    rect: CardScanCropRect;
    bounds: DOMRect | null;
  } | null>(null);
  const [aspectKey, setAspectKey] = useState<AspectKey>("free");
  const [rect, setRect] = useState<CardScanCropRect>(DEFAULT_RECT);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  function applyAspect(key: AspectKey) {
    setAspectKey(key);
    const ratio = ASPECTS.find((a) => a.key === key)?.ratio ?? null;
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!ratio || !bounds || bounds.width === 0 || bounds.height === 0) return;
    let w = rect.width;
    let h = (w * bounds.width) / ratio / bounds.height;
    if (h > 1) {
      h = 1;
      w = (h * bounds.height * ratio) / bounds.width;
    }
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    setRect({
      x: clamp01(Math.min(1 - w, Math.max(0, cx - w / 2))),
      y: clamp01(Math.min(1 - h, Math.max(0, cy - h / 2))),
      width: w,
      height: h,
    });
  }

  useEffect(() => {
    // Pointer moves fire far faster than the display refresh. We cache the
    // frame bounds at drag start (reading them per move forces a layout
    // reflow) and coalesce state updates into one requestAnimationFrame tick,
    // so dragging stays at 60fps on iOS Safari.
    let frameId = 0;
    let pending: { x: number; y: number } | null = null;

    function compute(clientX: number, clientY: number) {
      const drag = dragRef.current;
      if (!drag) return;
      const bounds = drag.bounds;
      if (!bounds || bounds.width === 0 || bounds.height === 0) return;
      const dx = (clientX - drag.startX) / bounds.width;
      const dy = (clientY - drag.startY) / bounds.height;
      const r = drag.rect;
      const ratio = ASPECTS.find((a) => a.key === aspectKey)?.ratio ?? null;

      if (drag.handle === "move") {
        setRect({
          ...r,
          x: Math.min(1 - r.width, Math.max(0, r.x + dx)),
          y: Math.min(1 - r.height, Math.max(0, r.y + dy)),
        });
        return;
      }

      let { x, y, width, height } = r;
      if (drag.handle === "se" || drag.handle === "ne") width = r.width + dx;
      if (drag.handle === "sw" || drag.handle === "nw") {
        width = r.width - dx;
        x = r.x + dx;
      }
      if (drag.handle === "se" || drag.handle === "sw") height = r.height + dy;
      if (drag.handle === "ne" || drag.handle === "nw") {
        height = r.height - dy;
        y = r.y + dy;
      }
      width = Math.max(MIN, Math.min(1, width));
      height = Math.max(MIN, Math.min(1, height));
      if (ratio && bounds.width > 0 && bounds.height > 0) {
        height = (width * bounds.width) / ratio / bounds.height;
        if (height > 1) {
          height = 1;
          width = (height * bounds.height * ratio) / bounds.width;
        }
        if (drag.handle === "nw" || drag.handle === "ne") y = r.y + r.height - height;
        if (drag.handle === "nw" || drag.handle === "sw") x = r.x + r.width - width;
      }
      x = Math.min(1 - width, Math.max(0, x));
      y = Math.min(1 - height, Math.max(0, y));
      setRect({ x, y, width, height });
    }

    function flush() {
      frameId = 0;
      const next = pending;
      pending = null;
      if (next) compute(next.x, next.y);
    }

    function onMove(e: PointerEvent) {
      if (!dragRef.current) return;
      pending = { x: e.clientX, y: e.clientY };
      if (!frameId) frameId = requestAnimationFrame(flush);
    }
    function onUp() {
      dragRef.current = null;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      pending = null;
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [aspectKey]);

  function startDrag(handle: Handle, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      rect,
      bounds: frameRef.current?.getBoundingClientRect() ?? null,
    };
  }

  async function apply() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const result = await cropCardScanImage(image.dataUrl, rect);
    if (!result.ok) {
      setFailed(true);
      setBusy(false);
      return;
    }
    onApply(result.image);
  }

  const handleClass =
    "absolute h-8 w-8 rounded-full border-2 border-white bg-[var(--bc-mobile-gold,#c8a24a)]/90 shadow-md touch-none";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("bc.mobile.cardScan.crop.title")}
      tabIndex={-1}
      ref={(node) => node?.focus()}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) onCancel();
      }}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 outline-none"
    >
      <header className="flex items-center justify-between px-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label={t("bc.mobile.cardScan.crop.cancel")}
          className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
        >
          <X aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
        </button>
        <p className="text-[14px] font-medium text-white">{t("bc.mobile.cardScan.crop.title")}</p>
        <button
          type="button"
          onClick={() => void apply()}
          disabled={busy}
          aria-label={t("bc.mobile.cardScan.crop.apply")}
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
        >
          <Check aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        <div ref={frameRef} className="relative max-h-full max-w-full touch-none select-none">
          <img
            src={image.dataUrl}
            alt={t("bc.mobile.cardScan.crop.title")}
            draggable={false}
            className="max-h-[52vh] max-w-full rounded-xl object-contain"
          />
          <div
            role="presentation"
            onPointerDown={(e) => startDrag("move", e)}
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.width * 100}%`,
              height: `${rect.height * 100}%`,
            }}
            className="absolute cursor-move rounded-md border-2 border-white/95 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
          >
            <span
              className={`${handleClass} -left-4 -top-4`}
              onPointerDown={(e) => startDrag("nw", e)}
            />
            <span
              className={`${handleClass} -right-4 -top-4`}
              onPointerDown={(e) => startDrag("ne", e)}
            />
            <span
              className={`${handleClass} -bottom-4 -left-4`}
              onPointerDown={(e) => startDrag("sw", e)}
            />
            <span
              className={`${handleClass} -bottom-4 -right-4`}
              onPointerDown={(e) => startDrag("se", e)}
            />
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        <p className="mb-3 text-center text-[13px] text-white/70">
          {t("bc.mobile.cardScan.crop.hint")}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {ASPECTS.map((a: any) => (
            <button
              key={a.key}
              type="button"
              onClick={() => applyAspect(a.key)}
              disabled={busy}
              aria-pressed={aspectKey === a.key}
              className={`min-h-10 rounded-full px-4 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 ${
                aspectKey === a.key ? "bg-white text-black" : "bg-white/10 text-white"
              }`}
            >
              {t(`bc.mobile.cardScan.crop.aspect.${a.key}` as TKey)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setAspectKey("free");
              setRect(DEFAULT_RECT);
            }}
            disabled={busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-[13px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            {t("bc.mobile.cardScan.crop.reset")}
          </button>
        </div>
        {failed ? (
          <p role="alert" className="mt-3 text-center text-[13px] text-[#fca5a5]">
            {t("bc.mobile.cardScan.crop.error")}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void apply()}
          disabled={busy}
          className="bc-cta-gold mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold disabled:opacity-60"
        >
          <CropIcon aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={1.8} />
          {busy ? t("bc.mobile.cardScan.crop.applying") : t("bc.mobile.cardScan.crop.apply")}
        </button>
      </div>
    </div>
  );
}

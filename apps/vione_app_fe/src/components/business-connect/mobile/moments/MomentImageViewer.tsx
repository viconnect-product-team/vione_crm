import React, { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

export type MomentImageViewerProps = {
  open: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  authorName?: string;
  authorAvatar?: string | null;
  caption?: string | null;
  timeDisplay?: string | null;
};

export function MomentImageViewer({
  open,
  onClose,
  images,
  initialIndex = 0,
  authorName,
  authorAvatar,
  caption,
  timeDisplay,
}: MomentImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, initialIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, handlePrev, handleNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  if (!open || images.length === 0) return null;

  const currentImg = images[currentIndex] || images[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 text-white backdrop-blur-xl animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng xem ảnh"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 active:scale-95 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {images.length > 1 && (
          <div className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-slate-200 backdrop-blur-md">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        <div className="flex items-center gap-2">
          <a
            href={currentImg}
            target="_blank"
            rel="noopener noreferrer"
            download
            title="Tải ảnh gốc"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 active:scale-95 cursor-pointer"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex flex-1 items-center justify-center p-2 sm:p-6 overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={currentImg}
          src={currentImg}
          alt={caption || "Khoảnh khắc ViOne"}
          className="max-h-[82vh] max-w-full rounded-lg object-contain shadow-2xl animate-in zoom-in-95 duration-200"
        />

        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Ảnh trước"
            className="absolute left-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95 cursor-pointer hidden sm:grid"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Ảnh kế tiếp"
            className="absolute right-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95 cursor-pointer hidden sm:grid"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom Information / Caption Bar (Facebook style) */}
      {(authorName || caption) && (
        <div className="relative z-10 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <div className="max-w-xl mx-auto space-y-1.5">
            {authorName && (
              <div className="flex items-center gap-2.5">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="h-8 w-8 rounded-full object-cover border border-amber-400/40"
                  />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-800 text-xs font-bold text-amber-300 border border-amber-400/40">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">{authorName}</p>
                  {timeDisplay && (
                    <p className="text-[10px] text-slate-400">{timeDisplay}</p>
                  )}
                </div>
              </div>
            )}
            {caption && (
              <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed pt-1">
                {caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

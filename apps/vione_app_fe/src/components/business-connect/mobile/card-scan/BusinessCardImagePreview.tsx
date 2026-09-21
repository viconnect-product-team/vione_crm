// BC-Mobile-4A — pre-OCR image check. The user confirms the photo before the
// (metered) vision call runs: Nhận diện / Chụp lại / Chọn ảnh khác.

import { ScanSearch, Camera, ImagePlus, Crop as CropIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { CardScanImageProcessed } from "@/lib/business-connect/mobile/card-scan-image";

export function BusinessCardImagePreview({
  image,
  onRecognize,
  onRetake,
  onChooseOther,
  onCrop,
}: {
  image: CardScanImageProcessed;
  onRecognize: () => void;
  onRetake: () => void;
  onChooseOther: () => void;
  onCrop: () => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-1 flex-col px-6 pb-8">
      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]">
        <img
          src={image.dataUrl}
          alt={t("bc.mobile.cardScan.a11y.previewAlt")}
          width={image.width}
          height={image.height}
          className="h-auto w-full object-contain"
        />
      </div>

      <div className="mt-auto grid gap-3 pt-8">
        <button
          type="button"
          onClick={onRecognize}
          className="bc-cta-gold flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold"
        >
          <ScanSearch className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          {t("bc.mobile.cardScan.usePhoto")}
        </button>
        <button
          type="button"
          onClick={onCrop}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-6 text-[15px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] motion-reduce:transition-none"
        >
          <CropIcon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          {t("bc.mobile.cardScan.crop.cta")}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] motion-reduce:transition-none"
          >
            <Camera className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            {t("bc.mobile.cardScan.retake")}
          </button>
          <button
            type="button"
            onClick={onChooseOther}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] motion-reduce:transition-none"
          >
            <ImagePlus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            {t("bc.mobile.cardScan.chooseOther")}
          </button>
        </div>
      </div>
    </div>
  );
}

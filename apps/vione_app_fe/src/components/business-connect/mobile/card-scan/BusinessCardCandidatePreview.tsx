// BC-Mobile-4A — candidate preview. Feels like "Business Connect has read
// this card for you", not an OCR laboratory: identity first, small card
// thumbnail, textual confidence cues, truthful disabled continue (4B arrives
// next). There is intentionally NO functional "save to network" action.

import { forwardRef } from "react";
import { Camera, QrCode, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { BusinessCardCandidate } from "@/lib/business-connect/mobile/card-scan.types";
import type { CardScanImageProcessed } from "@/lib/business-connect/mobile/card-scan-image";
import { CandidateFieldDisplay } from "./CandidateFieldDisplay";

export const BusinessCardCandidatePreview = forwardRef<
  HTMLHeadingElement,
  {
    candidate: BusinessCardCandidate;
    image: CardScanImageProcessed;
    onRetake: () => void;
  }
>(function BusinessCardCandidatePreview({ candidate, image, onRetake }, headingRef) {
  const t = useT();
  const { fields } = candidate;
  return (
    <div className="flex flex-1 flex-col px-6 pb-8">
      <div className="mt-2 flex items-center gap-4">
        <img
          src={image.dataUrl}
          alt={t("bc.mobile.cardScan.a11y.previewAlt")}
          className="h-16 w-24 shrink-0 rounded-lg border border-[var(--bc-mobile-border)] object-cover"
        />
        <div className="min-w-0">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-[18px] font-semibold tracking-tight text-[var(--bc-mobile-text)] outline-none"
          >
            {t("bc.mobile.cardScan.review.title")}
          </h2>
          <p className="mt-0.5 text-[13px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.cardScan.review.subtitle")}
          </p>
        </div>
      </div>

      {candidate.warnings.includes("qr_present") ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 py-2.5 text-[13px] text-[var(--bc-mobile-muted)]">
          <QrCode className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
          {t("bc.mobile.cardScan.warning.qr")}
        </p>
      ) : null}

      <section
        aria-label={t("bc.mobile.cardScan.review.title")}
        className="mt-4 divide-y divide-[var(--bc-mobile-border)] rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4"
      >
        {fields.displayName ? (
          <div className="py-1">
            <CandidateFieldDisplay field={fields.displayName} />
          </div>
        ) : null}
        {fields.title ? <CandidateFieldDisplay field={fields.title} /> : null}
        {fields.companyName ? <CandidateFieldDisplay field={fields.companyName} /> : null}
        {fields.phones.map((p) => (
          <CandidateFieldDisplay key={`p:${p.value}`} field={p} />
        ))}
        {fields.emails.map((e: any) => (
          <CandidateFieldDisplay key={`e:${e.value}`} field={e} />
        ))}
        {fields.website ? <CandidateFieldDisplay field={fields.website} /> : null}
        {fields.address ? <CandidateFieldDisplay field={fields.address} /> : null}
      </section>

      <div className="mt-auto grid gap-3 pt-8">
        <div>
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-describedby="card-scan-continue-note"
            className="flex min-h-12 w-full cursor-default items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-text)] px-6 text-[15px] font-semibold text-[var(--bc-mobile-surface)] opacity-45"
          >
            {t("bc.mobile.cardScan.continue")}
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </button>
          <p
            id="card-scan-continue-note"
            className="mt-2 text-center text-[12px] text-[var(--bc-mobile-muted)]"
          >
            {t("bc.mobile.cardScan.continue.soon")}
          </p>
        </div>
        <button
          type="button"
          onClick={onRetake}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-6 text-[15px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] motion-reduce:transition-none"
        >
          <Camera className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          {t("bc.mobile.cardScan.retake")}
        </button>
      </div>
    </div>
  );
});

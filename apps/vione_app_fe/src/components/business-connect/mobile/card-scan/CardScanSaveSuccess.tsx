// BC-Mobile-4B — Save Success confirmation.
//
// Confirms the contact now lives in the owner's Network, with a deep link
// into the Person page (Journey included). Calm, no confetti.

import { forwardRef } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ScanLine, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { ScanSaveResultKind } from "@/lib/business-connect/mobile/card-scan.review";

export const CardScanSaveSuccess = forwardRef<
  HTMLHeadingElement,
  {
    result: ScanSaveResultKind;
    personId: string;
    displayName: string;
    title: string | null;
    companyName: string | null;
    /** Overall OCR confidence 0..1 of the scan that produced this contact. */
    ocrConfidence?: number;
    /** Cards saved in the current scanning session (newest first). */
    sessionSaved?: { personId: string; displayName: string; result: ScanSaveResultKind }[];
    onScanAnother: () => void;
    /** Batch shortcut: reset and reopen the camera immediately. */
    onScanNext?: () => void;
    onDone: () => void;
  }
>(function CardScanSaveSuccess(
  {
    result,
    personId,
    displayName,
    title,
    companyName,
    ocrConfidence,
    sessionSaved = [],
    onScanAnother,
    onScanNext,
    onDone,
  },
  headingRef,
) {
  const t = useT();
  const ocrPercent =
    ocrConfidence === undefined ? null : Math.round(Math.min(1, Math.max(0, ocrConfidence)) * 100);
  const titleCompany = [title, companyName].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-1 flex-col px-6 pb-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.8} aria-hidden />
        </span>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-[18px] font-semibold tracking-tight text-[var(--bc-mobile-text)] outline-none"
        >
          {result === "updated"
            ? t("bc.mobile.cardScan.success.updated")
            : t("bc.mobile.cardScan.success.savedNew")}
        </h2>
        <div>
          <p className="text-[16px] font-medium text-[var(--bc-mobile-text)]">{displayName}</p>
          {titleCompany ? (
            <p className="mt-0.5 text-[13px] text-[var(--bc-mobile-muted)]">{titleCompany}</p>
          ) : null}
        </div>
        {ocrPercent !== null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bc-mobile-surface-2)] px-3 py-1 text-[12px] text-[var(--bc-mobile-muted)]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
            {t("bc.mobile.cardScan.confidence.overall", { percent: ocrPercent })}
          </span>
        ) : null}
      </div>

      {sessionSaved.length > 1 ? (
        <div className="mb-4 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-4">
          <p className="text-[13px] font-semibold text-[var(--bc-mobile-text)]">
            {t("bc.mobile.cardScan.session.batchCount", { count: sessionSaved.length })}
          </p>
          <ul className="mt-2 grid gap-1">
            {sessionSaved.slice(0, 5).map((p) => (
              <li key={p.personId} className="truncate text-[13px] text-[var(--bc-mobile-muted)]">
                {p.displayName}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3">
        {onScanNext ? (
          <button
            type="button"
            onClick={onScanNext}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bc-cta-gold px-6 text-[15px] font-semibold transition-opacity hover:opacity-90 motion-reduce:transition-none"
          >
            <ScanLine className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            {t("bc.mobile.cardScan.session.scanNext")}
          </button>
        ) : null}
        <Link
          to="/connect-app/network/$personId"
          params={{ personId }}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--bc-mobile-text)] px-6 text-[15px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 motion-reduce:transition-none"
        >
          {t("bc.mobile.cardScan.success.viewContact")}
        </Link>
        <button
          type="button"
          onClick={onScanAnother}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-6 text-[15px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] motion-reduce:transition-none"
        >
          <ScanLine className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          {t("bc.mobile.cardScan.success.scanAnother")}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex min-h-11 w-full items-center justify-center rounded-full px-6 text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:text-[var(--bc-mobile-text)] motion-reduce:transition-none"
        >
          {t("bc.mobile.cardScan.success.done")}
        </button>
      </div>
    </div>
  );
});

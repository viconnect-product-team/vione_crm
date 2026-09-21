// vCard preview sheet — human check before share/download.
//
// Shows exactly what the generated .vcf contains (parsed from the real file
// content, never reconstructed from source data) as a labeled field list,
// plus the raw file for full transparency. Confirm delivers via the same
// share-first pipeline as before; Escape / backdrop / close cancels without
// any export happening.

import { useEffect, useId, useRef } from "react";
import { FileText, Loader2, Share2, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { VcfPreviewRows } from "@/components/business-connect/mobile/VcfPreviewRows";

export function VcfPreviewSheet({
  vcf,
  filename,
  confirming = false,
  onConfirm,
  onClose,
}: {
  /** The exact .vcf content that will be shared/downloaded on confirm. */
  vcf: string;
  /** Download filename, shown so the user recognizes the export. */
  filename: string;
  confirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Initial focus lands on the primary action.
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  // Escape closes without exporting — inert while delivery is in flight so
  // the user cannot cancel halfway into the Share Sheet opening.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (!confirming) onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, confirming]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t("bc.mobile.vcfPreview.close")}
        onClick={confirming ? undefined : onClose}
        disabled={confirming}
        className="absolute inset-0 bg-black/40"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={confirming || undefined}
        className="relative flex max-h-[86dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-[#D8B282]/25 bg-[linear-gradient(165deg,rgba(10,16,25,0.98)_0%,rgba(7,12,19,0.98)_50%,rgba(4,8,14,0.99)_100%)] backdrop-blur-xl shadow-2xl sm:rounded-3xl"
      >
        <header className="px-5 pt-5">
          <h2
            id={titleId}
            className="text-[17px] font-semibold tracking-tight text-[var(--bc-mobile-text)]"
          >
            {t("bc.mobile.vcfPreview.title")}
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.vcfPreview.subtitle")}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--bc-mobile-surface-2)] px-2.5 py-1 text-[11.5px] text-[var(--bc-mobile-muted)]">
            <FileText aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
            {filename}
          </p>
        </header>

        <div className="mt-4 flex-1 overflow-y-auto px-5">
          <VcfPreviewRows vcf={vcf} />

          <details className="mt-4 rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 py-2.5">
            <summary className="cursor-pointer text-[12.5px] font-medium text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.vcfPreview.raw")}
            </summary>
            <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {vcf}
            </pre>
          </details>
        </div>

        <footer className="mt-5 grid gap-2.5 px-5 pb-5">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-text)] px-6 text-[15px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
          >
            {confirming ? (
              <>
                <Loader2
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  strokeWidth={1.8}
                />
                {t("bc.mobile.vcfPreview.confirming")}
              </>
            ) : (
              <>
                <Share2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                {t("bc.mobile.vcfPreview.confirm")}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-6 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
          >
            <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            {t("bc.mobile.vcfPreview.close")}
          </button>
        </footer>
      </section>
    </div>
  );
}

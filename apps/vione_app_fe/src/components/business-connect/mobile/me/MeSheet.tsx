// BC-Mobile-5A — shared bottom-sheet chrome for the Me flows.
// Same conventions as VcfPreviewSheet: dialog semantics, Escape/backdrop
// close (inert while busy), labelled header, mobile-safe max height.

import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";

export function MeSheet({
  title,
  subtitle,
  busy = false,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useT();
  const titleId = useId();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (!busy) onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t("bc.mobile.me.close")}
        onClick={busy ? undefined : onClose}
        disabled={busy}
        className="absolute inset-0 bg-black/70 backdrop-blur-xs"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy || undefined}
        className="relative flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] text-[var(--bc-mobile-text)] dark:bg-[linear-gradient(165deg,rgba(10,16,25,0.98)_0%,rgba(7,12,19,0.98)_50%,rgba(4,8,14,0.99)_100%)] backdrop-blur-xl shadow-2xl sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[17px] font-semibold tracking-tight text-[var(--bc-mobile-text)]"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-[13px] leading-snug text-[var(--bc-mobile-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t("bc.mobile.me.close")}
            className="grid min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-full text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </header>
        <div className="mt-4 flex-1 overflow-y-auto px-5 touch-pan-y overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>{children}</div>
        {footer && <footer className="mt-5 grid gap-2.5 px-5 pb-5">{footer}</footer>}
      </section>
    </div>
  );
}

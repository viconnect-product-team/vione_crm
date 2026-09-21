// BC-Mobile — recognition session expiry panel.
//
// Shown when the review session lapsed (TTL elapsed in the foreground, or a
// backgrounded tab returned to a dead session). The draft is locked — saving
// is refused — and the ONLY way forward is an explicit recapture, which
// returns the human to the capture stage. Rendered as role="alert" so screen
// readers announce the state change immediately.

import { forwardRef } from "react";
import { Camera, Clock3 } from "lucide-react";
import { useT } from "@/lib/i18n";

export const CardScanSessionExpired = forwardRef<HTMLHeadingElement, { onRecapture: () => void }>(
  function CardScanSessionExpired({ onRecapture }, headingRef) {
    const t = useT();
    return (
      <div className="flex flex-1 flex-col px-6 pb-8">
        <div
          role="alert"
          className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)]">
            <Clock3
              className="h-6 w-6 text-[var(--bc-mobile-muted)]"
              strokeWidth={1.8}
              aria-hidden
            />
          </span>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-[17px] font-semibold text-[var(--bc-mobile-text)] outline-none"
          >
            {t("bc.mobile.cardScan.session.expiredTitle")}
          </h2>
          <p className="max-w-[300px] text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.cardScan.session.expiredDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={onRecapture}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-text)] px-4 text-[14px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 motion-reduce:transition-none"
        >
          <Camera className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          {t("bc.mobile.cardScan.session.recapture")}
        </button>
      </div>
    );
  },
);

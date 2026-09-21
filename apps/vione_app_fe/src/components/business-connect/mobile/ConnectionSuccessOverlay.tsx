// BC-Mobile — full-screen "connected" confirmation.
//
// Presentational only: the connection itself is already canonical when this
// renders. CTAs let the viewer capture / pick a photo for a meeting moment
// (staged in memory, consumed by the Moment composer) or dismiss.

import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Camera, Check, Images } from "lucide-react";
import { useT } from "@/lib/i18n";
import { stageMomentPhotos } from "@/lib/business-connect/mobile/moment-photo-handoff";
import { MOMENT_IMAGE_ACCEPT } from "@/lib/business-connect/mobile/moment-image";

const PRIMARY =
  "flex min-h-12 w-full items-center justify-center gap-2 bc-cta-gold rounded-full px-6 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] motion-reduce:transition-none";
const SECONDARY =
  "flex min-h-12 w-full items-center justify-center gap-2 bc-cta-gold-soft rounded-full px-6 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] motion-reduce:transition-none";
const GHOST =
  "min-h-11 w-full rounded-full px-6 text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] motion-reduce:transition-none";

export function ConnectionSuccessOverlay({
  name,
  onDismiss,
}: {
  name?: string | null;
  onDismiss: () => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  const captureRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  function handleFiles(list: FileList | null) {
    const files = list ? Array.from(list) : [];
    if (files.length === 0) return;
    stageMomentPhotos(files);
    void navigate({ to: "/connect-app/moment" });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bc-connected-title"
      tabIndex={-1}
      ref={dialogRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-[var(--bc-mobile-navy)] px-6 py-10 focus:outline-none"
    >
      <div className="grid justify-items-center gap-5 text-center">
        <span className="relative grid h-32 w-32 place-items-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-4 border-[var(--bc-mobile-accent)]/25"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full border-2 border-[var(--bc-mobile-accent)]/40 motion-reduce:animate-none"
          />
          <span className="grid h-20 w-20 place-items-center rounded-full bg-[var(--bc-mobile-accent)]">
            <Check
              aria-hidden="true"
              className="h-10 w-10 text-[var(--bc-mobile-navy)]"
              strokeWidth={2.4}
            />
          </span>
        </span>

        <h2
          id="bc-connected-title"
          className="text-[22px] font-semibold text-[var(--bc-mobile-on-navy, #fff)]"
        >
          {t("bc.mobile.connection.success.title")}
        </h2>
        <p className="max-w-xs text-[14.5px] text-[var(--bc-mobile-accent)]/80">
          {name
            ? t("bc.mobile.connection.success.bodyNamed").replace("{name}", name)
            : t("bc.mobile.connection.success.body")}
        </p>
      </div>

      <div className="grid w-full max-w-sm gap-3">
        <button type="button" className={PRIMARY} onClick={() => captureRef.current?.click()}>
          <Camera aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={1.8} />
          {t("bc.mobile.connection.success.capture")}
        </button>
        <button type="button" className={SECONDARY} onClick={() => pickRef.current?.click()}>
          <Images aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={1.8} />
          {t("bc.mobile.connection.success.choose")}
        </button>
        <button type="button" className={GHOST} onClick={onDismiss}>
          {t("bc.mobile.connection.success.later")}
        </button>
      </div>

      <input
        ref={captureRef}
        type="file"
        accept={MOMENT_IMAGE_ACCEPT}
        capture="environment"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={pickRef}
        type="file"
        accept={MOMENT_IMAGE_ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

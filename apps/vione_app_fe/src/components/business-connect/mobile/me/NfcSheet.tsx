// BC-Mobile-5B — NFC management + tag writer sheet.
//
// Programs the CURRENT BC-Mobile-5A opaque share URL (/c/<token>) onto a
// physical NFC tag. NFC is only a transport: the tag carries nothing but
// the public URL, and recipients resolve through the exact same server-side
// privacy projection as QR / copied links.
//
// Hard rules honored here:
// - capability is REAL feature detection (never a fake Write flow);
// - all critical UI derives from the nfcWriteReducer state machine;
// - raw DOMExceptions never render — only localized product messages;
// - the URL is validated (origin, /c/<token>, no query/fragment) before any
//   hardware call — this is not a generic NFC writer.

import { useEffect, useReducer, useRef, useState } from "react";
import { Check, CheckCircle2, Copy, Loader2, Nfc, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n";
import { MeSheet } from "./MeSheet";
import { identityShareUrl } from "./IdentityQrSheet";
import { createWebNfcWriter, type NfcWriterAdapter } from "@/lib/nfc/writer";
import { isNfcWriteActive, nfcWriteInitialState, nfcWriteReducer } from "@/lib/nfc/write-machine";
import { toNfcErrorKind } from "@/lib/nfc/errors";
import { isValidIdentityShareUrl } from "@/lib/nfc/ndef";
import { reportIdentityMetric } from "@/lib/business-connect/mobile/identity.telemetry";
import type { IdentityShareLinkInfo } from "@/lib/business-connect/mobile/identity.types";
import type { NfcErrorKind } from "@/lib/nfc/types";

const ERROR_KEY: Record<NfcErrorKind, Parameters<ReturnType<typeof useT>>[0]> = {
  PERMISSION_DENIED: "bc.mobile.me.nfc.error.permissionDenied",
  NO_TAG: "bc.mobile.me.nfc.error.noTag",
  READ_ONLY: "bc.mobile.me.nfc.error.readOnly",
  WRITE_FAILED: "bc.mobile.me.nfc.error.writeFailed",
  UNSUPPORTED: "bc.mobile.me.nfc.error.unsupported",
  CANCELLED: "bc.mobile.me.nfc.error.cancelled",
  LINK_NOT_CONFIRMED: "bc.mobile.me.nfc.error.linkNotConfirmed",
};

export function NfcSheet({
  shareLink,
  onClose,
  adapter,
  registerTag,
}: {
  shareLink: IdentityShareLinkInfo;
  onClose: () => void;
  /** Injectable for tests; defaults to the real Web NFC adapter. */
  adapter?: NfcWriterAdapter;
  /**
   * BC-Mobile-5C — called fire-and-forget after a CONFIRMED write to
   * register the tag in the owner's registry. Injected by the Me page so
   * this component stays free of server-function imports.
   */
  registerTag?: () => Promise<unknown>;
}) {
  const t = useT();
  const [state, dispatch] = useReducer(nfcWriteReducer, nfcWriteInitialState);
  const [copied, setCopied] = useState(false);
  const [showTestHint, setShowTestHint] = useState(false);
  const adapterRef = useRef<NfcWriterAdapter | null>(null);
  const aborterRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = identityShareUrl(shareLink.token);
  // §22 — never program a potentially stale/malformed URL.
  const linkConfirmed = isValidIdentityShareUrl(shareUrl, origin);

  if (!adapterRef.current) {
    adapterRef.current = adapter ?? createWebNfcWriter(origin);
  }

  useEffect(() => {
    mountedRef.current = true;
    reportIdentityMetric("NFC_MANAGEMENT_OPENED");
    dispatch({ type: "CHECK" });
    const capability = adapterRef.current!.getCapability();
    dispatch({ type: "CAPABILITY", capability });
    return () => {
      mountedRef.current = false;
      aborterRef.current?.abort();
    };
  }, []);

  const busy = isNfcWriteActive(state);

  async function handleWrite() {
    if (busy) return;
    dispatch({ type: "START_WRITE" });
    const aborter = new AbortController();
    aborterRef.current = aborter;
    reportIdentityMetric("NFC_WRITE_STARTED");
    // Hardware engaged: the write() promise covers tag wait + program.
    dispatch({ type: "TAG_WRITE_STARTED" });
    try {
      await adapterRef.current!.writeIdentityUrl(shareUrl, { signal: aborter.signal });
      if (!mountedRef.current) return;
      reportIdentityMetric("NFC_WRITE_SUCCESS");
      dispatch({ type: "WRITE_OK" });
      // Best-effort registry bookkeeping — never blocks or fakes the write
      // outcome. Failure is telemetry-only; the management page stays
      // honest because only confirmed writes attempt registration.
      if (registerTag) {
        void Promise.resolve()
          .then(registerTag)
          .catch(() => reportIdentityMetric("NFC_TAG_REGISTER_FAILED"));
      }
    } catch (e) {
      if (!mountedRef.current) return;
      const kind = toNfcErrorKind(e);
      if (kind === "CANCELLED") {
        reportIdentityMetric("NFC_WRITE_CANCELLED");
        dispatch({ type: "CANCEL" });
      } else {
        reportIdentityMetric("NFC_WRITE_FAILED");
        dispatch({ type: "WRITE_FAIL", kind });
      }
    } finally {
      aborterRef.current = null;
    }
  }

  function handleCancel() {
    if (!busy) return;
    aborterRef.current?.abort();
    // Immediate UI transition even if the adapter rejects asynchronously.
    dispatch({ type: "CANCEL" });
  }

  function handleRetry() {
    if (busy) return;
    dispatch({ type: "RESET" });
    const capability = adapterRef.current!.getCapability();
    dispatch({ type: "CAPABILITY", capability });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard denied — the URL is not displayed; user can use My QR.
    }
  }

  const statusMessage = (() => {
    switch (state.status) {
      case "READY":
        return state.capability === "SUPPORTED_WRITE"
          ? t("bc.mobile.me.nfc.status.ready")
          : t("bc.mobile.me.nfc.unsupportedTitle");
      case "UNSUPPORTED":
        return t("bc.mobile.me.nfc.unsupportedTitle");
      case "WAITING_FOR_TAG":
        return t("bc.mobile.me.nfc.waiting");
      case "WRITING":
        return t("bc.mobile.me.nfc.writing");
      case "SUCCESS":
        return t("bc.mobile.me.nfc.successTitle");
      case "ERROR":
        return t(ERROR_KEY[state.kind]);
      case "CANCELLED":
        return t("bc.mobile.me.nfc.error.cancelled");
      default:
        return "";
    }
  })();

  const primaryBtn =
    "flex min-h-12 w-full items-center justify-center gap-2 bc-cta-gold rounded-full px-6 text-[15px] font-semibold disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-mobile-bg)] motion-reduce:transition-none";
  const secondaryBtn =
    "flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-6 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-mobile-bg)] motion-reduce:transition-none";
  const ghostBtn =
    "min-h-11 w-full rounded-full text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-mobile-bg)] motion-reduce:transition-none";

  const showFallback =
    state.status === "UNSUPPORTED" ||
    (state.status === "READY" && state.capability !== "SUPPORTED_WRITE");

  return (
    <MeSheet
      title={t("bc.mobile.me.nfc.title")}
      subtitle={t("bc.mobile.me.nfc.subtitle")}
      busy={busy}
      onClose={onClose}
      footer={
        state.status === "SUCCESS" ? (
          <>
            <button type="button" onClick={onClose} className={primaryBtn}>
              {t("bc.mobile.me.nfc.done")}
            </button>
            <button
              type="button"
              onClick={() => setShowTestHint((v) => !v)}
              aria-expanded={showTestHint}
              className={secondaryBtn}
            >
              <Nfc aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {t("bc.mobile.me.nfc.testCard")}
            </button>
          </>
        ) : busy ? (
          <button type="button" onClick={handleCancel} className={secondaryBtn}>
            {t("bc.mobile.me.cancel")}
          </button>
        ) : state.status === "ERROR" || state.status === "CANCELLED" ? (
          <>
            <button type="button" onClick={handleRetry} className={primaryBtn}>
              {t("bc.mobile.me.retry")}
            </button>
            <button type="button" onClick={onClose} className={ghostBtn}>
              {t("bc.mobile.me.nfc.done")}
            </button>
          </>
        ) : showFallback ? (
          <button type="button" onClick={() => void handleCopy()} className={primaryBtn}>
            {copied ? (
              <Check aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <Copy aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            )}
            {copied ? t("bc.mobile.me.copied") : t("bc.mobile.me.nfc.copyNfcLink")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleWrite()}
            disabled={state.status !== "READY" || !linkConfirmed}
            className={primaryBtn}
          >
            <Nfc aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            {t("bc.mobile.me.nfc.writeCta")}
          </button>
        )
      }
    >
      <div className="flex flex-col pb-1">
        {/* Semantic status announcement — state is never color-only. */}
        <p
          role="status"
          aria-live="polite"
          aria-label={t("bc.mobile.me.nfc.status.aria")}
          className="sr-only"
        >
          {statusMessage}
        </p>

        <div className="flex justify-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[color-mix(in_oklab,var(--bc-mobile-accent)_35%,var(--bc-mobile-border))] bg-[var(--bc-mobile-surface-2)]">
            {busy ? (
              <Loader2
                aria-hidden="true"
                className="h-7 w-7 animate-spin text-[var(--bc-mobile-accent)] motion-reduce:animate-none"
                strokeWidth={1.8}
              />
            ) : state.status === "SUCCESS" ? (
              <CheckCircle2
                aria-hidden="true"
                className="h-7 w-7 text-[var(--bc-mobile-accent-strong)]"
                strokeWidth={1.8}
              />
            ) : (
              <Nfc
                aria-hidden="true"
                className="h-7 w-7 text-[var(--bc-mobile-accent-strong)]"
                strokeWidth={1.8}
              />
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[12px] font-medium uppercase tracking-wide text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.me.nfc.opensAt")}
        </p>
        <p className="mt-1 break-all text-center text-[13px] text-[var(--bc-mobile-text)]">
          {origin}/c/••••••••
        </p>

        {state.status === "SUCCESS" ? (
          <div className="mt-4 text-center">
            <p className="text-[16px] font-semibold text-[var(--bc-mobile-text)]">
              {t("bc.mobile.me.nfc.successTitle")}
            </p>
            <p className="mt-1 text-[13.5px] leading-snug text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.nfc.successBody")}
            </p>
            {showTestHint && (
              <p className="mt-3 rounded-xl bg-[var(--bc-mobile-surface-2)] px-3.5 py-2.5 text-[13px] leading-snug text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.me.nfc.testHint")}
              </p>
            )}
          </div>
        ) : busy ? (
          <p className="mt-4 text-center text-[14px] leading-relaxed text-[var(--bc-mobile-text)]">
            {statusMessage}
          </p>
        ) : state.status === "ERROR" || state.status === "CANCELLED" ? (
          <p
            role="alert"
            className="mt-4 text-center text-[14px] leading-relaxed text-[var(--bc-mobile-text)]"
          >
            {statusMessage}
          </p>
        ) : showFallback ? (
          <div className="mt-4 text-center">
            <p className="text-[14.5px] font-medium text-[var(--bc-mobile-text)]">
              {t("bc.mobile.me.nfc.unsupportedTitle")}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.nfc.unsupportedBody")}
            </p>
          </div>
        ) : (
          <>
            {!linkConfirmed && (
              <p
                role="alert"
                className="mt-4 text-center text-[13.5px] leading-relaxed text-[var(--bc-mobile-text)]"
              >
                {t("bc.mobile.me.nfc.error.linkNotConfirmed")}
              </p>
            )}
            <div className="mt-4">
              <h3 className="text-[12px] font-medium uppercase tracking-wide text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.me.nfc.howTitle")}
              </h3>
              <ol className="mt-2 grid gap-1.5 text-[13.5px] leading-snug text-[var(--bc-mobile-text)]">
                <li>1. {t("bc.mobile.me.nfc.how1")}</li>
                <li>2. {t("bc.mobile.me.nfc.how2")}</li>
                <li>3. {t("bc.mobile.me.nfc.how3")}</li>
              </ol>
            </div>
            <div className="mt-4 rounded-xl bg-[var(--bc-mobile-surface-2)] px-3.5 py-2.5">
              <p className="text-[12.5px] font-medium text-[var(--bc-mobile-text)]">
                {t("bc.mobile.me.nfc.lostTitle")}
              </p>
              <p className="mt-1 text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.me.nfc.lostBody")}
              </p>
            </div>
          </>
        )}

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[var(--bc-mobile-border)] px-3.5 py-2.5">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
            strokeWidth={1.8}
          />
          <p className="text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.me.nfc.privacyNote")}
          </p>
        </div>
      </div>
    </MeSheet>
  );
}

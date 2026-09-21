// BC-Mobile-5A — share hub sheet: QR for the CURRENT opaque token, copy /
// share link, and a confirmed token reset (rotation).
//
// Rotation never exposes internals: it replaces the token server-side and the
// sheet re-renders with the new QR. The old URL immediately resolves to the
// neutral unavailable state.

import { useEffect, useState } from "react";
import { Check, Copy, Link2, Loader2, MessageSquareText, RotateCcw, Share2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { MeSheet } from "./MeSheet";
import { QrCanvas } from "@/components/member/QrCanvas";
import { reportIdentityMetric } from "@/lib/business-connect/mobile/identity.telemetry";
import type { IdentityShareLinkInfo } from "@/lib/business-connect/mobile/identity.types";

export function identityShareUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/c/${token}`;
}

export function IdentityQrSheet({
  shareLink,
  rotating,
  onRotate,
  onClose,
}: {
  shareLink: IdentityShareLinkInfo;
  rotating: boolean;
  onRotate: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [previewingShare, setPreviewingShare] = useState(false);
  const [sharing, setSharing] = useState(false);
  const url = identityShareUrl(shareLink.token);
  const shareText = t("bc.mobile.me.sharePreview.message");
  // Capability is resolved on the client only, so SSR renders the neutral
  // (no-native-share) copy and hydration upgrades it.
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard denied — the URL stays visible in the sheet for manual copy.
    }
  }

  async function handleConfirmedShare() {
    setSharing(true);
    reportIdentityMetric("IDENTITY_LINK_SHARED");
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({ title: shareText, text: shareText, url });
          setPreviewingShare(false);
          return;
        } catch {
          // Cancelled or unsupported payload — fall through to clipboard.
        }
      }
      try {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        // Clipboard denied — the content stays visible for manual copy.
      }
    } finally {
      setSharing(false);
    }
  }

  if (previewingShare) {
    return (
      <MeSheet
        title={t("bc.mobile.me.sharePreview.title")}
        subtitle={t("bc.mobile.me.sharePreview.subtitle")}
        busy={sharing}
        onClose={() => setPreviewingShare(false)}
        footer={
          <>
            <button
              type="button"
              onClick={handleConfirmedShare}
              disabled={sharing}
              className="flex min-h-12 w-full items-center justify-center gap-2 bc-cta-gold rounded-full px-6 text-[15px] font-semibold disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-mobile-bg)] motion-reduce:transition-none"
            >
              {sharing ? (
                <Loader2
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  strokeWidth={1.8}
                />
              ) : (
                <Share2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              )}
              {sharing
                ? t("bc.mobile.me.sharePreview.sending")
                : t("bc.mobile.me.sharePreview.confirm")}
            </button>
            <button
              type="button"
              onClick={() => setPreviewingShare(false)}
              disabled={sharing}
              className="min-h-11 w-full rounded-full text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-mobile-bg)] motion-reduce:transition-none"
            >
              {t("bc.mobile.me.sharePreview.cancel")}
            </button>
          </>
        }
      >
        <div className="grid gap-2.5 pb-1">
          <div className="rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-wide text-[var(--bc-mobile-muted)]">
              <MessageSquareText aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
              {t("bc.mobile.me.sharePreview.messageLabel")}
            </p>
            <p className="mt-1.5 text-[14px] leading-snug text-[var(--bc-mobile-text)]">
              {shareText}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-wide text-[var(--bc-mobile-muted)]">
              <Link2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
              {t("bc.mobile.me.sharePreview.linkLabel")}
            </p>
            <p className="mt-1.5 break-all text-[13px] leading-snug text-[var(--bc-mobile-text)]">
              {url}
            </p>
          </div>
          {!canNativeShare && (
            <p className="text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.sharePreview.noNativeShare")}
            </p>
          )}
          {copied && (
            <p aria-live="polite" className="text-[12.5px] font-medium text-[var(--bc-mobile-accent)]">
              {t("bc.mobile.me.sharePreview.copiedFallback")}
            </p>
          )}
        </div>
      </MeSheet>
    );
  }

  if (confirmingReset) {
    return (
      <MeSheet
        title={t("bc.mobile.me.resetLink.confirmTitle")}
        busy={rotating}
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              onClick={onRotate}
              disabled={rotating}
              className="flex min-h-12 w-full items-center justify-center gap-2 bc-cta-gold rounded-full px-6 text-[15px] font-semibold disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-mobile-bg)] motion-reduce:transition-none"
            >
              {rotating && (
                <Loader2
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  strokeWidth={1.8}
                />
              )}
              {rotating ? t("bc.mobile.me.resetting") : t("bc.mobile.me.resetLink.confirm")}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              disabled={rotating}
              className="min-h-11 w-full rounded-full text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-mobile-bg)] motion-reduce:transition-none"
            >
              {t("bc.mobile.me.cancel")}
            </button>
          </>
        }
      >
        <p className="pb-1 text-[14px] leading-relaxed text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.me.resetLink.confirmBody")}
        </p>
      </MeSheet>
    );
  }

  return (
    <MeSheet title={t("bc.mobile.me.myQr")} busy={rotating} onClose={onClose}>
      <div className="flex flex-col items-center pb-1">
        <figure
          aria-label={t("bc.mobile.me.qr.aria")}
          className="rounded-3xl border border-[color-mix(in_oklab,var(--bc-mobile-accent)_45%,transparent)] bg-[var(--bc-mobile-ivory)] p-4 shadow-[var(--bc-mobile-shadow-cta)]"
        >
          <QrCanvas value={url} size={216} dark="#050c15" light="#f5f7fa" />
        </figure>
        <p className="mt-3 max-w-[30ch] text-center text-[13px] leading-snug text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.me.qr.hint")}
        </p>
        <p className="mt-3 w-full break-all rounded-xl bg-[var(--bc-mobile-surface-2)] px-3.5 py-2.5 text-center text-[12px] text-[var(--bc-mobile-muted)]">
          {url}
        </p>

        <div className="mt-4 grid w-full gap-2.5">
          <button
            type="button"
            onClick={() => setPreviewingShare(true)}
            className="flex min-h-12 w-full items-center justify-center gap-2 bc-cta-gold rounded-full px-6 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-mobile-bg)] motion-reduce:transition-none"
          >
            <Share2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            {t("bc.mobile.me.shareLink")}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-6 text-[14px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-mobile-bg)] motion-reduce:transition-none"
          >
            {copied ? (
              <Check aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <Copy aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            )}
            {copied ? t("bc.mobile.me.copied") : t("bc.mobile.me.copyLink")}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-[13.5px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-mobile-bg)] motion-reduce:transition-none"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            {t("bc.mobile.me.resetLink")}
          </button>
        </div>
      </div>
    </MeSheet>
  );
}

import { useMemo } from "react";
import { X, IdCard, QrCode, Nfc, Check, ShieldAlert, XCircle } from "lucide-react";
import { QrCanvas } from "@/components/member/QrCanvas";
import { nfcSupport, type NfcSupport } from "@/lib/business-card-nfc";
import { resolveTheme } from "@/lib/business-card/business-card.share";
import { useT } from "@/lib/i18n";
import { resolveMediaUrl } from "@/lib/api-client";

/**
 * Preview a business card before publishing: renders the card summary, a QR of
 * the public link, and an NFC readiness indicator. Works for draft cards too
 * (the ShareCardModal is only offered once published).
 */
export function CardPreviewModal({
  slug,
  name,
  title,
  company,
  avatarUrl,
  themeId,
  published,
  onClose,
}: {
  slug: string;
  name: string;
  title?: string;
  company?: string;
  avatarUrl?: string | null;
  themeId?: string | null;
  published: boolean;
  onClose: () => void;
}) {
  const t = useT();

  const url = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/b/${slug}`;
  }, [slug]);

  const theme = useMemo(() => resolveTheme(themeId ?? null), [themeId]);
  const nfc: NfcSupport = useMemo(() => nfcSupport(), []);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("bc.preview.title")}
    >
      <div
        className="vba-card max-h-[90vh] w-full max-w-sm overflow-auto p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--vba-border-soft)] px-4 py-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-[var(--vba-text)]">
              {t("bc.preview.title")}
            </h3>
            <p className="truncate text-[11px] text-[var(--vba-text-dim)]">
              {t("bc.preview.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("bc.share.close")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--vba-text-muted)] hover:bg-[var(--vba-gold-soft)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-4 py-5">
          {/* Card summary */}
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--vba-border-soft)] p-3">
            {avatarUrl ? (
              <img
                src={resolveMediaUrl(avatarUrl) || avatarUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl object-cover"
                width={56}
                height={56}
              />
            ) : (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
                <IdCard className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-[var(--vba-text)]">{name}</p>
              {title || company ? (
                <p className="truncate text-[12px] text-[var(--vba-text-muted)]">
                  {[title, company].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <p className="mt-0.5 truncate text-[11px] text-[var(--vba-text-dim)]">/b/{slug}</p>
            </div>
          </div>

          {!published ? (
            <div className="rounded-xl bg-[var(--vba-gold-soft)] px-3 py-2 text-[11px] font-medium text-[var(--vba-gold)]">
              {t("bc.preview.draftNote")}
            </div>
          ) : null}

          {/* QR */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--vba-text)]">
              <QrCode className="h-4 w-4" />
              {t("bc.share.qr")}
            </div>
            <QrCanvas
              value={url}
              size={180}
              frameColor={theme.surface}
              accent={theme.accent}
              logoUrl={avatarUrl ?? null}
            />
            <p className="text-center text-[11px] text-[var(--vba-text-dim)]">
              {t("bc.preview.qrHint")}
            </p>
          </div>

          {/* NFC indicator */}
          <div className="flex items-start gap-2 rounded-xl border border-[var(--vba-border-soft)] px-3 py-2.5">
            <Nfc className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vba-text-muted)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-[var(--vba-text)]">
                {t("bc.nfc.title")}
              </p>
              {nfc === "supported" ? (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-[var(--vba-gold)]">
                  <Check className="h-3.5 w-3.5" />
                  {t("bc.preview.nfc.ready")}
                </p>
              ) : nfc === "insecure" ? (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--vba-text-dim)]">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {t("bc.nfc.insecure")}
                </p>
              ) : (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--vba-text-dim)]">
                  <XCircle className="h-3.5 w-3.5" />
                  {t("bc.nfc.unsupported")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Share2, X, ExternalLink, QrCode, Nfc, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { QrCanvas } from "@/components/member/QrCanvas";
import { resolveTheme } from "@/lib/business-card/business-card.share";
import { downloadQrPng, downloadQrSvg } from "@/lib/qr-export";
import { useT } from "@/lib/i18n";
import {
  nfcSupport,
  writeCardNfc,
  scanCardNfc,
  type CardTapPayload,
} from "@/lib/business-card-nfc";

type ShareTab = "qr" | "nfc";

/** Modal to share a published business card: QR + link, and an NFC tap flow. */
export function ShareCardModal({
  slug,
  name,
  title,
  company,
  themeId,
  qrOptions,
  logoUrl,
  onClose,
}: {
  slug: string;
  name: string;
  title?: string;
  company?: string;
  /** Optional template id — used to color the exported PNG/SVG QR. */
  themeId?: string | null;
  /** Persisted QR customisation so PNG/SVG exports match the live preview. */
  qrOptions?: {
    background?: "white" | "template" | "transparent";
    logoScale?: number;
    logoOffsetX?: number;
    logoOffsetY?: number;
  } | null;
  /** Center logo (e.g. association / company mark) baked into exports. */
  logoUrl?: string | null;
  onClose: () => void;
}) {
  const t = useT();
  const qrWrapRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<ShareTab>("qr");
  const [exporting, setExporting] = useState<null | "png" | "svg">(null);

  const theme = useMemo(() => resolveTheme(themeId ?? null), [themeId]);

  // User-selectable background at export time — defaults to what the builder
  // saved so a plain download matches the on-card preview.
  const initialBg = qrOptions?.background ?? "white";
  const [bgMode, setBgMode] = useState<"white" | "template" | "transparent">(initialBg);

  const exportPlate = useMemo(() => {
    if (bgMode === "template") return theme.surface;
    return "#ffffff";
  }, [bgMode, theme.surface]);

  const url = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/b/${slug}`;
  }, [slug]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("bc.share.copied"));
    } catch {
      toast.error("Error");
    }
  }, [url, t]);

  const nativeShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await copy();
    }
  }, [name, url, copy]);

  const download = useCallback(
    async (format: "png" | "svg") => {
      if (exporting) return;
      setExporting(format);
      try {
        const opts = {
          value: url,
          filename: `qr-${slug}`,
          dark: theme.text,
          light: exportPlate,
          transparent: bgMode === "transparent",
          logoUrl: logoUrl ?? null,
          logoScale: qrOptions?.logoScale,
          logoOffsetX: qrOptions?.logoOffsetX,
          logoOffsetY: qrOptions?.logoOffsetY,
          logoBg: exportPlate,
        };
        if (format === "png") await downloadQrPng({ ...opts, pixelSize: 1024 });
        else await downloadQrSvg(opts);
        toast.success(t("bc.share.exported"));
      } catch {
        toast.error(t("bc.share.exportFailed"));
      } finally {
        setExporting(null);
      }
    },
    [exporting, url, slug, theme, exportPlate, bgMode, logoUrl, qrOptions, t],
  );

  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  const payload: CardTapPayload = useMemo(
    () => ({ url, name, title, company }),
    [url, name, title, company],
  );

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4"
      onClick={onClose}
    >
      <div
        className="vba-card w-full max-w-sm overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--vba-border-soft)] px-4 py-3">
          <h3 className="text-[15px] font-semibold text-[var(--vba-text)]">
            {t("bc.share.title")}
          </h3>
          <button
            onClick={onClose}
            aria-label={t("bc.share.close")}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--vba-text-muted)] hover:bg-[var(--vba-gold-soft)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-[var(--vba-border-soft)] px-3 pt-2">
          <TabBtn active={tab === "qr"} onClick={() => setTab("qr")}>
            <QrCode className="h-4 w-4" />
            {t("bc.share.qr")}
          </TabBtn>
          <TabBtn active={tab === "nfc"} onClick={() => setTab("nfc")}>
            <Nfc className="h-4 w-4" />
            {t("bc.nfc")}
          </TabBtn>
        </div>

        {tab === "qr" ? (
          <div className="flex flex-col items-center gap-3 px-4 py-5">
            <div ref={qrWrapRef}>
              <QrCanvas
                value={url}
                size={200}
                light={bgMode === "transparent" ? "transparent" : exportPlate}
                dark={theme.text}
                accent={theme.accent}
                logoUrl={logoUrl ?? undefined}
                logoBg={exportPlate}
                logoScale={qrOptions?.logoScale}
                logoOffsetX={qrOptions?.logoOffsetX}
                logoOffsetY={qrOptions?.logoOffsetY}
              />
            </div>
            <p className="text-center text-[12px] text-[var(--vba-text-muted)]">
              {t("bc.share.qrHint")}
            </p>

            <fieldset className="w-full" aria-label={t("bc.share.bgLabel")}>
              <legend className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--vba-text-dim)]">
                {t("bc.share.bgLabel")}
              </legend>
              <div
                role="radiogroup"
                aria-label={t("bc.share.bgLabel")}
                className="grid grid-cols-3 gap-1 rounded-lg border border-[var(--vba-border-soft)] p-1"
              >
                {(["white", "template", "transparent"] as const).map((mode) => {
                  const active = bgMode === mode;
                  return (
                    <button
                      key={mode}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setBgMode(mode)}
                      className={`rounded-md px-2 py-1.5 text-[12px] font-medium transition ${
                        active
                          ? "bg-[var(--vba-gold)] text-[var(--vba-ink,#0a1834)]"
                          : "text-[var(--vba-text-muted)] hover:text-[var(--vba-text)]"
                      }`}
                    >
                      {t(`bc.share.bg.${mode}`)}
                    </button>
                  );
                })}
              </div>
              {bgMode === "transparent" ? (
                <p className="mt-1 text-[11px] text-[var(--vba-text-muted)]">
                  {t("bc.share.bg.transparentHint")}
                </p>
              ) : null}
            </fieldset>

            <div className="w-full">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--vba-text-dim)]">
                {t("bc.share.link")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] px-3 py-2 text-[12px] text-[var(--vba-text)]"
                />
                <button
                  onClick={() => void copy()}
                  aria-label={t("bc.share.copy")}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--vba-border-soft)] text-[var(--vba-text)]"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-1 grid w-full grid-cols-2 gap-2">
              {canNativeShare ? (
                <button
                  onClick={() => void nativeShare()}
                  className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--vba-gold)] px-3 py-2 text-[13px] font-semibold text-[var(--vba-ink,#0a1834)]"
                >
                  <Share2 className="h-4 w-4" />
                  {t("bc.share.native")}
                </button>
              ) : null}
              <button
                onClick={() => void download("png")}
                disabled={exporting !== null}
                aria-label={t("bc.share.downloadPngLabel")}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--vba-text)] disabled:opacity-60"
              >
                {exporting === "png" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {t("bc.share.downloadPng")}
              </button>
              <button
                onClick={() => void download("svg")}
                disabled={exporting !== null}
                aria-label={t("bc.share.downloadSvgLabel")}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--vba-text)] disabled:opacity-60"
              >
                {exporting === "svg" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {t("bc.share.downloadSvg")}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--vba-text)]"
              >
                <ExternalLink className="h-4 w-4" />
                {t("bc.viewPublic")}
              </a>
            </div>
          </div>
        ) : (
          <NfcPanel payload={payload} />
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-2 text-[13px] font-semibold ${
        active
          ? "border-b-2 border-[var(--vba-gold)] text-[var(--vba-text)]"
          : "text-[var(--vba-text-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function NfcPanel({ payload }: { payload: CardTapPayload }) {
  const t = useT();
  const support = useMemo(() => nfcSupport(), []);
  const [busy, setBusy] = useState<null | "write" | "scan">(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const errText = useCallback(
    (code: string) => {
      if (code === "unsupported") return t("bc.nfc.unsupported");
      if (code === "insecure") return t("bc.nfc.insecure");
      return t("bc.nfc.failed");
    },
    [t],
  );

  const doWrite = useCallback(async () => {
    setBusy("write");
    toast.info(t("bc.nfc.writing"));
    const res = await writeCardNfc(payload);
    setBusy(null);
    if (res.ok) toast.success(t("bc.nfc.written"));
    else toast.error(errText(res.error));
  }, [payload, t, errText]);

  const doScan = useCallback(async () => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy("scan");
    try {
      const foundUrl = await scanCardNfc(ctrl.signal);
      window.location.href = foundUrl;
    } catch (e) {
      if (!ctrl.signal.aborted) {
        toast.error(errText(e instanceof Error ? e.message : "failed"));
      }
    } finally {
      setBusy(null);
      abortRef.current = null;
    }
  }, [errText]);

  const cancelScan = useCallback(() => {
    abortRef.current?.abort();
    setBusy(null);
  }, []);

  if (support !== "supported") {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
          <Nfc className="h-7 w-7" />
        </div>
        <p className="text-[13px] text-[var(--vba-text-muted)]">
          {support === "insecure" ? t("bc.nfc.insecure") : t("bc.nfc.unsupported")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
        {busy ? <Loader2 className="h-8 w-8 animate-spin" /> : <Nfc className="h-8 w-8" />}
      </div>
      <p className="text-[12px] text-[var(--vba-text-muted)]">{t("bc.nfc.hint")}</p>

      <div className="grid w-full gap-2">
        <button
          disabled={busy !== null}
          onClick={() => void doWrite()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--vba-gold)] px-3 py-2.5 text-[13px] font-semibold text-[var(--vba-ink,#0a1834)] disabled:opacity-50"
        >
          <Nfc className="h-4 w-4" />
          {busy === "write" ? t("bc.nfc.writing") : t("bc.nfc.write")}
        </button>

        {busy === "scan" ? (
          <button
            onClick={cancelScan}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] px-3 py-2.5 text-[13px] font-semibold text-[var(--vba-text)]"
          >
            <X className="h-4 w-4" />
            {t("bc.nfc.cancel")}
          </button>
        ) : (
          <button
            disabled={busy !== null}
            onClick={() => void doScan()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] px-3 py-2.5 text-[13px] font-semibold text-[var(--vba-text)] disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" />
            {t("bc.nfc.scan")}
          </button>
        )}
        {busy === "scan" ? (
          <p className="text-[12px] text-[var(--vba-text-muted)]">{t("bc.nfc.scanning")}</p>
        ) : null}
      </div>
    </div>
  );
}

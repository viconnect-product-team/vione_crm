import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2, X, Zap, RefreshCw } from "lucide-react";
import { QrCanvas } from "@/components/member/QrCanvas";
import { QrContrastBadge } from "@/components/member/QrContrastBadge";
import { resolveTheme } from "@/lib/business-card/business-card.share";
import { resolveSafeQrColors } from "@/lib/qr-contrast";
import {
  SCAN_WINDOW_MS,
  buildScanToken,
  subscribeScanEvents,
  type ScanEvent,
} from "@/lib/card-scan";
import { useT } from "@/lib/i18n";

/**
 * Presenter fast-scan mode: shows a large QR that rotates every
 * {@link SCAN_WINDOW_MS} and live-updates the scan status pill via the
 * `card-scan:{slug}` broadcast channel.
 */
export function FastScanModal({
  slug,
  themeId,
  onClose,
}: {
  slug: string;
  themeId?: string | null;
  onClose: () => void;
}) {
  const t = useT();
  const theme = useMemo(() => resolveTheme(themeId ?? null), [themeId]);
  const safeQr = useMemo(
    () =>
      resolveSafeQrColors({
        requestedDark: theme.text,
        requestedLight: theme.surface,
        theme,
      }),
    [theme],
  );

  const [token, setToken] = useState(() => buildScanToken());
  const [issuedAt, setIssuedAt] = useState<number>(() => Date.now());
  const [remainingMs, setRemainingMs] = useState<number>(SCAN_WINDOW_MS);
  const [status, setStatus] = useState<{
    kind: "idle" | "success" | "invalid";
    at?: number;
    reason?: ScanEvent["reason"];
  }>({ kind: "idle" });
  const statusResetRef = useRef<number | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/b/${slug}?s=${encodeURIComponent(token)}`;

  // Rotate token on the window boundary.
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const elapsed = now - issuedAt;
      const remaining = Math.max(0, SCAN_WINDOW_MS - elapsed);
      setRemainingMs(remaining);
      if (remaining <= 0) {
        setToken(buildScanToken(now));
        setIssuedAt(now);
      }
    };
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [issuedAt]);

  // Subscribe to scanner broadcasts.
  useEffect(() => {
    const unsub = subscribeScanEvents(slug, (ev) => {
      setStatus({ kind: ev.ok ? "success" : "invalid", at: ev.at, reason: ev.reason });
      if (statusResetRef.current) window.clearTimeout(statusResetRef.current);
      statusResetRef.current = window.setTimeout(() => setStatus({ kind: "idle" }), 6_000);
    });
    return () => {
      unsub();
      if (statusResetRef.current) window.clearTimeout(statusResetRef.current);
    };
  }, [slug]);

  // Close on ESC.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pct = Math.max(0, Math.min(1, remainingMs / SCAN_WINDOW_MS));
  const seconds = Math.ceil(remainingMs / 1000);

  const rotateNow = () => {
    const now = Date.now();
    setToken(buildScanToken(now));
    setIssuedAt(now);
  };

  const liveMsg =
    status.kind === "success"
      ? t("bc.fastScan.status.success")
      : status.kind === "invalid"
        ? t("bc.fastScan.status.invalid")
        : t("bc.fastScan.status.waiting");

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fast-scan-title"
      onClick={onClose}
    >
      <div
        className="vba-card relative w-full max-w-sm overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--vba-border-soft)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]"
              aria-hidden="true"
            >
              <Zap className="h-4 w-4" />
            </span>
            <h3 id="fast-scan-title" className="text-[15px] font-semibold text-[var(--vba-text)]">
              {t("bc.fastScan.title")}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t("bc.share.close")}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--vba-text-muted)] hover:bg-[var(--vba-gold-soft)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 px-4 py-5">
          {/* QR + circular countdown */}
          <div className="relative">
            <QrCanvas
              value={url}
              size={240}
              dark={safeQr.dark}
              light={safeQr.light}
              accent={theme.accent}
            />
            <CountdownRing pct={pct} color={theme.accent} />
          </div>
          <QrContrastBadge report={safeQr.report} substituted={safeQr.substituted} />

          {/* Status pill */}
          <StatusPill kind={status.kind} label={liveMsg} at={status.at} />

          {/* Countdown + rotate */}
          <div className="flex w-full items-center justify-between text-[12px] text-[var(--vba-text-muted)]">
            <span>{t("bc.fastScan.nextIn").replace("{s}", String(seconds))}</span>
            <button
              type="button"
              onClick={rotateNow}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[var(--vba-text)] hover:bg-[var(--vba-gold-soft)]"
              aria-label={t("bc.fastScan.rotateNow")}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("bc.fastScan.rotateNow")}
            </button>
          </div>

          <p className="text-center text-[12px] text-[var(--vba-text-muted)]">
            {t("bc.fastScan.hint")}
          </p>

          {/* SR-only live region for realtime status updates. */}
          <div className="sr-only" role="status" aria-live="polite">
            {liveMsg}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Circular progress ring overlaid on the QR. */
function CountdownRing({ pct, color }: { pct: number; color: string }) {
  const size = 264;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <svg
      className="pointer-events-none absolute inset-0 -m-3"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 240ms linear" }}
      />
    </svg>
  );
}

/** Live status pill: waiting / success / invalid. */
function StatusPill({
  kind,
  label,
  at,
}: {
  kind: "idle" | "success" | "invalid";
  label: string;
  at?: number;
}) {
  const t = useT();
  const time = at
    ? new Date(at).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  if (kind === "success") {
    return (
      <div className="flex w-full items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-success">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <div className="flex-1 text-[13px] font-semibold">{label}</div>
        {time ? <span className="text-[11px] opacity-70">{time}</span> : null}
      </div>
    );
  }
  if (kind === "invalid") {
    return (
      <div className="flex w-full items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
        <XCircle className="h-4 w-4 shrink-0" />
        <div className="flex-1 text-[13px] font-semibold">
          {label}
          <span className="ml-1 font-normal opacity-70">{t("bc.fastScan.invalidHint")}</span>
        </div>
        {time ? <span className="text-[11px] opacity-70">{time}</span> : null}
      </div>
    );
  }
  return (
    <div className="flex w-full items-center gap-2 rounded-xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] px-3 py-2 text-[var(--vba-text-muted)]">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      <div className="flex-1 text-[13px]">{label}</div>
    </div>
  );
}

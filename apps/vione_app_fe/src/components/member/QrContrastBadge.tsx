// Small inline warning shown next to a QR when the current template's colour
// pairing risks scannability. Renders nothing when the pairing is safe.

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { QrContrastReport } from "@/lib/qr-contrast";

export function QrContrastBadge({
  report,
  substituted,
  onApplySuggestion,
  className,
  compact = false,
}: {
  report: QrContrastReport;
  /** True when the QR is already rendered with auto-suggested colours. */
  substituted?: boolean;
  /** Optional action: apply the safe suggestion to persistent state. */
  onApplySuggestion?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const t = useT();
  if (report.safe && !substituted) return null;

  const tone =
    report.level === "fail" || report.hadInvalidInput
      ? "bg-destructive text-destructive border-destructive"
      : report.level === "warn"
        ? "bg-warning text-warning border-warning"
        : "bg-success text-success border-success";

  const icon =
    substituted && report.safe ? (
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
    ) : (
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
    );

  const label = substituted
    ? t("qr.contrast.autoApplied")
    : report.hadInvalidInput
      ? t("qr.contrast.gradientUnsafe")
      : report.level === "fail"
        ? t("qr.contrast.failLabel")
        : t("qr.contrast.warnLabel");

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium",
        tone,
        className,
      )}
      title={`${t("qr.contrast.ratioLabel")}: ${report.ratio.toFixed(2)}:1`}
    >
      {icon}
      <span>{label}</span>
      {!compact && <span className="opacity-70">({report.ratio.toFixed(1)}:1)</span>}
      {onApplySuggestion && !substituted && !report.safe && (
        <button
          type="button"
          onClick={onApplySuggestion}
          className="ml-1 underline underline-offset-2 hover:no-underline"
        >
          {t("qr.contrast.useSuggested")}
        </button>
      )}
    </div>
  );
}

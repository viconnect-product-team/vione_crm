// BC-Mobile-4A — one candidate field row. Confidence is a TEXT chip (never
// color-only, never raw machine decimals) so review weight is accessible.

import { CheckCircle2, AlertCircle, HelpCircle, type LucideIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  confidenceBand,
  type CandidateField,
  type CandidatePhone,
  type ConfidenceBand,
} from "@/lib/business-connect/mobile/card-scan.types";

const BAND_ICON: Record<ConfidenceBand, LucideIcon> = {
  clear: CheckCircle2,
  review: AlertCircle,
  unclear: HelpCircle,
};

const BAND_KEY = {
  clear: "bc.mobile.cardScan.confidence.clear",
  review: "bc.mobile.cardScan.confidence.review",
  unclear: "bc.mobile.cardScan.confidence.unclear",
} as const;

export function ConfidenceChip({ confidence }: { confidence: number }) {
  const t = useT();
  const band = confidenceBand(confidence);
  const Icon = BAND_ICON[band];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--bc-mobile-muted)]">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
      {t(BAND_KEY[band])}
    </span>
  );
}

const PHONE_LABEL_KEY = {
  mobile: "bc.mobile.cardScan.phone.mobile",
  office: "bc.mobile.cardScan.phone.office",
  hotline: "bc.mobile.cardScan.phone.hotline",
  fax: "bc.mobile.cardScan.phone.fax",
} as const;

export function CandidateFieldDisplay({
  label,
  field,
}: {
  label?: string;
  field: CandidateField | CandidatePhone;
}) {
  const t = useT();
  const phoneLabel = "label" in field && field.label ? field.label : undefined;
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        {label ? (
          <span className="block text-[11px] font-medium uppercase tracking-wide text-[var(--bc-mobile-muted)]">
            {label}
          </span>
        ) : null}
        <span className="block break-words text-[15px] text-[var(--bc-mobile-text)]">
          {field.value}
        </span>
        {phoneLabel ? (
          <span className="mt-0.5 inline-block text-[12px] text-[var(--bc-mobile-muted)]">
            {t(PHONE_LABEL_KEY[phoneLabel])}
          </span>
        ) : null}
      </div>
      <ConfidenceChip confidence={field.confidence} />
    </div>
  );
}

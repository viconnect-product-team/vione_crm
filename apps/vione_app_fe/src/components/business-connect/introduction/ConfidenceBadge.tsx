// BC-6.1 — Confidence badge.
import { useT } from "@/lib/i18n";
import type { IntroductionConfidence } from "@/lib/graph";

const STYLES: Record<IntroductionConfidence, string> = {
  high: "bg-success text-success dark:bg-success/40 dark:text-success",
  medium: "bg-warning text-warning dark:bg-warning/40 dark:text-warning",
  low: "bg-muted text-muted-foreground",
};

export function ConfidenceBadge({ confidence }: { confidence: IntroductionConfidence }) {
  const t = useT();
  const label =
    confidence === "high"
      ? t("bc.intro.confidence.high")
      : confidence === "medium"
        ? t("bc.intro.confidence.medium")
        : t("bc.intro.confidence.low");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[confidence]}`}
      data-confidence={confidence}
    >
      {label}
    </span>
  );
}

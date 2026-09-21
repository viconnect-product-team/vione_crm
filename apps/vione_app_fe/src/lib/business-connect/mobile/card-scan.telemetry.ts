// BC-Mobile-4A — observability with a hard privacy boundary.
//
// Allowlisted metric names + numeric latency ONLY. Never log: names, phones,
// emails, OCR text, card image references, scan contents, or user identifiers
// beyond the platform's own request context.

const ALLOWED_METRICS = new Set([
  "OCR_REQUESTED",
  "OCR_SUCCEEDED",
  "OCR_UNUSABLE",
  "OCR_FAILED",
  // BC-Mobile-4B — privacy-safe review/save funnel. No PII, ever.
  "OCR_REVIEW_OPENED",
  "OCR_REVIEW_SAVED_NEW",
  "OCR_REVIEW_MATCHED_EXISTING",
  "OCR_REVIEW_AMBIGUOUS",
  "OCR_REVIEW_CANCELLED",
  "OCR_REVIEW_SESSION_EXPIRED",
  // BC-Mobile-4B — instant .vcf export from review. Numeric latency only.
  "OCR_REVIEW_VCF_PREVIEW_OPENED",
  "OCR_REVIEW_VCF_EXPORTED_SHARED",
  "OCR_REVIEW_VCF_EXPORTED_DOWNLOADED",
  "OCR_REVIEW_VCF_CANCELLED",
  "OCR_REVIEW_VCF_FAILED",
] as const);

export type CardScanMetric =
  | "OCR_REQUESTED"
  | "OCR_SUCCEEDED"
  | "OCR_UNUSABLE"
  | "OCR_FAILED"
  | "OCR_REVIEW_OPENED"
  | "OCR_REVIEW_SAVED_NEW"
  | "OCR_REVIEW_MATCHED_EXISTING"
  | "OCR_REVIEW_AMBIGUOUS"
  | "OCR_REVIEW_CANCELLED"
  | "OCR_REVIEW_SESSION_EXPIRED"
  | "OCR_REVIEW_VCF_PREVIEW_OPENED"
  | "OCR_REVIEW_VCF_EXPORTED_SHARED"
  | "OCR_REVIEW_VCF_EXPORTED_DOWNLOADED"
  | "OCR_REVIEW_VCF_CANCELLED"
  | "OCR_REVIEW_VCF_FAILED";

export function reportCardScanMetric(name: CardScanMetric, meta?: { latencyMs?: number }): void {
  if (!ALLOWED_METRICS.has(name)) return;
  try {
    const latency = meta?.latencyMs != null ? ` ${Math.max(0, Math.round(meta.latencyMs))}ms` : "";
    console.info(`[bc-ocr] ${name}${latency}`);
  } catch {
    // Telemetry must never throw into the user path.
  }
}

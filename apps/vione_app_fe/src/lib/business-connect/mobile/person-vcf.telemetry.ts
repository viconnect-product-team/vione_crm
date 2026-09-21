// Person Detail .vcf export — observability with a hard privacy boundary.
//
// Allowlisted metric names + numeric latency ONLY. Never log: the person's
// name, filename, contact fields, vCard content, or person/user identifiers.
// Client-side counterpart of card-scan.telemetry.ts (same convention).

const ALLOWED_METRICS = new Set([
  "PERSON_VCF_PREVIEW_OPENED",
  "PERSON_VCF_EXPORTED_SHARED",
  "PERSON_VCF_EXPORTED_DOWNLOADED",
  "PERSON_VCF_EXPORT_CANCELLED",
  "PERSON_VCF_EXPORT_FAILED",
] as const);

export type PersonVcfMetric =
  | "PERSON_VCF_PREVIEW_OPENED"
  | "PERSON_VCF_EXPORTED_SHARED"
  | "PERSON_VCF_EXPORTED_DOWNLOADED"
  | "PERSON_VCF_EXPORT_CANCELLED"
  | "PERSON_VCF_EXPORT_FAILED";

export function reportPersonVcfMetric(name: PersonVcfMetric, meta?: { latencyMs?: number }): void {
  if (!ALLOWED_METRICS.has(name)) return;
  try {
    const latency = meta?.latencyMs != null ? ` ${Math.max(0, Math.round(meta.latencyMs))}ms` : "";
    console.info(`[bc-person-vcf] ${name}${latency}`);
  } catch {
    // Telemetry must never throw into the user path.
  }
}

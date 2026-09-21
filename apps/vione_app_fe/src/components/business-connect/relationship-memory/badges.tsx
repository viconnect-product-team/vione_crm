// BC-9.1 Turn C1 — Small visual primitives for Relationship Memory read UI.
//
// Pure presentational components. No SDK/data access. Uses only semantic
// design tokens from the shadcn theme (no hardcoded colors).

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import type {
  RelationshipMemoryStatus,
  RelationshipMemoryKind,
  RelationshipMemoryAllowedSourceDomain,
} from "@/lib/business-connect/relationship-memory";
import { hasTKey } from "@/lib/i18n";

/* ---------------- Status ---------------- */

type StatusVariant = "default" | "secondary" | "outline" | "destructive";

function statusVariant(s: RelationshipMemoryStatus): StatusVariant {
  switch (s) {
    case "active":
      return "default";
    case "candidate":
      return "secondary";
    case "superseded":
    case "expired":
      return "outline";
    case "dismissed":
      return "destructive";
    default:
      return "outline";
  }
}

export function statusLabelKey(s: RelationshipMemoryStatus | string) {
  const key = `bc.memory.status.${s}`;
  return hasTKey(key) ? key : "bc.memory.status.unknown";
}

export function RelationshipMemoryStatusBadge({ status }: { status: RelationshipMemoryStatus }) {
  const t = useT();
  const label = t(statusLabelKey(status) as never);
  return (
    <Badge variant={statusVariant(status)} aria-label={t("bc.memory.status.a11y", { label })}>
      {label}
    </Badge>
  );
}

/* ---------------- Confidence ---------------- */

export type ConfidenceBand = "low" | "medium" | "high" | "verified";

export function confidenceBand(v: number, sourceCount = 0): ConfidenceBand {
  const c = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
  if (c >= 0.9 && sourceCount >= 3) return "verified";
  if (c >= 0.75) return "high";
  if (c >= 0.5) return "medium";
  return "low";
}

export function RelationshipMemoryConfidenceBadge({
  confidence,
  sourceCount = 0,
}: {
  confidence: number;
  sourceCount?: number;
}) {
  const t = useT();
  const band = confidenceBand(confidence, sourceCount);
  const label = t(`bc.memory.confidence.${band}` as never);
  const variant: StatusVariant =
    band === "verified" ? "default" : band === "high" ? "secondary" : "outline";
  return (
    <Badge
      variant={variant}
      title={t("bc.memory.confidence.explain")}
      aria-label={t("bc.memory.confidence.a11y", { label })}
    >
      {label}
    </Badge>
  );
}

/* ---------------- Freshness ---------------- */

export type FreshnessBand = "fresh" | "recent" | "aging" | "stale";

export function freshnessFromIso(iso: string | null | undefined): FreshnessBand {
  if (!iso) return "stale";
  const ms = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (ms <= 30 * day) return "fresh";
  if (ms <= 90 * day) return "recent";
  if (ms <= 365 * day) return "aging";
  return "stale";
}

export function RelationshipMemoryFreshnessBadge({
  lastObservedAt,
}: {
  lastObservedAt: string | null;
}) {
  const t = useT();
  const band = freshnessFromIso(lastObservedAt);
  const label = t(`bc.memory.freshness.${band}` as never);
  return (
    <Badge variant="outline" aria-label={t("bc.memory.freshness.a11y", { label })}>
      {label}
    </Badge>
  );
}

/* ---------------- Kind + Source labels ---------------- */

export function kindLabelKey(k: RelationshipMemoryKind | string) {
  const key = `bc.memory.kind.${k}`;
  return hasTKey(key) ? key : "bc.memory.kind.unknown";
}

export function sourceLabelKey(d: RelationshipMemoryAllowedSourceDomain | string) {
  const key = `bc.memory.source.${d}`;
  return hasTKey(key) ? key : "bc.memory.source.unknown";
}

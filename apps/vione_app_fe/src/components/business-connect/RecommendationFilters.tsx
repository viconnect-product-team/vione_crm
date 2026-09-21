// BC-4.5 — Filter chips for the recommendation feed.
//
// Filter is a *client-side reason predicate*: it does not change what the
// engine returns. Rationale: the engine already applies category caps +
// diversity reranking; filtering client-side preserves that global ordering
// and avoids over-fetching. The backing SDK does not accept a category
// filter, so we intentionally do NOT invent one.

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RecommendationFilterKey } from "@/hooks/use-recommendations";
import type { RecommendationReasonCode } from "@/lib/graph";

const FILTERS: ReadonlyArray<{ key: RecommendationFilterKey; label: string }> = [
  { key: "all", label: "bc.rec.filter.all" },
  { key: "mutual", label: "bc.rec.filter.mutual" },
  { key: "company", label: "bc.rec.filter.company" },
  { key: "association", label: "bc.rec.filter.association" },
  { key: "community", label: "bc.rec.filter.community" },
  { key: "event", label: "bc.rec.filter.event" },
];

const REASON_BUCKET: Record<RecommendationFilterKey, ReadonlySet<RecommendationReasonCode>> = {
  all: new Set([
    "MUTUAL_CONNECTIONS",
    "SHARED_COMPANY",
    "SHARED_ASSOCIATION",
    "SHARED_COMMUNITY",
    "SHARED_EVENT",
    "SHARED_MEETING",
    "INTRODUCTION_PATH",
    "TRUSTED_MUTUAL",
  ]),
  mutual: new Set(["MUTUAL_CONNECTIONS", "TRUSTED_MUTUAL"]),
  company: new Set(["SHARED_COMPANY"]),
  association: new Set(["SHARED_ASSOCIATION"]),
  community: new Set(["SHARED_COMMUNITY"]),
  event: new Set(["SHARED_EVENT", "SHARED_MEETING"]),
};

export function matchesFilter(
  reasons: ReadonlyArray<{ code: RecommendationReasonCode }>,
  filter: RecommendationFilterKey,
): boolean {
  if (filter === "all") return true;
  const bucket = REASON_BUCKET[filter];
  return reasons.some((r) => bucket.has(r.code));
}

interface Props {
  value: RecommendationFilterKey;
  onChange: (next: RecommendationFilterKey) => void;
}

export function RecommendationFilters({ value, onChange }: Props) {
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t("bc.rec.filter.aria")}
      className="flex flex-wrap items-center gap-2"
      data-testid="rec-filters"
    >
      {FILTERS.map((f) => {
        const active = f.key === value;
        return (
          <button
            key={f.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(f.key)}
            data-testid={`rec-filter-${f.key}`}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {}
            {t(f.label as any)}
          </button>
        );
      })}
    </div>
  );
}

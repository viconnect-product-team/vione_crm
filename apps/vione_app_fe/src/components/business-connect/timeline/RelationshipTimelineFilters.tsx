// BC-7.5C — Category filter chips for the relationship timeline.

import { useT, type TKey } from "@/lib/i18n";
import type { RelationshipTimelineCategory } from "@/lib/graph/relationship-timeline";
import type { TimelineFilter } from "./internals";

const CATEGORIES: { key: TimelineFilter; label: TKey }[] = [
  { key: "all", label: "bc.timeline.filter.all" },
  { key: "connection", label: "bc.timeline.category.connection" },
  { key: "introduction", label: "bc.timeline.category.introduction" },
  { key: "meeting", label: "bc.timeline.category.meeting" },
  { key: "card", label: "bc.timeline.category.card" },
  { key: "membership", label: "bc.timeline.category.membership" },
  { key: "work", label: "bc.timeline.category.work" },
];

export interface RelationshipTimelineFiltersProps {
  value: TimelineFilter;
  onChange: (next: TimelineFilter) => void;
  /** Restrict the set of categories to render (host surface may hide some). */
  available?: RelationshipTimelineCategory[];
}

export function RelationshipTimelineFilters({
  value,
  onChange,
  available,
}: RelationshipTimelineFiltersProps) {
  const t = useT();
  const set = available ? new Set(available) : null;
  const items = CATEGORIES.filter(
    (c) => c.key === "all" || !set || set.has(c.key as RelationshipTimelineCategory),
  );
  return (
    <div
      role="group"
      aria-label={t("bc.timeline.filter.label")}
      className="flex flex-wrap gap-2 overflow-x-auto"
    >
      {items.map((c: any) => {
        const active = value === c.key;
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c.key)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onChange("all");
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(c.label)}
          </button>
        );
      })}
    </div>
  );
}

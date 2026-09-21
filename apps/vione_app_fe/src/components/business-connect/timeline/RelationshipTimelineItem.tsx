// BC-7.5C — Individual timeline event card. Uses the presentation registry;
// no per-item network requests, no raw metadata rendering.

import { Link } from "@tanstack/react-router";
// Card component (from PageKit) does not forward arbitrary props, so we render
// the timeline item as a plain styled div to preserve data-* attributes.
import { Button } from "@/components/ui/button";
import { useT, useFmt, hasTKey, type TKey } from "@/lib/i18n";
import type { RelationshipTimelineEventDTO } from "@/lib/graph/relationship-timeline";
import { UNKNOWN_PRESENTATION, presentationFor } from "@/lib/graph/relationship-timeline";
import { ctaHrefFor } from "./internals";

export interface RelationshipTimelineItemProps {
  event: RelationshipTimelineEventDTO;
  onOpenDetail?: (event: RelationshipTimelineEventDTO) => void;
}

const IMPORTANCE_CLASS: Record<string, string> = {
  high: "border-l-4 border-l-primary",
  normal: "border-l-4 border-l-muted-foreground/40",
  low: "border-l-4 border-l-border",
};

export function RelationshipTimelineItem({ event, onOpenDetail }: RelationshipTimelineItemProps) {
  const t = useT();
  const fmt = useFmt();
  const pres = presentationFor(event.eventType);
  const isUnknown = pres === UNKNOWN_PRESENTATION;

  const title = hasTKey(event.summaryKey) ? t(event.summaryKey as TKey) : t("bc.timeline.unknown");
  const categoryKey = `bc.timeline.category.${event.eventCategory}`;
  const categoryLabel = hasTKey(categoryKey) ? t(categoryKey as TKey) : event.eventCategory;
  const Icon = pres.icon;
  const href = ctaHrefFor(pres.cta);

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] ${IMPORTANCE_CLASS[pres.importance]}`}
      data-testid="timeline-item"
      data-event-kind={event.eventType}
      data-importance={pres.importance}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span aria-label={t("bc.timeline.a11y.time")}>{fmt.date(event.occurredAt)}</span>
            {" · "}
            <span
              className="inline-flex items-center rounded-full border border-border px-1.5 py-0.5"
              aria-label={t("bc.timeline.a11y.category")}
            >
              {categoryLabel || event.eventCategory}
            </span>
          </p>
        </div>
        {pres.cta.kind !== "none" && href && !isUnknown ? (
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to={href}>{t(pres.cta.label)}</Link>
          </Button>
        ) : null}
        {onOpenDetail ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            aria-label={t("bc.timeline.detail.title")}
            onClick={() => onOpenDetail(event)}
          >
            {t("bc.timeline.detail.title")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// BC-7.5C — Timeline shared internals: types, date bucketing, CTA resolver.

import type { TKey } from "@/lib/i18n";
import type {
  RelationshipTimelineCategory,
  RelationshipTimelineEventDTO,
} from "@/lib/graph/relationship-timeline";
import type { TimelineSourceCTA } from "@/lib/graph/relationship-timeline";

export type TimelineFilter = RelationshipTimelineCategory | "all";

export type TimelineBucketKey = "today" | "yesterday" | "week" | "month" | "older";

export interface TimelineBucket {
  key: TimelineBucketKey;
  labelKey: TKey;
  items: RelationshipTimelineEventDTO[];
}

const BUCKET_LABELS: Record<TimelineBucketKey, TKey> = {
  today: "bc.timeline.group.today",
  yesterday: "bc.timeline.group.yesterday",
  week: "bc.timeline.group.week",
  month: "bc.timeline.group.month",
  older: "bc.timeline.group.older",
};

/** Groups events into human date buckets. Preserves incoming order (occurred_at DESC). */
export function bucketize(
  events: RelationshipTimelineEventDTO[],
  now: number = Date.now(),
): TimelineBucket[] {
  const day = 24 * 60 * 60 * 1000;
  const empty: Record<TimelineBucketKey, RelationshipTimelineEventDTO[]> = {
    today: [],
    yesterday: [],
    week: [],
    month: [],
    older: [],
  };
  for (const e of events) {
    const age = (now - new Date(e.occurredAt).getTime()) / day;
    if (age < 1) empty.today.push(e);
    else if (age < 2) empty.yesterday.push(e);
    else if (age < 7) empty.week.push(e);
    else if (age < 31) empty.month.push(e);
    else empty.older.push(e);
  }
  return (Object.keys(empty) as TimelineBucketKey[])
    .map((k) => ({ key: k, labelKey: BUCKET_LABELS[k], items: empty[k] }))
    .filter((b) => b.items.length > 0);
}

/** Route target for a source CTA, or null when unsafe/unavailable. */
export function ctaHrefFor(cta: TimelineSourceCTA): string | null {
  switch (cta.kind) {
    case "introduction":
      return "/business-connect/introductions/requests";
    case "meeting":
      return "/business-connect/meetings";
    case "outcome":
      return "/business-connect/introductions/outcomes";
    case "connection":
      return "/business-connect/connections";
    case "none":
    default:
      return null;
  }
}

// BC-7.5C — Date-bucket group section for the relationship timeline.

import { useT } from "@/lib/i18n";
import type { RelationshipTimelineEventDTO } from "@/lib/graph/relationship-timeline";
import { RelationshipTimelineItem } from "./RelationshipTimelineItem";
import type { TimelineBucket } from "./internals";

export interface RelationshipTimelineGroupProps {
  bucket: TimelineBucket;
  onOpenDetail?: (event: RelationshipTimelineEventDTO) => void;
}

export function RelationshipTimelineGroup({
  bucket,
  onOpenDetail,
}: RelationshipTimelineGroupProps) {
  const t = useT();
  const headingId = `bc-tl-grp-${bucket.key}`;
  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {t(bucket.labelKey)}
      </h2>
      <ul role="list" className="space-y-2">
        {bucket.items.map((e: any) => (
          <li key={e.id}>
            <RelationshipTimelineItem event={e} onOpenDetail={onOpenDetail} />
          </li>
        ))}
      </ul>
    </section>
  );
}

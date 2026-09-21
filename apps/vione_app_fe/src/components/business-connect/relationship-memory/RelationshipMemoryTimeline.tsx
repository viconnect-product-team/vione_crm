// BC-9.1 Turn C1 — Memory timeline: date-bucketed view of memory observations.

import { useMemo } from "react";
import { Card } from "@/components/dashboard/PageKit";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, useFmt } from "@/lib/i18n";
import type {
  RelationshipMemoryDTO,
  RelationshipMemoryListFilters,
} from "@/lib/business-connect/relationship-memory";
import { useRelationshipMemories } from "@/hooks/use-relationship-memory";
import {
  RelationshipMemoryConfidenceBadge,
  RelationshipMemoryStatusBadge,
  kindLabelKey,
} from "./badges";
import { memoryDisplayText } from "./display";

type Bucket = "current" | "recent" | "historical" | "archived";
const DAY = 86_400_000;

function bucketFor(iso: string): Bucket {
  const age = Date.now() - new Date(iso).getTime();
  if (age <= 30 * DAY) return "current";
  if (age <= 90 * DAY) return "recent";
  if (age <= 365 * DAY) return "historical";
  return "archived";
}

const BUCKETS: Bucket[] = ["current", "recent", "historical", "archived"];

export interface RelationshipMemoryTimelineProps {
  filters?: RelationshipMemoryListFilters;
}

export function RelationshipMemoryTimeline({ filters }: RelationshipMemoryTimelineProps) {
  const t = useT();
  const fmt = useFmt();
  const query = useRelationshipMemories(filters);

  const grouped = useMemo(() => {
    const map: Record<Bucket, RelationshipMemoryDTO[]> = {
      current: [],
      recent: [],
      historical: [],
      archived: [],
    };
    for (const m of query.data?.items ?? []) map[bucketFor(m.lastObservedAt)].push(m);
    for (const b of BUCKETS) {
      map[b].sort(
        (a, b2) => new Date(b2.lastObservedAt).getTime() - new Date(a.lastObservedAt).getTime(),
      );
    }
    return map;
  }, [query.data]);

  if (query.isLoading) {
    return (
      <div role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">{t("bc.memory.loading")}</span>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  const total = BUCKETS.reduce((n, b) => n + grouped[b].length, 0);
  if (total === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("bc.memory.empty.noActive")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {BUCKETS.map((bucket) =>
        grouped[bucket].length === 0 ? null : (
          <section key={bucket} aria-label={t(`bc.memory.timeline.group.${bucket}` as never)}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`bc.memory.timeline.group.${bucket}` as never)}
            </h3>
            <ol role="list" className="relative space-y-3 border-l border-border pl-4">
              {grouped[bucket].map((m) => (
                <li key={m.id} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary"
                  />
                  <Card className="p-3">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{fmt.date(m.lastObservedAt)}</span>
                      <span>·</span>
                      <span>{t(kindLabelKey(m.kind) as never)}</span>
                      <RelationshipMemoryStatusBadge status={m.status} />
                      <RelationshipMemoryConfidenceBadge
                        confidence={m.confidence}
                        sourceCount={m.sourceCount}
                      />
                    </div>
                    <p className="text-sm text-foreground">{memoryDisplayText(m)}</p>
                  </Card>
                </li>
              ))}
            </ol>
          </section>
        ),
      )}
    </div>
  );
}

// BC-7.5C — Primary Relationship Timeline component.
//
// SDK-only via React Query hooks. No direct graph_timeline_events access.
// Two modes:
//   - mode="viewer": full timeline for a person node.
//   - mode="pair":   timeline for a viewer / counterpart pair.
//
// Read-only. No mutations. No per-item network requests. Bounded cursor
// pagination inherited from RelationshipTimelineSDK.

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import {
  useRelationshipTimeline,
  useRelationshipPairTimeline,
} from "@/hooks/use-relationship-timeline";
import type { RelationshipTimelineEventDTO } from "@/lib/graph/relationship-timeline";
import { RelationshipTimelineFilters } from "./RelationshipTimelineFilters";
import { RelationshipTimelineGroup } from "./RelationshipTimelineGroup";
import {
  RelationshipTimelineEmptyState,
  RelationshipTimelineError,
  RelationshipTimelineLoading,
} from "./RelationshipTimelineStates";
import { bucketize, type TimelineFilter } from "./internals";

interface CommonProps {
  onOpenDetail?: (event: RelationshipTimelineEventDTO) => void;
  showRefresh?: boolean;
  showFilters?: boolean;
}

export type RelationshipTimelineProps =
  | ({ mode?: "viewer"; nodeId: string | null | undefined } & CommonProps)
  | ({
      mode: "pair";
      nodeA: string | null | undefined;
      nodeB: string | null | undefined;
    } & CommonProps);

export function RelationshipTimeline(props: RelationshipTimelineProps) {
  const t = useT();
  const [filter, setFilter] = useState<TimelineFilter>("all");

  const isPair = props.mode === "pair";

  const viewerQuery = useRelationshipTimeline({
    nodeId: !isPair ? ((props as { nodeId?: string }).nodeId ?? "") : "",
    categories: filter === "all" ? undefined : [filter],
    enabled: !isPair && Boolean((props as { nodeId?: string }).nodeId),
  });
  const pairQuery = useRelationshipPairTimeline({
    nodeA: isPair ? ((props as { nodeA?: string }).nodeA ?? "") : "",
    nodeB: isPair ? ((props as { nodeB?: string }).nodeB ?? "") : "",
    enabled:
      isPair &&
      Boolean((props as { nodeA?: string }).nodeA) &&
      Boolean((props as { nodeB?: string }).nodeB),
  });

  const query = isPair ? pairQuery : viewerQuery;

  const events = useMemo(() => {
    const raw = (query.data?.pages ?? []).flatMap((p) => p.items);
    // Client-side category filter for pair mode (SDK-pair path has no filter arg).
    if (isPair && filter !== "all") {
      return raw.filter((e: any) => e.eventCategory === filter);
    }
    return raw;
  }, [query.data, filter, isPair]);

  const groups = useMemo(() => bucketize(events), [events]);

  const isLoading = query.isLoading;
  const isError = query.isError;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {props.showFilters !== false ? (
          <RelationshipTimelineFilters value={filter} onChange={setFilter} />
        ) : (
          <span />
        )}
        {props.showRefresh !== false ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            aria-label={t("bc.timeline.refresh")}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {t("bc.timeline.refresh")}
          </Button>
        ) : null}
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-busy={isLoading}
        className="sr-only"
        data-testid="bc-timeline-announcement"
      >
        {isLoading ? t("bc.timeline.loading") : t("bc.timeline.count", { n: events.length })}
      </div>

      {isLoading ? (
        <RelationshipTimelineLoading />
      ) : isError ? (
        <RelationshipTimelineError onRetry={() => void query.refetch()} />
      ) : events.length === 0 ? (
        <RelationshipTimelineEmptyState showConnectionsCta={!isPair} />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <RelationshipTimelineGroup key={g.key} bucket={g} onOpenDetail={props.onOpenDetail} />
          ))}
          {query.hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage
                  ? t("bc.timeline.loadingMore")
                  : t("bc.timeline.loadMore")}
              </Button>
            </div>
          ) : null}
          <p className="pt-2 text-center text-[10px] text-muted-foreground">
            {t("bc.timeline.disclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}

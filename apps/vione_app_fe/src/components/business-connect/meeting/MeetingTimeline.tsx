// BC-7.8 Turn C — Meeting-scoped timeline component.
//
// Reads business_meeting_events for a single meeting via
// useMeetingWorkspaceTimeline. Pure presentation: RLS handles authorization,
// service.server projects PII-safe metadata, and this component only formats
// timestamps and renders text keys.

import { Clock } from "lucide-react";
import { useMeetingWorkspaceTimeline } from "@/lib/meeting/workspace/hooks";
import { baseLang, hasTKey, useLang, useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { MeetingWorkspaceTimelineEventDTO } from "@/lib/meeting/workspace/types";

function formatOccurredAt(iso: string, lang: "vi" | "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function eventLabel(event: MeetingWorkspaceTimelineEventDTO, t: ReturnType<typeof useT>): string {
  return hasTKey(event.summaryKey) ? t(event.summaryKey) : event.eventType;
}

export interface MeetingTimelineProps {
  meetingId: string;
}

export function MeetingTimeline({ meetingId }: MeetingTimelineProps) {
  const t = useT();
  const { lang } = useLang();
  const q = useMeetingWorkspaceTimeline(meetingId);

  if (q.isLoading) {
    return (
      <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {t("bc.meetings.workspace.loading")}
      </div>
    );
  }

  if (q.isError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
      >
        {t("bc.meetings.workspace.error")}
      </div>
    );
  }

  const items = q.data?.pages.flatMap((p) => p.items) ?? [];

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("bc.meetings.workspace.timeline.empty")}</p>
    );
  }

  return (
    <div className="space-y-3">
      <ol
        role="list"
        aria-label={t("bc.meetings.workspace.detail.timeline")}
        className="relative space-y-4 border-l border-border pl-4"
      >
        {items.map((event) => (
          <li key={event.id} className="relative">
            <span
              aria-hidden
              className="absolute -left-[21px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border bg-background"
            >
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
            </span>
            <div className="text-sm font-medium text-foreground">{eventLabel(event, t)}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              <time dateTime={event.occurredAt}>{formatOccurredAt(event.occurredAt, baseLang(lang))}</time>
              {event.actorIsViewer ? (
                <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {t("bc.meetings.workspace.timeline.you")}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {q.hasNextPage ? (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => q.fetchNextPage()}
            disabled={q.isFetchingNextPage}
          >
            {q.isFetchingNextPage
              ? t("bc.meetings.workspace.loading")
              : t("bc.meetings.workspace.timeline.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

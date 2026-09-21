// BC-7.8 Turn B — Workspace bucket list (paginated).

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useT, type TKey } from "@/lib/i18n";
import { useMeetingWorkspaceList } from "@/lib/meeting/workspace/hooks";
import { MEETING_WORKSPACE_PAGE_SIZE_DEFAULT } from "@/lib/meeting/workspace/types";
import type { MeetingWorkspaceBucket } from "@/lib/meeting/workspace/types";
import { MeetingWorkspaceCard } from "./MeetingWorkspaceCard";

const EMPTY_KEY: Record<MeetingWorkspaceBucket, TKey> = {
  overview: "bc.meetings.workspace.empty.overview",
  needs_action: "bc.meetings.workspace.empty.needs_action",
  upcoming: "bc.meetings.workspace.empty.upcoming",
  unscheduled: "bc.meetings.workspace.empty.unscheduled",
  history: "bc.meetings.workspace.empty.history",
};

export function WorkspaceBucketList({ bucket }: { bucket: MeetingWorkspaceBucket }) {
  const t = useT();
  const [cursor, setCursor] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useMeetingWorkspaceList({
    bucket,
    cursor,
    limit: MEETING_WORKSPACE_PAGE_SIZE_DEFAULT,
  });

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground"
      >
        {t("bc.meetings.workspace.loading")}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
      >
        <span>{t("bc.meetings.workspace.error")}</span>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          {t("bc.meetings.workspace.retry")}
        </Button>
      </div>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
        {t(EMPTY_KEY[bucket])}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul
        role="list"
        aria-label={t(("bc.meetings.workspace.tab." + bucket) as TKey)}
        className="space-y-3"
      >
        {items.map((item) => (
          <li key={item.meeting.id}>
            <MeetingWorkspaceCard item={item} />
          </li>
        ))}
      </ul>

      {data?.nextCursor ? (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={() => setCursor(data.nextCursor)}>
            {t("bc.meetings.workspace.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

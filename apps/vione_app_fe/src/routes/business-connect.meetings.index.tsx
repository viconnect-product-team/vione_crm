// BC-7.8 Turn B — Canonical Meetings Workspace route.
// Renders inside the /business-connect layout (AppShell + tabs). Uses derived
// buckets, action resolver output, and consolidated read model. No IDs shown.

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useT, type TKey } from "@/lib/i18n";
import { WorkspaceSummaryCards } from "@/components/business-connect/meeting/workspace/WorkspaceSummaryCards";
import { WorkspaceBucketList } from "@/components/business-connect/meeting/workspace/WorkspaceBucketList";
import type { MeetingWorkspaceBucket } from "@/lib/meeting/workspace/types";
import { MEETING_WORKSPACE_BUCKETS } from "@/lib/meeting/workspace/types";

export const Route = createFileRoute("/business-connect/meetings/")({
  head: () => ({
    meta: [
      { title: "Meetings — Business Connect" },
      { name: "description", content: "Unified meetings workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MeetingsWorkspacePage,
});

const TAB_LABEL: Record<MeetingWorkspaceBucket, TKey> = {
  overview: "bc.meetings.workspace.tab.overview",
  needs_action: "bc.meetings.workspace.tab.needs_action",
  upcoming: "bc.meetings.workspace.tab.upcoming",
  unscheduled: "bc.meetings.workspace.tab.unscheduled",
  history: "bc.meetings.workspace.tab.history",
};

function MeetingsWorkspacePage() {
  const t = useT();
  const [bucket, setBucket] = useState<MeetingWorkspaceBucket>("overview");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("bc.meetings.workspace.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("bc.meetings.workspace.subtitle")}</p>
      </div>

      <WorkspaceSummaryCards />

      <div
        role="tablist"
        aria-label={t("bc.meetings.workspace.title")}
        className="flex flex-wrap gap-1 border-b"
      >
        {MEETING_WORKSPACE_BUCKETS.map((b) => {
          const selected = bucket === b;
          return (
            <button
              key={b}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`ws-panel-${b}`}
              id={`ws-tab-${b}`}
              onClick={() => setBucket(b)}
              className={
                "whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                (selected
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {t(TAB_LABEL[b])}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`ws-panel-${bucket}`} aria-labelledby={`ws-tab-${bucket}`}>
        <WorkspaceBucketList bucket={bucket} />
      </div>
    </div>
  );
}

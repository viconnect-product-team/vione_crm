// BC-7.8 Turn B — Canonical Meeting Detail route.
// Full-page detail hosting scheduling + timeline sections. Reuses existing
// BC-7.7 scheduling components via MeetingSchedulingSection.

import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMeetingWorkspaceDetail } from "@/lib/meeting/workspace/hooks";
import { useMeetingDetail } from "@/hooks/use-business-meetings";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { MeetingSchedulingSection } from "@/components/business-connect/meeting/MeetingSchedulingSection";
import { MeetingTimeline } from "@/components/business-connect/meeting/MeetingTimeline";
import { MeetingOutcomeSection } from "@/components/business-connect/meeting/MeetingOutcomeSection";
import { MeetingFollowUpSection } from "@/components/business-connect/meeting/MeetingFollowUpSection";
import { AgendaSection } from "@/components/business-connect/meeting/collaboration/AgendaSection";
import { SharedNotesSection } from "@/components/business-connect/meeting/collaboration/SharedNotesSection";
import { PrivateNotesSection } from "@/components/business-connect/meeting/collaboration/PrivateNotesSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/business-connect/meetings/$meetingId")({
  head: () => ({
    meta: [{ title: "Meeting — Business Connect" }, { name: "robots", content: "noindex" }],
  }),
  component: MeetingDetailPage,
});

function MeetingDetailPage() {
  const { meetingId } = useParams({ from: "/business-connect/meetings/$meetingId" });
  const t = useT();
  const viewerUserId = useViewerUserId();
  const workspace = useMeetingWorkspaceDetail(meetingId);
  const detail = useMeetingDetail(meetingId);

  const item = workspace.data;
  const isLoading = workspace.isLoading || detail.isLoading;
  const isError = workspace.isError || detail.isError;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
          <Link to="/business-connect/meetings">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("bc.meetings.workspace.back")}
          </Link>
        </Button>

        {isLoading ? (
          <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
            {t("bc.meetings.workspace.loading")}
          </div>
        ) : isError || !item ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {t("bc.meetings.workspace.error")}
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-foreground">
                {item.meeting.title}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="capitalize">
                  {item.meeting.status}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {item.meeting.meetingType.replace(/_/g, " ")}
                </Badge>
                <span>{item.scheduleSummary.timezone}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {detail.data && viewerUserId ? (
        <section aria-label={t("bc.meetings.workspace.detail.scheduling")}>
          <MeetingSchedulingSection detail={detail.data} viewerUserId={viewerUserId} />
        </section>
      ) : null}

      {detail.data && viewerUserId ? (
        <MeetingOutcomeSection
          meetingId={meetingId}
          isOrganizer={detail.data.viewerRole === "organizer"}
        />
      ) : null}

      {detail.data && viewerUserId ? (
        <MeetingFollowUpSection
          meetingId={meetingId}
          viewerUserId={viewerUserId}
          participants={detail.data.participants}
          isViewerParticipant={detail.data.viewerRole !== null}
        />
      ) : null}

      {detail.data && viewerUserId ? (
        <AgendaSection
          meetingId={meetingId}
          canManage={detail.data.viewerRole === "organizer"}
          canRead={detail.data.viewerRole !== null}
        />
      ) : null}

      {detail.data && viewerUserId ? (
        <SharedNotesSection
          meetingId={meetingId}
          isOrganizer={detail.data.viewerRole === "organizer"}
          canRead={detail.data.viewerRole !== null}
        />
      ) : null}

      {detail.data && viewerUserId ? (
        <PrivateNotesSection meetingId={meetingId} canRead={detail.data.viewerRole !== null} />
      ) : null}

      <section
        aria-label={t("bc.meetings.workspace.detail.timeline")}
        className="rounded-xl border bg-card p-4"
      >
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          {t("bc.meetings.workspace.detail.timeline")}
        </h3>
        <MeetingTimeline meetingId={meetingId} />
      </section>
    </div>
  );
}

// BC-7.8 Turn B — MeetingWorkspaceCard.
// Consumes MeetingWorkspaceItemDTO only. Never fetches. Never renders raw IDs.

import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import type { MeetingWorkspaceItemDTO } from "@/lib/meeting/workspace/types";

function viewerRoleKey(role: MeetingWorkspaceItemDTO["viewer"]["role"]): TKey | null {
  switch (role) {
    case "organizer":
      return "bc.meetings.workspace.card.viewerRole.organizer";
    case "required":
      return "bc.meetings.workspace.card.viewerRole.required";
    case "optional":
      return "bc.meetings.workspace.card.viewerRole.optional";
    default:
      return null;
  }
}

export function MeetingWorkspaceCard({ item }: { item: MeetingWorkspaceItemDTO }) {
  const t = useT();
  const { locale } = useFmt();
  const { meeting, viewer, action, scheduleSummary, participantSummary } = item;

  const startLabel = scheduleSummary.startAt
    ? new Date(scheduleSummary.startAt).toLocaleString(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : t("bc.meetings.workspace.card.unscheduled");

  const roleKey = viewerRoleKey(viewer.role);

  return (
    <article
      className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-ring"
      aria-labelledby={`m-${meeting.id}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            id={`m-${meeting.id}-title`}
            className="truncate text-base font-semibold text-foreground"
          >
            {meeting.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {meeting.status}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {meeting.meetingType.replace(/_/g, " ")}
            </Badge>
            {roleKey ? <span>{t(roleKey)}</span> : null}
          </div>
        </div>
        <Button asChild size="sm" variant={action.priority <= 3 ? "default" : "outline"}>
          <Link to="/business-connect/meetings/$meetingId" params={{ meetingId: meeting.id }}>
            {t(action.labelKey as TKey)}
          </Link>
        </Button>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="flex justify-between gap-2 sm:block">
          <dt className="font-medium text-foreground/70">
            {t("bc.meetings.workspace.card.timezone")}
          </dt>
          <dd className="tabular-nums">{scheduleSummary.timezone}</dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="font-medium text-foreground/70">
            {t("bc.meetings.workspace.card.participants")}
          </dt>
          <dd>
            {participantSummary.acceptedCount}/{participantSummary.requiredCount}
          </dd>
        </div>
        <div className="col-span-2 flex justify-between gap-2 sm:block">
          <dt className="font-medium text-foreground/70">
            {t("bc.meetings.workspace.card.source")}
          </dt>
          <dd className="truncate">{startLabel}</dd>
        </div>
      </dl>
    </article>
  );
}

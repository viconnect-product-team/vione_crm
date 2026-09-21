// BC-7.7 Turn C — Meeting-detail scheduling section. Bundles the finder
// (organizer only), the response matrix, and the calendar sync status into
// one collapsible section rendered inside MeetingDetailSheet.

import { Link } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";
import { useT } from "@/lib/i18n";
import { useAvailabilityPreferences } from "@/lib/meeting/calendar/hooks";
import { CommonAvailabilityFinder } from "./CommonAvailabilityFinder";
import { ProposalResponseMatrix } from "./ProposalResponseMatrix";
import { CalendarSyncStatus } from "./CalendarSyncStatus";
import type { MeetingDetailDTO } from "@/lib/business-meetings/types";

export function MeetingSchedulingSection({
  detail,
  viewerUserId,
}: {
  detail: MeetingDetailDTO;
  viewerUserId: string;
}) {
  const t = useT();
  const { data: prefs } = useAvailabilityPreferences();
  const isOrganizer =
    detail.meeting.organizerUserId === viewerUserId || detail.viewerRole === "organizer";
  const meeting = detail.meeting;
  const otherUserIds = detail.participants.map((p) => p.userId).filter((id) => id !== viewerUserId);
  const organizerTz = prefs?.timezone ?? meeting.timezone ?? "UTC";
  const defaultDur = prefs?.defaultMeetingDurationMinutes ?? 30;

  return (
    <section aria-label={t("calendar.section.title")} className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("calendar.section.title")}
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("calendar.section.subtitle")}</p>
        </div>
        <Link
          to="/connect/calendar-settings"
          className="text-xs font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("calendar.settings.link")}
        </Link>
      </div>

      {isOrganizer && otherUserIds.length > 0 ? (
        <>
          <CommonAvailabilityFinder
            meetingId={meeting.id}
            participantUserIds={[viewerUserId, ...otherUserIds]}
            organizerTimezone={organizerTz}
            defaultDurationMinutes={defaultDur}
          />
          <Separator />
        </>
      ) : null}

      <ProposalResponseMatrix
        meetingId={meeting.id}
        participants={detail.participants}
        viewerUserId={viewerUserId}
        isOrganizer={isOrganizer}
        meetingVersion={detail.activeProposal?.version}
      />

      <Separator />

      <div>
        <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("calendar.sync.title")}
        </h5>
        <p className="mb-2 text-xs text-muted-foreground">{t("calendar.sync.hint")}</p>
        <CalendarSyncStatus meetingId={meeting.id} />
      </div>
    </section>
  );
}

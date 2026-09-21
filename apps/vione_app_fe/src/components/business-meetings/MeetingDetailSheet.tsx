// BC-4.1C — Meeting detail slide-over. Opened from a list item; deep-linkable
// via the `open` search param. Renders participant-authorized detail, the
// action bar, and the immutable proposal history.
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useFmt, useT } from "@/lib/i18n";
import {
  crossesDateBoundary,
  formatLocalDate,
  formatLocalTimeRange,
  formatMeetingTzTimeRange,
} from "@/lib/meeting-time";
import { meetingErrorTKey } from "@/lib/business-meetings/error-messages";
import { useMeetingDetail, useMeetingMutations } from "@/hooks/use-business-meetings";
import type { MeetingMutations } from "@/hooks/use-business-meetings";
import { MeetingStatusBadge } from "./MeetingStatusBadge";
import { MeetingCounterpart } from "./MeetingCounterpart";
import { MeetingActions } from "./MeetingActions";
import { ProposalHistory } from "./ProposalHistory";
import { MeetingSchedulingSection } from "@/components/business-connect/meeting/MeetingSchedulingSection";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";

const TOAST_KEY: Record<keyof MeetingMutations, string> = {
  accept: "connect.meetings.toast.accepted",
  decline: "connect.meetings.toast.declined",
  tentative: "connect.meetings.toast.tentative",
  propose: "connect.meetings.toast.proposed",
  cancel: "connect.meetings.toast.cancelled",
  complete: "connect.meetings.toast.completed",
  markNoShow: "connect.meetings.toast.noShow",
};

export function MeetingDetailSheet({
  meetingId,
  onClose,
}: {
  meetingId: string | null;
  onClose: () => void;
}) {
  const t = useT();
  const { locale } = useFmt();
  const { data, isLoading, isError, error } = useMeetingDetail(meetingId);
  const viewerUserId = useViewerUserId();

  const mutations = useMeetingMutations({
    onSuccess: (kind) => toast.success(t(TOAST_KEY[kind] as Parameters<typeof t>[0])),
    onError: (_kind, err) => toast.error(t(meetingErrorTKey(err) as Parameters<typeof t>[0])),
  });

  const proposal = data?.activeProposal ?? null;

  return (
    <Sheet open={meetingId !== null} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-lg"
        aria-label={t("connect.meetings.detail.aria")}
      >
        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("connect.meetings.loading")}</p>
        ) : isError ? (
          <p role="alert" className="mt-8 text-sm text-destructive">
            {t(meetingErrorTKey(error) as Parameters<typeof t>[0])}
          </p>
        ) : data ? (
          <div className="space-y-5">
            <SheetHeader className="space-y-2 text-left">
              <div className="flex items-start justify-between gap-2">
                <SheetTitle className="text-base">{data.meeting.title}</SheetTitle>
                <MeetingStatusBadge status={data.meeting.status} />
              </div>
              <SheetDescription>
                {t("connect.meetings.detail.with", {
                  name: data.counterpart?.displayName ?? t("connect.meetings.counterpart.unknown"),
                })}
              </SheetDescription>
            </SheetHeader>

            <MeetingCounterpart counterpart={data.counterpart} size="md" />

            <Separator />

            <section aria-label={t("connect.meetings.detail.time")}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("connect.meetings.detail.time")}
              </h4>
              {proposal ? (
                <div className="mt-1">
                  <p className="text-sm text-foreground">
                    {formatLocalDate(proposal.startAt, locale)} ·{" "}
                    {formatLocalTimeRange(proposal.startAt, proposal.endAt, locale)}
                  </p>
                  {crossesDateBoundary(proposal.startAt, proposal.timezone, locale) ? (
                    <p className="text-xs text-muted-foreground">
                      {t("connect.meetings.item.tzNote", { tz: proposal.timezone })}:{" "}
                      {formatMeetingTzTimeRange(
                        proposal.startAt,
                        proposal.endAt,
                        proposal.timezone,
                        locale,
                      )}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("connect.meetings.detail.noProposal")}
                </p>
              )}
            </section>

            {proposal?.locationText ? (
              <section aria-label={t("connect.meetings.detail.location")}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("connect.meetings.detail.location")}
                </h4>
                <p className="mt-1 text-sm text-foreground">{proposal.locationText}</p>
              </section>
            ) : null}

            {proposal?.meetingUrl ? (
              <section aria-label={t("connect.meetings.detail.link")}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("connect.meetings.detail.link")}
                </h4>
                <a
                  href={proposal.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-sm text-primary underline underline-offset-4"
                >
                  {proposal.meetingUrl}
                </a>
              </section>
            ) : null}

            {proposal?.proposalMessage ? (
              <section aria-label={t("connect.meetings.detail.message")}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("connect.meetings.detail.message")}
                </h4>
                <p className="mt-1 text-sm text-foreground">{proposal.proposalMessage}</p>
              </section>
            ) : null}

            <Separator />
            <MeetingActions detail={data} mutations={mutations} />

            {viewerUserId ? (
              <>
                <Separator />
                <MeetingSchedulingSection detail={data} viewerUserId={viewerUserId} />
              </>
            ) : null}

            <Separator />
            <section aria-label={t("connect.meetings.history.title")}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("connect.meetings.history.title")}
              </h4>
              <ProposalHistory meetingId={data.meeting.id} />
            </section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// BC-7.7 Turn C — Proposal / response matrix. Rows = proposals; columns =
// participants. Cells show the participant's response (available / unavailable
// / tentative / pending). The organizer can select any active proposal.

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT, useFmt } from "@/lib/i18n";
import {
  useMeetingTimeProposals,
  useRespondToProposal,
  useSelectProposal,
} from "@/lib/meeting/calendar/hooks";
import { calendarErrorTKey } from "@/lib/meeting/calendar/error-i18n";
import type {
  MeetingTimeProposalDTO,
  MeetingTimeProposalStatus,
  MeetingTimeProposalResponseValue,
} from "@/lib/meeting/calendar/types";
import type { BusinessMeetingParticipantDTO } from "@/lib/business-meetings/types";

const STATUS_KEY: Record<MeetingTimeProposalStatus, string> = {
  active: "calendar.matrix.status.active",
  selected: "calendar.matrix.status.selected",
  withdrawn: "calendar.matrix.status.withdrawn",
  expired: "calendar.matrix.status.expired",
};

export function ProposalResponseMatrix({
  meetingId,
  participants,
  viewerUserId,
  isOrganizer,
  meetingVersion,
}: {
  meetingId: string;
  participants: BusinessMeetingParticipantDTO[];
  viewerUserId: string;
  isOrganizer: boolean;
  meetingVersion?: number;
}) {
  const t = useT();
  const fmt = useFmt();
  const _t = (iso: string) =>
    new Date(iso).toLocaleTimeString(fmt.locale, { hour: "2-digit", minute: "2-digit" });
  const _dt = (iso: string) => new Date(iso).toLocaleString(fmt.locale);
  const { data: proposals, isLoading } = useMeetingTimeProposals(meetingId);
  const respond = useRespondToProposal(meetingId);
  const select = useSelectProposal(meetingId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        {t("calendar.matrix.empty")}
      </p>
    );
  }

  const onSelect = async (p: MeetingTimeProposalDTO) => {
    try {
      await select.mutateAsync({
        proposalId: p.id,
        expectedMeetingVersion: meetingVersion,
      });
      toast.success(t("calendar.matrix.selected.toast"));
    } catch (e) {
      toast.error(t(calendarErrorTKey(e) as Parameters<typeof t>[0]));
    }
  };

  const onRespond = async (p: MeetingTimeProposalDTO, value: MeetingTimeProposalResponseValue) => {
    try {
      await respond.mutateAsync({ proposalId: p.id, response: value });
      toast.success(t("calendar.matrix.respond.toast"));
    } catch (e) {
      toast.error(t(calendarErrorTKey(e) as Parameters<typeof t>[0]));
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">{t("calendar.matrix.title")}</th>
            <th className="px-3 py-2 text-left">{t("connect.meetings.detail.time")}</th>
            <th className="px-3 py-2 text-left">{t("calendar.matrix.resp.pending")}</th>
            <th className="px-3 py-2 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((p) => (
            <tr key={p.id} className="border-t align-top">
              <td className="px-3 py-2">
                <Badge variant={p.status === "selected" ? "default" : "secondary"}>
                  {t(STATUS_KEY[p.status] as Parameters<typeof t>[0])}
                </Badge>
              </td>
              <td className="px-3 py-2">
                <div className="font-medium text-foreground">{fmt.date(p.startAt)}</div>
                <div className="text-xs text-muted-foreground">
                  {_t(p.startAt)}–{_t(p.endAt)} · {p.timezone}
                </div>
              </td>
              <td className="px-3 py-2">
                <ul className="flex flex-wrap gap-1">
                  {participants.map((pt) => (
                    <li key={pt.id}>
                      <ParticipantBadge participant={pt} isViewer={pt.userId === viewerUserId} />
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex flex-wrap justify-end gap-1">
                  {p.status === "active" ? (
                    <Select
                      value=""
                      onValueChange={(v) => onRespond(p, v as MeetingTimeProposalResponseValue)}
                    >
                      <SelectTrigger
                        className="h-8 w-36"
                        aria-label={t("calendar.matrix.respond.aria")}
                      >
                        <SelectValue placeholder={t("calendar.matrix.resp.pending")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">
                          {t("calendar.matrix.resp.available")}
                        </SelectItem>
                        <SelectItem value="tentative">
                          {t("calendar.matrix.resp.tentative")}
                        </SelectItem>
                        <SelectItem value="unavailable">
                          {t("calendar.matrix.resp.unavailable")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                  {isOrganizer && p.status === "active" ? (
                    <Button size="sm" onClick={() => onSelect(p)} disabled={select.isPending}>
                      {select.isPending
                        ? t("calendar.matrix.selecting")
                        : t("calendar.matrix.select")}
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParticipantBadge({
  participant,
  isViewer,
}: {
  participant: BusinessMeetingParticipantDTO;
  isViewer: boolean;
}) {
  const t = useT();
  const label = isViewer ? t("calendar.matrix.you") : participant.userId.slice(0, 6);
  const status = participant.responseStatus;
  const variant: "default" | "secondary" | "destructive" | "outline" =
    status === "accepted"
      ? "default"
      : status === "declined"
        ? "destructive"
        : status === "tentative"
          ? "secondary"
          : "outline";
  return (
    <Badge variant={variant} className="text-[10px]">
      {label}
    </Badge>
  );
}

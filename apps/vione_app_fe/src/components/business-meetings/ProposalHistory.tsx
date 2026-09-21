// BC-4.1C — Immutable proposal history (read-only, ordered by version).
import { useFmt, useT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { formatLocalDate, formatLocalTimeRange } from "@/lib/meeting-time";
import { useMeetingProposalHistory } from "@/hooks/use-business-meetings";

export function ProposalHistory({ meetingId }: { meetingId: string }) {
  const t = useT();
  const { locale } = useFmt();
  const { data, isLoading } = useMeetingProposalHistory(meetingId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t("connect.meetings.loading")}</p>;
  }
  if (!data || data.proposals.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("connect.meetings.history.empty")}</p>;
  }

  return (
    <ol className="space-y-3">
      {data.proposals.map((p) => {
        const proposer = data.proposers[p.proposedByUserId];
        const active = p.version === data.activeVersion;
        return (
          <li key={p.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {t("connect.meetings.history.version", { n: p.version })}
              </span>
              {active ? (
                <Badge variant="default">{t("connect.meetings.history.active")}</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatLocalDate(p.startAt, locale)} ·{" "}
              {formatLocalTimeRange(p.startAt, p.endAt, locale)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("connect.meetings.history.by", {
                name: proposer?.displayName ?? t("connect.meetings.counterpart.unknown"),
              })}
            </p>
            {p.proposalMessage ? (
              <p className="mt-2 text-sm text-foreground">{p.proposalMessage}</p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

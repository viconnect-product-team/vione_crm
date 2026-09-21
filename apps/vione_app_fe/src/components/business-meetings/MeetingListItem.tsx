// BC-4.1C — Compact meeting list item (keyboard + screen-reader friendly).
import { useFmt, useT } from "@/lib/i18n";
import { formatLocalDate, formatLocalTimeRange, crossesDateBoundary } from "@/lib/meeting-time";
import type { MeetingListItemDTO } from "@/lib/business-meetings/types";
import { MeetingStatusBadge } from "./MeetingStatusBadge";
import { MeetingCounterpart } from "./MeetingCounterpart";

export function MeetingListItem({
  item,
  onOpen,
}: {
  item: MeetingListItemDTO;
  onOpen: (id: string) => void;
}) {
  const t = useT();
  const { locale } = useFmt();

  const hasTime = !!item.startAt;
  const dateStr = hasTime ? formatLocalDate(item.startAt, locale) : "";
  const timeStr = hasTime
    ? formatLocalTimeRange(item.startAt, item.endAt, locale)
    : t("connect.meetings.item.withoutTime");
  const showTz =
    hasTime && item.timezone && crossesDateBoundary(item.startAt, item.timezone, locale);

  const awaiting =
    item.status === "proposed"
      ? item.viewerResponseStatus === "pending"
        ? t("connect.meetings.item.awaitingYou")
        : t("connect.meetings.item.awaitingThem")
      : null;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-label={`${item.title} — ${t(`connect.meetings.status.${item.status}` as Parameters<typeof t>[0])}`}
        className="flex w-full items-start gap-3 rounded-lg border bg-card p-4 text-left transition hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{item.title}</h3>
            <MeetingStatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasTime ? (
              <>
                <span>{dateStr}</span>
                <span aria-hidden="true"> · </span>
                <span>{timeStr}</span>
                {showTz ? (
                  <span className="ml-1 text-xs">
                    ({t("connect.meetings.item.tzNote", { tz: item.timezone })})
                  </span>
                ) : null}
              </>
            ) : (
              timeStr
            )}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <MeetingCounterpart counterpart={item.counterpart} />
            {awaiting ? (
              <span className="shrink-0 text-xs font-medium text-muted-foreground">{awaiting}</span>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
}

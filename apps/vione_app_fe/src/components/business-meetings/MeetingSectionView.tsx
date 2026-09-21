// BC-4.1C — Meeting section list view: live-region announcements, refresh,
// keyboard-accessible items, and a deep-linkable detail slide-over.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { useT } from "@/lib/i18n";
import { meetingErrorTKey } from "@/lib/business-meetings/error-messages";
import { useMeetingList, type MeetingSection } from "@/hooks/use-business-meetings";
import { MeetingListItem } from "./MeetingListItem";
import { MeetingDetailSheet } from "./MeetingDetailSheet";

export function MeetingSectionView({
  section,
  openId,
  onOpen,
  onCloseDetail,
}: {
  section: MeetingSection;
  openId: string | null;
  onOpen: (id: string) => void;
  onCloseDetail: () => void;
}) {
  const t = useT();
  const { data, isLoading, isError, error, isFetching, refetch } = useMeetingList(section);
  const [announcement, setAnnouncement] = useState("");
  const prevFetching = useRef(isFetching);

  // Announce load/refresh completions for screen readers.
  useEffect(() => {
    if (prevFetching.current && !isFetching && data) {
      setAnnouncement(t("connect.meetings.live.refreshed"));
    }
    prevFetching.current = isFetching;
  }, [isFetching, data, t]);

  useEffect(() => {
    if (data) setAnnouncement(t("connect.meetings.live.loaded", { n: data.length }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.length]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4">
      <div
        data-testid="meetings-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="mb-3 flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label={t("connect.meetings.refresh")}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {isFetching ? t("connect.meetings.refreshing") : t("connect.meetings.refresh")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm font-medium text-foreground">{t("connect.meetings.error.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(meetingErrorTKey(error) as Parameters<typeof t>[0])}
          </p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => refetch()}>
            {t("connect.meetings.retry")}
          </Button>
        </div>
      ) : !data || data.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {t(`connect.meetings.empty.${section}` as Parameters<typeof t>[0])}
        </p>
      ) : (
        <ul
          className="space-y-3"
          aria-label={t("connect.meetings.list.aria")}
          aria-busy={isFetching}
        >
          {data.map((item) => (
            <MeetingListItem key={item.id} item={item} onOpen={onOpen} />
          ))}
        </ul>
      )}

      <MeetingDetailSheet meetingId={openId} onClose={onCloseDetail} />
    </div>
  );
}

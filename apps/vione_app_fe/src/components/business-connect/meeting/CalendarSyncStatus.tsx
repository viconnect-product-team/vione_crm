// BC-7.7 Turn C — Calendar sync status. Shows projection state per
// participant/provider. No provider tokens or event bodies are ever shown.

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, useFmt } from "@/lib/i18n";
import { useMeetingProjections } from "@/lib/meeting/calendar/hooks";
import type {
  CalendarProjectionDTO,
  CalendarSyncStatus as SyncStatus,
  CalendarProvider,
} from "@/lib/meeting/calendar/types";

const STATUS_KEY: Record<SyncStatus, string> = {
  pending: "calendar.sync.status.pending",
  synced: "calendar.sync.status.synced",
  retry_scheduled: "calendar.sync.status.retry_scheduled",
  failed: "calendar.sync.status.failed",
  cancelled: "calendar.sync.status.cancelled",
};

const STATUS_VARIANT: Record<SyncStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  synced: "default",
  retry_scheduled: "secondary",
  failed: "destructive",
  cancelled: "outline",
};

const PROVIDER_KEY: Record<CalendarProvider, string> = {
  internal: "calendar.sync.provider.internal",
  google: "calendar.sync.provider.google",
  microsoft: "calendar.sync.provider.microsoft",
};

export function CalendarSyncStatus({ meetingId }: { meetingId: string }) {
  const t = useT();
  const fmt = useFmt();
  const _t = (iso: string) =>
    new Date(iso).toLocaleTimeString(fmt.locale, { hour: "2-digit", minute: "2-digit" });
  const _dt = (iso: string) => new Date(iso).toLocaleString(fmt.locale);
  const { data: rows, isLoading } = useMeetingProjections(meetingId);

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("calendar.sync.empty")}</p>;
  }

  return (
    <ul className="space-y-2" aria-label={t("calendar.sync.title")}>
      {rows.map((r: CalendarProjectionDTO) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
        >
          <div>
            <div className="text-sm font-medium text-foreground">
              {t(PROVIDER_KEY[r.provider] as Parameters<typeof t>[0])}
            </div>
            <div className="text-xs text-muted-foreground">
              {r.lastSyncedAt ? t("calendar.sync.lastAt", { time: _dt(r.lastSyncedAt) }) : "—"}
              {r.retryCount > 0 ? ` · ${t("calendar.sync.retries", { n: r.retryCount })}` : ""}
            </div>
          </div>
          <Badge variant={STATUS_VARIANT[r.syncStatus]}>
            {t(STATUS_KEY[r.syncStatus] as Parameters<typeof t>[0])}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

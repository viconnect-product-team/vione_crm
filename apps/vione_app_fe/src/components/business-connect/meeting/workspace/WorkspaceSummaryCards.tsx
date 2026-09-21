// BC-7.8 Turn B — Workspace summary cards.

import { useT } from "@/lib/i18n";
import { useMeetingWorkspaceSummary } from "@/lib/meeting/workspace/hooks";

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

export function WorkspaceSummaryCards() {
  const t = useT();
  const { data, isLoading, isError } = useMeetingWorkspaceSummary();

  const val = (n: number | undefined) => (isLoading ? "…" : isError ? "—" : String(n ?? 0));

  return (
    <section
      aria-label={t("bc.meetings.workspace.title")}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <Card label={t("bc.meetings.workspace.summary.upcoming")} value={val(data?.upcomingCount)} />
      <Card
        label={t("bc.meetings.workspace.summary.unscheduled")}
        value={val(data?.unscheduledCount)}
      />
      <Card
        label={t("bc.meetings.workspace.summary.completedRecently")}
        value={val(data?.completedRecentlyCount)}
      />
      <Card
        label={t("bc.meetings.workspace.summary.thisMonth")}
        value={val(data?.thisMonthCount)}
      />
    </section>
  );
}

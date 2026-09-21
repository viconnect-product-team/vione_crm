// BC-4.1C — Business Meetings management shell. Tabbed sections with live
// counts; children render in the <Outlet />.
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { useMeetingCounts } from "@/hooks/use-business-meetings";

export const Route = createFileRoute("/connect/meetings")({
  ssr: false,
  component: MeetingsLayout,
});

function MeetingsLayout() {
  const t = useT();
  const { data: counts } = useMeetingCounts();

  const tabClass =
    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:bg-muted [&.active]:text-foreground";

  const pending = counts?.proposed ?? 0;
  const upcoming = counts?.confirmed ?? 0;

  const Badge = ({ n }: { n: number }) =>
    n > 0 ? (
      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
        {t("connect.meetings.count.badge", { n })}
      </span>
    ) : null;

  return (
    <div>
      <div className="mx-auto w-full max-w-5xl px-4 pt-6">
        <h1 className="text-xl font-semibold text-foreground">{t("connect.meetings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("connect.meetings.subtitle")}</p>
        <nav
          className="mt-4 flex flex-wrap items-center gap-1 border-b pb-3"
          aria-label={t("connect.meetings.tabsLabel")}
        >
          <Link
            to="/connect/meetings/$section"
            params={{ section: "upcoming" }}
            className={tabClass}
          >
            {t("connect.meetings.tab.upcoming")}
            <Badge n={upcoming} />
          </Link>
          <Link
            to="/connect/meetings/$section"
            params={{ section: "pending" }}
            className={tabClass}
          >
            {t("connect.meetings.tab.pending")}
            <Badge n={pending} />
          </Link>
          <Link to="/connect/meetings/$section" params={{ section: "past" }} className={tabClass}>
            {t("connect.meetings.tab.past")}
          </Link>
          <Link
            to="/connect/meetings/$section"
            params={{ section: "cancelled" }}
            className={tabClass}
          >
            {t("connect.meetings.tab.cancelled")}
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}

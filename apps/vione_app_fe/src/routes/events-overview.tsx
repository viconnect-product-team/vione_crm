import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Search, Users, UserCheck, Ticket } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { fetchNestApi } from "@/lib/api-client";
import type { EventOverviewRow } from "@/lib/events-overview.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/events-overview")({
  ssr: false,
  loader: async () => {
    try {
      const res = await fetchNestApi<EventOverviewRow[]>("/events/overview");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
  component: EventsOverviewPage,
  head: () => ({
    meta: [
      { title: "Tổng quan sự kiện | ViOne" },
      {
        name: "description",
        content:
          "Bảng tổng quan sự kiện cho quản trị viên: danh sách sự kiện, lượt đăng ký và số người tham dự thực tế.",
      },
      { property: "og:title", content: "Tổng quan sự kiện | ViOne" },
      {
        property: "og:description",
        content: "Theo dõi lượt đăng ký và số người tham dự của từng sự kiện.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function Kpi({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon aria-hidden="true" className="h-4 w-4" />
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value.toLocaleString("vi-VN")}
      </p>
    </div>
  );
}

function Rate({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="tabular-nums text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

function EventsOverviewPage() {
  const t = useT();
  const rows = (Route.useLoaderData() || []) as EventOverviewRow[];
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r: EventOverviewRow) =>
        r.name.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term),
    );
  }, [rows, q]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc: { events: number; registrations: number; attended: number; capacity: number }, r: EventOverviewRow) => ({
          events: acc.events + 1,
          registrations: acc.registrations + (r.registrations || 0),
          attended: acc.attended + (r.attended || 0),
          capacity: acc.capacity + (r.capacity || 0),
        }),
        { events: 0, registrations: 0, attended: 0, capacity: 0 },
      ),
    [filtered],
  );

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl p-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("eventsOverview.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("eventsOverview.subtitle")}
          </p>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label={t("eventsOverview.kpiEvents")} value={totals.events} icon={CalendarDays} />
          <Kpi
            label={t("eventsOverview.kpiRegistrations")}
            value={totals.registrations}
            icon={Ticket}
          />
          <Kpi label={t("eventsOverview.kpiAttended")} value={totals.attended} icon={UserCheck} />
          <Kpi label={t("eventsOverview.kpiCapacity")} value={totals.capacity} icon={Users} />
        </div>

        <label className="mt-6 flex min-h-10 max-w-sm items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Search aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("eventsOverview.searchPlaceholder")}
            aria-label={t("eventsOverview.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        {filtered.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">{t("eventsOverview.empty")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[880px] text-sm">
              <caption className="sr-only">{t("eventsOverview.title")}</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th scope="col" className="px-4 py-3">
                    {t("eventsOverview.colEvent")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("eventsOverview.colStatus")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {t("eventsOverview.colRegistrations")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {t("eventsOverview.colConfirmed")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {t("eventsOverview.colCancelled")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {t("eventsOverview.colAttended")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("eventsOverview.colFill")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: EventOverviewRow) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to="/events/$eventId"
                        params={{ eventId: r.id }}
                        className="font-medium text-foreground hover:underline"
                      >
                        {r.name}
                      </Link>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                          {new Date(r.date).toLocaleDateString("vi-VN")}
                        </span>
                        {r.location ? (
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                            <span className="truncate">{r.location}</span>
                          </span>
                        ) : null}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {r.registrations}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {r.confirmed}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {r.cancelled}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {r.attended}
                      <span className="text-muted-foreground">/{r.registrations}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Rate value={r.registrations} total={r.capacity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

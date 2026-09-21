import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, CalendarClock, UserPlus, Clock, UserX, Ban, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/dashboard/StateKit";
import { useFmt, useT } from "@/lib/i18n";
import type { EventItem, Registration } from "@/lib/events.functions";

type FeedCategory = "registration" | "updates";

type FeedItem = {
  id: string;
  category: FeedCategory;
  icon: React.ReactNode;
  title: string;
  desc?: string;
  iso: string;
  badge?: string;
  cta?: { to: string; label: string };
};

/**
 * Event feed — aggregates real event-related activity that is already loaded
 * on the event detail route (the event itself + its registrations). No photos,
 * announcements, posts, documents or check-in data are fabricated; only fields
 * that exist on EventItem / Registration are surfaced. Purely presentational.
 */
export function EventFeed({
  event,
  registrations,
  canManage,
}: {
  event: EventItem;
  registrations: Registration[];
  canManage: boolean;
}) {
  const t = useT();
  const fmt = useFmt();
  const [filter, setFilter] = useState<"all" | FeedCategory>("all");

  const items = useMemo<FeedItem[]>(() => {
    const out: FeedItem[] = [];

    // Event schedule / status update (from the event's own data only).
    if (event.status === "cancelled") {
      out.push({
        id: `ev-cancelled-${event.id}`,
        category: "updates",
        icon: <Ban className="h-4 w-4" aria-hidden="true" />,
        title: t("efeed.cancelled.title"),
        desc: t("efeed.cancelled.desc"),
        iso: event.date,
        badge: t("events.status.cancelled"),
      });
    } else if (event.date) {
      out.push({
        id: `ev-scheduled-${event.id}`,
        category: "updates",
        icon: <CalendarClock className="h-4 w-4" aria-hidden="true" />,
        title: t("efeed.scheduled.title"),
        desc: t("efeed.scheduled.desc", {
          date: fmt.date(event.date),
          location: event.location || "—",
        }),
        iso: event.date,
      });
    }

    // Registrations (real rows only).
    for (const r of registrations) {
      const name = r.memberName || r.memberCode;
      const ticket = r.ticketType ? t("efeed.reg.ticket", { ticket: r.ticketType }) : undefined;
      if (r.status === "cancelled") {
        out.push({
          id: `reg-${r.id}`,
          category: "registration",
          icon: <UserX className="h-4 w-4" aria-hidden="true" />,
          title: t("efeed.reg.cancelled", { name }),
          desc: ticket,
          iso: r.registeredAt,
          badge: t("edetail.attendees.cancelledLabel"),
        });
      } else if (r.status === "waitlist") {
        out.push({
          id: `reg-${r.id}`,
          category: "registration",
          icon: <Clock className="h-4 w-4" aria-hidden="true" />,
          title: t("efeed.reg.waitlist", { name }),
          desc: ticket,
          iso: r.registeredAt,
          badge: t("edetail.attendees.waitlist"),
        });
      } else {
        out.push({
          id: `reg-${r.id}`,
          category: "registration",
          icon: <UserPlus className="h-4 w-4" aria-hidden="true" />,
          title: t("efeed.reg.confirmed", { name }),
          desc: ticket,
          iso: r.registeredAt,
          badge: t("edetail.attendees.confirmed"),
        });
      }
    }

    return out.sort((a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime());
  }, [event, registrations, t, fmt]);

  const categories = useMemo(() => new Set(items.map((i) => i.category)), [items]);

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  const filters: Array<{ key: "all" | FeedCategory; label: string }> = [
    { key: "all", label: t("efeed.filter.all") },
    ...(categories.has("registration")
      ? [{ key: "registration" as const, label: t("efeed.filter.registration") }]
      : []),
    ...(categories.has("updates")
      ? [{ key: "updates" as const, label: t("efeed.filter.updates") }]
      : []),
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" /> {t("efeed.title")}
        </h2>
        {canManage && categories.has("registration") && (
          <Link
            to="/event-registrations"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />{" "}
            {t("edetail.cta.manageReg")}
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" aria-hidden="true" />}
          title={t("efeed.emptyTitle")}
          description={t("efeed.emptyDesc")}
        />
      ) : (
        <>
          {filters.length > 2 && (
            <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label={t("efeed.title")}>
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <ol className="relative space-y-4 pl-6">
            <span
              className="absolute left-[9px] top-1 bottom-1 w-px bg-border"
              aria-hidden="true"
            />
            {filtered.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-6 top-0.5 grid h-5 w-5 place-items-center rounded-full border border-border bg-card text-muted-foreground">
                  {item.icon}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  {item.badge && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.desc && <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>}
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                  {fmt.rel(item.iso) || fmt.date(item.iso)}
                </p>
                {item.cta && (
                  <Link
                    to={item.cta.to}
                    className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    {item.cta.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

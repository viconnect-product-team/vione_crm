import { CalendarClock, DoorOpen, MapPin, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/dashboard/StateKit";
import type { EventItem } from "@/lib/events.functions";
import { useFmt, useT } from "@/lib/i18n";

/**
 * Agenda / schedule section for the event detail page.
 *
 * The events API returns no session/speaker/room data, so a detailed agenda
 * is never fabricated. When no formal agenda exists we show a StateKit empty
 * state plus a single, honest "event schedule" block derived only from the
 * event's own start time and location — clearly labelled as a schedule, not a
 * detailed agenda. Purely presentational; no backend calls.
 */
export function EventAgenda({ event }: { event: EventItem }) {
  const t = useT();
  const fmt = useFmt();

  const live = event.status === "ongoing";
  const upcoming = event.status === "upcoming";
  const showSchedule = event.status !== "cancelled";

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" /> {t("eagenda.title")}
        </h2>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {t("eagenda.scheduleTag")}
        </span>
      </div>

      {/* No formal agenda is available from the data source. */}
      <EmptyState
        icon={<CalendarClock className="h-6 w-6" aria-hidden="true" />}
        title={t("eagenda.emptyTitle")}
        description={t("eagenda.emptyDesc")}
      />

      {/* Derived, non-fabricated single schedule block. */}
      {showSchedule && (
        <div className="mt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("eagenda.derivedTitle")}
          </p>
          <ol className="relative border-l border-border pl-5">
            <li className="relative">
              <span
                className={`absolute -left-[27px] top-0.5 grid h-6 w-6 place-items-center rounded-full ${
                  live ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
                }`}
                aria-hidden="true"
              >
                <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {t("eagenda.opens")}
                  </span>
                  {live && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-semibold text-success">
                      <Sparkles className="h-3 w-3" aria-hidden="true" /> {t("eagenda.now")}
                    </span>
                  )}
                  {upcoming && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {t("eagenda.upcoming")}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm font-medium text-foreground">{event.name}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                    {fmt.date(event.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {event.location || "—"}
                  </span>
                </div>
              </div>
            </li>
          </ol>
        </div>
      )}
    </section>
  );
}

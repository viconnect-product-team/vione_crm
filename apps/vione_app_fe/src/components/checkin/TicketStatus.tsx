import { Ticket, CheckCircle2 } from "lucide-react";
import type { TicketStat } from "@/lib/checkin-data";
import { useT } from "@/lib/i18n";

export function TicketStatus({ ticketStats }: { ticketStats: TicketStat[] }) {
  const t = useT();
  return (
    <section
      className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
      aria-label={t("checkin.ticketStatus.title")}
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Ticket className="h-4 w-4 text-primary" aria-hidden="true" />
        {t("checkin.ticketStatus.title")}
      </h2>

      {ticketStats.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("checkin.ticketStatus.empty")}</p>
      ) : (
        <ul className="space-y-3" role="list">
          {ticketStats.map((s) => {
            const pct = s.registered > 0 ? Math.round((s.checkedIn / s.registered) * 100) : 0;
            const complete = s.registered > 0 && s.checkedIn === s.registered;
            return (
              <li key={s.ticketType} role="listitem">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
                    {complete && (
                      <CheckCircle2
                        className="h-3.5 w-3.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    )}
                    <span className="truncate">{s.ticketType}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
                    {s.checkedIn}/{s.registered}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t("checkin.ticketStatus.progress", {
                    ticket: s.ticketType,
                    checkedIn: s.checkedIn,
                    registered: s.registered,
                  })}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${pct}%`, background: "var(--gradient-primary)" }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

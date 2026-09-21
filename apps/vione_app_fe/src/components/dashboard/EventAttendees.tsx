import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, Clock, Users, XCircle } from "lucide-react";
import { EmptyState } from "@/components/dashboard/StateKit";
import type { Registration } from "@/lib/events.functions";
import { useFmt, useT, type TKey } from "@/lib/i18n";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const TICKET_TONE: Record<Registration["ticketType"], string> = {
  standard: "bg-secondary text-muted-foreground",
  vip: "bg-warning/20 text-[oklch(0.45_0.16_65)]",
  speaker: "bg-info/10 text-info",
};

const STATUS_TONE: Record<Registration["status"], string> = {
  confirmed: "bg-success/12 text-success",
  waitlist: "bg-warning/15 text-[oklch(0.48_0.16_65)]",
  cancelled: "bg-secondary text-muted-foreground",
};
const STATUS_KEY: Record<Registration["status"], TKey> = {
  confirmed: "edetail.attendees.confirmed",
  waitlist: "edetail.attendees.waitlist",
  cancelled: "edetail.attendees.cancelledLabel",
};

type Filter = "confirmed" | "waitlist" | "cancelled";

/**
 * Premium, networking-oriented attendee section for the event detail page.
 * Purely presentational — renders only fields already returned by the
 * registrations API (name, code, ticket, status, registered date). No email,
 * phone, notes or payment data is shown, and no new API is called.
 */
export function EventAttendees({
  registrations,
  canManage,
}: {
  registrations: Registration[];
  canManage: boolean;
}) {
  const t = useT();

  const counts = useMemo(
    () => ({
      confirmed: registrations.filter((r) => r.status === "confirmed").length,
      waitlist: registrations.filter((r) => r.status === "waitlist").length,
      cancelled: registrations.filter((r) => r.status === "cancelled").length,
    }),
    [registrations],
  );

  const available: Filter[] = (["confirmed", "waitlist", "cancelled"] as Filter[]).filter(
    (f) => counts[f] > 0,
  );
  const [filter, setFilter] = useState<Filter>(available[0] ?? "confirmed");
  const active = available.includes(filter) ? filter : (available[0] ?? "confirmed");

  const list = useMemo(
    () => registrations.filter((r) => r.status === active),
    [registrations, active],
  );
  const total = registrations.filter((r) => r.status !== "cancelled").length;
  const shown = list.slice(0, 12);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
          <Users className="h-4 w-4 text-primary" aria-hidden="true" />{" "}
          {t("edetail.attendees.title")}
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          {t("edetail.attendees.count", { n: total })}
        </span>
      </div>

      {/* Count chips */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <CountChip
          label={t("edetail.attendees.confirmed")}
          value={counts.confirmed}
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          tone="success"
        />
        <CountChip
          label={t("edetail.attendees.waitlist")}
          value={counts.waitlist}
          icon={<Clock className="h-4 w-4" aria-hidden="true" />}
          tone="warning"
        />
        <CountChip
          label={t("edetail.attendees.cancelledLabel")}
          value={counts.cancelled}
          icon={<XCircle className="h-4 w-4" aria-hidden="true" />}
          tone="muted"
        />
      </div>

      {available.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" aria-hidden="true" />}
          title={t("edetail.attendees.empty")}
          description={t("edetail.attendees.emptyHint")}
        />
      ) : (
        <>
          {/* Segmented filter (only shows buckets that have data) */}
          {available.length > 1 && (
            <div
              className="mb-4 inline-flex rounded-xl border border-border bg-secondary/40 p-1"
              role="group"
              aria-label={t("edetail.attendees.title")}
            >
              {available.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active === f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active === f
                      ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(STATUS_KEY[f])} ({counts[f]})
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {shown.map((r: any) => (
              <AttendeeCard key={r.id} reg={r} />
            ))}
          </div>

          {list.length > shown.length && (
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              {t("edetail.attendees.more", { n: list.length - shown.length })}
            </p>
          )}
        </>
      )}

      {canManage && registrations.length > 0 && (
        <Link
          to="/event-registrations"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ClipboardList className="h-4 w-4" aria-hidden="true" /> {t("edetail.cta.manageReg")}
        </Link>
      )}
    </section>
  );
}

function CountChip({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "success" | "warning" | "muted";
}) {
  const toneCls =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-[oklch(0.48_0.16_65)]"
        : "text-muted-foreground";
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 p-3 text-center">
      <div className={`mb-1 flex items-center justify-center gap-1.5 ${toneCls}`}>{icon}</div>
      <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function AttendeeCard({ reg }: { reg: Registration }) {
  const t = useT();
  const fmt = useFmt();
  const name = reg.memberName || reg.memberCode || "—";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:bg-muted/50">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground">
        {initials(name) || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        {reg.memberCode && reg.memberName && (
          <p className="truncate text-xs text-muted-foreground">{reg.memberCode}</p>
        )}
        {reg.seatAssignment ? (
          <div className="mt-0.5 inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
            <span>📍</span> {reg.seatAssignment}
          </div>
        ) : (
          <p className="truncate text-[11px] text-muted-foreground">{fmt.date(reg.registeredAt)}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_TONE[reg.status]}`}
        >
          {t(STATUS_KEY[reg.status])}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TICKET_TONE[reg.ticketType] || "bg-secondary text-muted-foreground"}`}
        >
          {reg.ticketType}
        </span>
      </div>
    </div>
  );
}

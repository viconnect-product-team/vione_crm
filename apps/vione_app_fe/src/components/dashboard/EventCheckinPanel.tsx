import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ClipboardList,
  Download,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv";
import type { EventItem, Registration } from "@/lib/events.functions";
import { useFmt, useT } from "@/lib/i18n";

/** Check-in / QR is available while the event is live or upcoming. */
function checkinAvailable(event: EventItem): boolean {
  return event.status === "upcoming" || event.status === "ongoing";
}

/**
 * Premium QR / check-in section for the event detail page. Reuses existing
 * check-in (`/checkin`), registrations (`/event-registrations`) and member
 * card (`/m/card`) routes — it never mints QR tokens or performs check-ins
 * itself. Attendee export is a client-only CSV of already-loaded, non-sensitive
 * registration fields (no email/PII).
 */
export function EventCheckinPanel({
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

  const available = checkinAvailable(event);
  const live = event.status === "ongoing";
  const exportable = registrations.filter((r) => r.status !== "cancelled");

  const onExport = () => {
    if (exportable.length === 0) {
      toast.error(t("ecin.exportEmpty"));
      return;
    }
    downloadCsv(`attendees-${event.id}`, exportable, [
      { header: t("ecin.csv.code"), value: (r) => r.id },
      { header: t("ecin.csv.member"), value: (r) => r.memberName || r.memberCode },
      { header: t("ecin.csv.ticket"), value: (r) => r.ticketType },
      { header: t("ecin.csv.regDate"), value: (r) => r.registeredAt },
      { header: t("ecin.csv.status"), value: (r) => r.status },
    ]);
    toast.success(t("ecin.exportDone", { n: exportable.length }));
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
          <QrCode className="h-4 w-4 text-primary" aria-hidden="true" /> {t("ecin.title")}
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            available ? "bg-success/12 text-success" : "bg-secondary text-muted-foreground"
          }`}
        >
          {available ? (
            <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {available
            ? live
              ? t("ecin.state.live")
              : t("ecin.state.ready")
            : t("ecin.state.unavailable")}
        </span>
      </div>

      {/* Wallet-style QR card */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-glow)]"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{ background: "radial-gradient(circle at 88% 10%, white, transparent 55%)" }}
          aria-hidden="true"
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-primary-foreground/80">
              {t("ecin.card.pass")}
            </p>
            <h3 className="mt-1 truncate text-lg font-bold drop-shadow-sm">{event.name}</h3>
            <div className="mt-3 space-y-1.5 text-sm font-medium text-primary-foreground/90">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />{" "}
                {fmt.date(event.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /> {event.location || "—"}
              </span>
            </div>
          </div>
          {/* Static QR glyph — real member QR lives in the digital card */}
          <div
            className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-background/90 text-foreground"
            aria-hidden="true"
          >
            <QrCode className="h-12 w-12" strokeWidth={1.25} aria-hidden="true" />
          </div>
        </div>
        <div className="relative mt-4 flex items-center justify-between border-t border-border/25 pt-3 text-[11px] font-medium text-primary-foreground/85">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> {t("ecin.card.secure")}
          </span>
          <span>{available ? t("ecin.card.validNow") : t("ecin.card.notActive")}</span>
        </div>
      </div>

      {/* Availability messaging */}
      {!available && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-[13px] text-muted-foreground">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("ecin.unavailableHint")}</span>
        </div>
      )}

      {/* Actions */}
      {canManage ? (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("ecin.staff.title")}
          </p>
          <Link
            to="/checkin"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <ScanLine className="h-4 w-4" aria-hidden="true" /> {t("ecin.staff.console")}
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/event-registrations"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{" "}
              {t("edetail.cta.manageReg")}
            </Link>
            <button
              onClick={onExport}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Download className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{" "}
              {t("ecin.staff.export")}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <Link
            to="/m/card"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <QrCode className="h-4 w-4" aria-hidden="true" /> {t("ecin.member.openQr")}
          </Link>
          <Link
            to="/m/checkin"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Smartphone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{" "}
            {t("ecin.member.openCheckin")}
          </Link>
          <p className="pt-1 text-[12px] text-muted-foreground">{t("ecin.member.hint")}</p>
        </div>
      )}
    </section>
  );
}

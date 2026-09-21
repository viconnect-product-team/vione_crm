import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Lock,
  MapPin,
  QrCode,
  Share2,
  Ticket,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { EventItem, Registration } from "@/lib/events.functions";
import { downloadIcs } from "@/lib/ics";
import { useFmt, useT } from "@/lib/i18n";
import { GoogleFormEventRegistrationModal } from "@/components/events/GoogleFormEventRegistrationModal";

type RegAvailability = "open" | "full" | "closed";

function availabilityOf(event: EventItem): RegAvailability {
  if (event.status === "cancelled" || event.status === "completed") return "closed";
  if (event.capacity > 0 && event.registered >= event.capacity) return "full";
  return "open";
}

/**
 * Premium, confidence-building registration panel for the event detail page.
 * Purely presentational — it reflects state derived from already-loaded event
 * and registration data and reuses existing manage/check-in routes. No new
 * backend calls; "Add to calendar" is a client-only ICS download.
 */
export function EventRegistrationPanel({
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
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  const [googleFormOpen, setGoogleFormOpen] = useState(false);

  const availability = availabilityOf(event);
  const pct =
    event.capacity > 0 ? Math.min(100, Math.round((event.registered / event.capacity) * 100)) : 0;
  const spots = Math.max(0, event.capacity - event.registered);
  const confirmed = registrations.filter((r) => r.status === "confirmed").length;
  const waitlist = registrations.filter((r) => r.status === "waitlist").length;

  const tone: Record<
    RegAvailability,
    { bg: string; fg: string; label: string; icon: React.ReactNode }
  > = {
    open: {
      bg: "oklch(0.95 0.05 155)",
      fg: "oklch(0.42 0.15 155)",
      label: t("edetail.avail.open"),
      icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    full: {
      bg: "oklch(0.95 0.05 65)",
      fg: "oklch(0.48 0.16 65)",
      label: t("edetail.avail.full"),
      icon: <Users className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    closed: {
      bg: "oklch(0.94 0.005 260)",
      fg: "oklch(0.50 0.02 260)",
      label: t("edetail.avail.closed"),
      icon: <Lock className="h-3.5 w-3.5" aria-hidden="true" />,
    },
  };
  const av = tone[availability];

  const onAddToCalendar = () => {
    downloadIcs({
      uid: `${event.id}@vba-events`,
      title: event.name,
      start: event.date,
      location: event.location || undefined,
      description: t("edetail.overview.fallback", {
        type: event.type,
        location: event.location || "—",
      }),
    });
    setAddedToCalendar(true);
    toast.success(t("edetail.reg.calendarDone"));
  };

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("edetail.shareCopied"));
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      {/* Header + availability chip */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
          <Ticket className="h-4 w-4 text-primary" aria-hidden="true" /> {t("edetail.reg.title")}
        </h2>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: av.bg, color: av.fg }}
        >
          {av.icon} {av.label}
        </span>
      </div>

      {/* Capacity indicator */}
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t("edetail.reg.filled")}</span>
        <span className="font-semibold text-foreground">
          {event.registered}/{event.capacity} · {pct}%
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: availability === "full" ? "oklch(0.55 0.2 25)" : "var(--gradient-primary)",
          }}
        />
      </div>
      <p className="mt-2 text-[13px] font-medium text-muted-foreground">
        {availability === "closed"
          ? t("edetail.reg.closed")
          : availability === "full"
            ? t("edetail.reg.full")
            : t("edetail.reg.spots", { n: spots })}
      </p>

      {/* Confirmed / waitlist */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-secondary/60 p-3 text-center">
          <p className="text-lg font-bold tabular-nums text-foreground">{confirmed}</p>
          <p className="text-[11px] font-medium text-muted-foreground">
            {t("edetail.attendees.confirmed")}
          </p>
        </div>
        <div className="rounded-xl bg-secondary/60 p-3 text-center">
          <p className="text-lg font-bold tabular-nums text-foreground">{waitlist}</p>
          <p className="text-[11px] font-medium text-muted-foreground">
            {t("edetail.attendees.waitlist")}
          </p>
        </div>
      </div>

      {/* Primary CTA state block */}
      <div className="mt-5 space-y-2.5">
        {availability === "closed" ? (
          <button
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-muted-foreground"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" /> {t("edetail.cta.closed")}
          </button>
        ) : availability === "full" ? (
          <button
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-muted-foreground"
          >
            <Users className="h-4 w-4" aria-hidden="true" /> {t("edetail.cta.full")}
          </button>
        ) : (
          <>
            <button
              onClick={() => setGoogleFormOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, #673ab7 0%, #5e35b1 100%)" }}
            >
              <FileText className="h-4 w-4" /> Đăng Ký Tham Gia (Form Google)
            </button>
            {canManage && (
              <Link
                to="/event-registrations"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                <ClipboardList className="h-4 w-4" /> {t("edetail.cta.manageReg")}
              </Link>
            )}
          </>
        )}
      </div>

      {/* Confirmation-style summary + quick actions */}
      <div className="mt-5 space-y-2 rounded-xl border border-border/70 bg-secondary/30 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("edetail.reg.summaryTitle")}
        </p>
        <div className="flex items-center gap-2 text-sm text-foreground">
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{fmt.date(event.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{event.location || "—"}</span>
        </div>
        {addedToCalendar && (
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t("edetail.reg.calendarDone")}</span>
          </div>
        )}
      </div>

      {/* Secondary actions */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={onAddToCalendar}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          <CalendarPlus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{" "}
          {t("edetail.reg.addCalendar")}
        </button>
        <button
          onClick={onShare}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Share2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{" "}
          {t("edetail.share")}
        </button>
      </div>

      {canManage && (
        <Link
          to="/checkin"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          <QrCode className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{" "}
          {t("edetail.cta.checkin")}
        </Link>
      )}

      {event.status === "upcoming" && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden="true" /> {t("edetail.reg.deadlineHint")}
        </p>
      )}

      <GoogleFormEventRegistrationModal
        event={event}
        isOpen={googleFormOpen}
        onClose={() => setGoogleFormOpen(false)}
      />
    </section>
  );
}

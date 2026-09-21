import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, Check, Clock, MapPin, QrCode, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { listMyEvents, registerForEvent, cancelEventRegistration, type MyEvent } from "@/lib/member-app.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/m/events")({
  component: EventsScreen,
});

function EventsScreen() {
  const t = useT();
  const fetchEvents = useServerFn(listMyEvents);
  const doRegister = useServerFn(registerForEvent);
  const doCancel = useServerFn(cancelEventRegistration);
  const { data: events, loading, reload } = useServerData<MyEvent[]>(() => fetchEvents(), []);
  const [busy, setBusy] = useState<string | null>(null);

  async function register(id: string) {
    setBusy(id);
    try {
      await doRegister({ data: { eventId: id } });
      toast.success(t("m.events.register_success"));
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("m.events.register_error"));
    } finally {
      setBusy(null);
    }
  }

  async function unregister(id: string) {
    setBusy(id);
    try {
      await doCancel({ data: { eventId: id } });
      toast.success("Đã hủy tham gia sự kiện thành công");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể hủy tham gia sự kiện");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="vba-animate">
      <MemberHeader
        title={t("m.events.title")}
        back
        right={
          <Link
            to="/m/checkin"
            aria-label={t("m.events.checkin_label")}
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--vba-gold)] transition hover:bg-card/5"
          >
            <QrCode className="h-5 w-5" />
          </Link>
        }
      />

      <div className="px-4 pt-3">
        <Link to="/m/checkin" className="vba-card flex items-center gap-3 p-3">
          <span className="vba-gold-grad grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#1a1206]">
            <QrCode className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-[var(--vba-text)]">
              {t("m.events.checkin_title")}
            </div>
            <div className="text-[11px] text-[var(--vba-text-muted)]">
              {t("m.events.checkin_desc")}
            </div>
          </div>
        </Link>
      </div>

      {/* List */}
      <p className="sr-only" role="status" aria-live="polite" data-testid="events-announcement">
        {loading
          ? t("m.events.announce.loading")
          : t("m.events.announce.count", { count: events.length })}
      </p>
      <div
        className="mt-4 space-y-3 px-4"
        role="list"
        aria-live="polite"
        aria-busy={loading}
        aria-label={t("m.events.title")}
      >
        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.events.loading")}
          </p>
        )}
        {!loading && events.length === 0 && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.events.empty")}
          </p>
        )}
        {events.map((e: any) => (
          <div key={e.id} role="listitem" className="vba-card flex gap-3 p-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl vba-gold-grad text-[#1a1206]">
              <span className="text-[22px] font-extrabold leading-none">{e.day}</span>
              <span className="text-[10px] font-bold">{e.month}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[13px] font-semibold text-[var(--vba-text)]">
                {e.title}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--vba-text-muted)]">
                <Clock className="h-3.5 w-3.5" /> {e.time}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[var(--vba-text-muted)]">
                <MapPin className="h-3.5 w-3.5" /> {e.place}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {e.registered ? (
                  <>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--vba-gold-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vba-gold)]">
                      <Check className="h-3.5 w-3.5" /> {t("m.events.registered")}
                    </span>
                    <button
                      type="button"
                      onClick={() => unregister(e.id)}
                      disabled={busy === e.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      {busy === e.id ? (
                        <span>Đang hủy...</span>
                      ) : (
                        <>
                          <X className="h-3 w-3" />
                          <span>Hủy tham gia</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => register(e.id)}
                    disabled={busy === e.id}
                    className="rounded-lg vba-gold-grad px-3 py-1.5 text-[11px] font-semibold text-[#1a1206] disabled:opacity-60 cursor-pointer"
                  >
                    {busy === e.id ? t("m.events.registering") : t("m.events.register_btn")}
                  </button>
                )}
              </div>
            </div>
            <Bookmark className="h-5 w-5 shrink-0 text-[var(--vba-text-dim)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

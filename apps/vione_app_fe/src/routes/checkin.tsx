import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, MapPin, Volume2, VolumeX, Smartphone } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Scanner } from "@/components/checkin/Scanner";
import { AttendeePanel } from "@/components/checkin/AttendeePanel";
import { StatsBar } from "@/components/checkin/StatsBar";
import { SearchBox } from "@/components/checkin/SearchBox";
import { RecentList } from "@/components/checkin/RecentList";
import { ModeToggle } from "@/components/checkin/ModeToggle";
import { MobileCheckin } from "@/components/checkin/MobileCheckin";
import { TicketStatus } from "@/components/checkin/TicketStatus";
import { type Attendee, type CheckinResult } from "@/lib/checkin-data";
import { checkinErrorKey, isForbiddenError } from "@/lib/checkin-errors";
import { getCheckinStateFn, checkInFn, undoCheckInFn } from "@/lib/checkin.functions";
import { resolveAttendeeId } from "@/lib/scan";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/checkin")({
  ssr: false,
  loader: () => getCheckinStateFn(),
  component: CheckinPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function CheckinPage() {
  const t = useT();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { attendees, recent, stats, ticketStats } = Route.useLoaderData();
  const doCheckIn = useServerFn(checkInFn);
  const doUndo = useServerFn(undoCheckInFn);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mode, setMode] = useState<"qr" | "nfc">("qr");
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [sound, setSound] = useState(true);
  const [scanIdx, setScanIdx] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-launch fullscreen mobile UI on small viewports
  useEffect(() => {
    if (isMobile) setMobileOpen(true);
  }, [isMobile]);

  // Auto-reset after 3s on result
  useEffect(() => {
    if (result === null) return;
    const id = setTimeout(() => {
      setResult(null);
      setAttendee(null);
    }, 3000);
    return () => clearTimeout(id);
  }, [result]);

  // Polling: refresh attendance every 10 s (replaces Supabase realtime channel)
  useEffect(() => {
    const id = setInterval(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => void router.invalidate(), 400);
    }, 10_000);
    return () => {
      clearInterval(id);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [router]);


  async function performCheckIn(id: string) {
    const res = await doCheckIn({ data: { attendeeId: id } });
    await router.invalidate();
    return res;
  }

  async function pick(a: Attendee) {
    setAttendee(a);
    setResult(null);
    try {
      const res = await performCheckIn(a.id);
      setAttendee(res.attendee);
      setResult(res.result);
    } catch (e) {
      toast.error(t(checkinErrorKey(e)), {
        description: isForbiddenError(e) ? t("checkin.forbiddenHint") : undefined,
      });
      reset();
    }
  }

  function simulateScan() {
    if (attendees.length === 0) return;
    const next = attendees[scanIdx % attendees.length];
    setScanIdx((i) => i + 1);
    void pick(next);
  }

  function handleScan(raw: string) {
    const found = resolveAttendeeId<Attendee>(raw, attendees);
    if (!found) {
      setAttendee(null);
      setResult("invalid");
      toast.error(t("checkin.notFound"));
      return;
    }
    void pick(found);
  }

  function reset() {
    setResult(null);
    setAttendee(null);
  }

  async function handleUndo(id: string) {
    if (!window.confirm(t("checkin.undoConfirm"))) return;
    try {
      await doUndo({ data: { attendeeId: id } });
      await router.invalidate();
      toast.success(t("checkin.undone"));
    } catch (e) {
      toast.error(t(checkinErrorKey(e)), {
        description: isForbiddenError(e) ? t("checkin.forbiddenHint") : undefined,
      });
    }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Event header */}
        <div
          className="overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-elevated)]"
          style={{ background: "var(--gradient-card)" }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
                {t("checkin.title")}
              </div>
              <h1 className="mt-1 truncate text-2xl font-bold lg:text-3xl">
                {t("checkin.eventName")}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-primary-foreground/85">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {t("checkin.date")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {t("checkin.location")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ModeToggle mode={mode} onChange={setMode} />
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-9 items-center gap-1.5 rounded-full border border-border/20 bg-card/10 px-3 text-xs font-semibold text-primary-foreground backdrop-blur transition hover:bg-card/20"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile
              </button>
              <button
                onClick={() => setSound((s) => !s)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/20 bg-card/10 text-primary-foreground backdrop-blur transition hover:bg-card/20"
                aria-label={t("checkin.sound")}
              >
                {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <StatsBar registered={stats.registered} checkedIn={stats.checkedIn} />

        {/* Main two-column area */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
          {/* Left: Scanner */}
          <div className="space-y-4">
            <Scanner mode={mode} onScan={handleScan} onSimulate={simulateScan} />
            <SearchBox attendees={attendees} onPick={pick} />
          </div>

          {/* Right: Result + Recent */}
          <div className="space-y-4">
            <AttendeePanel
              attendee={attendee}
              result={result}
              onConfirm={() => attendee && void pick(attendee)}
              onReset={reset}
            />
            <TicketStatus ticketStats={ticketStats} />
            <RecentList recent={recent} onUndo={handleUndo} />
          </div>
        </div>
      </div>

      {mobileOpen && (
        <MobileCheckin
          onClose={() => setMobileOpen(false)}
          attendees={attendees}
          stats={stats}
          onCheckIn={performCheckIn}
        />
      )}
    </AppShell>
  );
}

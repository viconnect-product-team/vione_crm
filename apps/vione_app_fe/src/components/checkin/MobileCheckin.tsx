import { useEffect, useState } from "react";
import {
  QrCode,
  Wifi,
  Zap,
  ZapOff,
  Search,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Phone,
  ChevronUp,
  X,
} from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";
import { type Attendee, type AttendeeBadge, type CheckinResult } from "@/lib/checkin-data";
import { checkinErrorKey, isForbiddenError } from "@/lib/checkin-errors";
import { resolveAttendeeId } from "@/lib/scan";
import { useQrScanner } from "@/hooks/use-qr-scanner";
import { useNfcScanner } from "@/hooks/use-nfc-scanner";
import { toast } from "sonner";

const badgeStyles: Record<AttendeeBadge, string> = {
  vip: "bg-warning/20 text-warning-foreground border-warning/40",
  speaker: "bg-info/20 text-info border-info/40",
  sponsor: "bg-primary/15 text-primary border-primary/40",
  member: "bg-muted text-muted-foreground border-border",
  guest: "bg-secondary text-secondary-foreground border-border",
};
const badgeKey: Record<AttendeeBadge, TKey> = {
  vip: "checkin.badge.vip",
  speaker: "checkin.badge.speaker",
  sponsor: "checkin.badge.sponsor",
  member: "checkin.badge.member",
  guest: "checkin.badge.guest",
};

const resultMap: Record<
  CheckinResult,
  { key: TKey; bg: string; text: string; ring: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    key: "checkin.success",
    bg: "bg-success/15",
    text: "text-success",
    ring: "ring-success/40",
    Icon: CheckCircle2,
  },
  already: {
    key: "checkin.already",
    bg: "bg-warning/20",
    text: "text-[oklch(0.45_0.16_65)]",
    ring: "ring-warning/40",
    Icon: AlertTriangle,
  },
  invalid: {
    key: "checkin.invalid",
    bg: "bg-destructive/15",
    text: "text-destructive",
    ring: "ring-destructive/40",
    Icon: XCircle,
  },
};

export function MobileCheckin({
  onClose,
  attendees,
  stats,
  onCheckIn,
}: {
  onClose: () => void;
  attendees: Attendee[];
  stats: { registered: number; checkedIn: number };
  onCheckIn: (id: string) => Promise<{ attendee: Attendee; result: CheckinResult }>;
}) {
  const t = useT();
  const [mode, setMode] = useState<"qr" | "nfc">("qr");
  const [flash, setFlash] = useState(false);
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [scanIdx, setScanIdx] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  const rate = stats.registered ? Math.round((stats.checkedIn / stats.registered) * 100) : 0;

  const scanActive = !searchOpen && !attendee;
  const { videoRef, status: qrStatus } = useQrScanner({
    active: scanActive && mode === "qr",
    onDetect: handleScan,
    torch: flash,
  });
  const { status: nfcStatus } = useNfcScanner({
    active: scanActive && mode === "nfc",
    onDetect: handleScan,
  });

  // Auto-reset
  useEffect(() => {
    if (!result) return;
    const id = setTimeout(() => {
      setResult(null);
      setAttendee(null);
    }, 2800);
    return () => clearTimeout(id);
  }, [result]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function pick(a: Attendee) {
    setAttendee(a);
    setResult(null);
    try {
      const res = await onCheckIn(a.id);
      setAttendee(res.attendee);
      setResult(res.result);
    } catch (e) {
      setAttendee(null);
      setResult("invalid");
      toast.error(t(checkinErrorKey(e)), {
        description: isForbiddenError(e) ? t("checkin.forbiddenHint") : undefined,
      });
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

  const searchResults = q.trim()
    ? attendees.filter((a: any) =>
        [a.name, a.company, a.phone].some((f) => f.toLowerCase().includes(q.toLowerCase())),
      )
    : [];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[oklch(0.10_0.04_265)] text-primary-foreground">
      {/* Camera / NFC fullscreen */}
      <div className="relative flex-1 overflow-hidden">
        {mode === "qr" ? (
          <>
            {/* Live camera feed */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                qrStatus === "scanning" ? "opacity-100" : "opacity-0"
              }`}
            />
            {qrStatus !== "scanning" && (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.28_0.08_270)_0%,oklch(0.08_0.03_265)_75%)]" />
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(oklch(0.6_0.15_280)_1px,transparent_1px),linear-gradient(90deg,oklch(0.6_0.15_280)_1px,transparent_1px)",
                    backgroundSize: "28px 28px",
                  }}
                />
              </>
            )}
            {flash && <div className="absolute inset-0 bg-card/15" />}
            {/* Dark overlay with cutout */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-[68vw] max-h-[340px] w-[68vw] max-w-[340px]">
                <span className="absolute -left-1 -top-1 h-10 w-10 rounded-tl-3xl border-l-[3px] border-t-[3px] border-primary-glow" />
                <span className="absolute -right-1 -top-1 h-10 w-10 rounded-tr-3xl border-r-[3px] border-t-[3px] border-primary-glow" />
                <span className="absolute -bottom-1 -left-1 h-10 w-10 rounded-bl-3xl border-b-[3px] border-l-[3px] border-primary-glow" />
                <span className="absolute -bottom-1 -right-1 h-10 w-10 rounded-br-3xl border-b-[3px] border-r-[3px] border-primary-glow" />
                <span className="pointer-events-none absolute inset-x-3 top-3 h-1 animate-[mscan_2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-primary-glow to-transparent shadow-[0_0_18px_oklch(0.62_0.22_285)]" />
                <ScanLine className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 text-primary-foreground/25" />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.32_0.16_285)_0%,oklch(0.08_0.03_265)_75%)]" />
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="absolute h-48 w-48 animate-ping rounded-full border-2 border-primary-glow opacity-50"
                style={{ animationDelay: `${i * 0.5}s`, animationDuration: "2.4s" }}
              />
            ))}
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-[0_0_80px_oklch(0.62_0.22_285_/_0.7)]">
              <Wifi className="h-16 w-16 -rotate-90 text-primary-foreground" />
            </div>
          </div>
        )}

        {/* Top bar overlay */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top,0)+1rem)]">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/40 backdrop-blur-md transition active:scale-95"
            aria-label={t("checkin.mobile.close")}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
              {t("checkin.title")}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-primary-foreground/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              {stats.checkedIn}/{stats.registered} · {rate}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <LangSwitcher variant="overlay" />
            <button
              onClick={() => setFlash((f) => !f)}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition active:scale-95 ${
                flash
                  ? "bg-warning text-[oklch(0.25_0.05_60)]"
                  : "bg-foreground/40 text-primary-foreground"
              }`}
              aria-label={t("checkin.mobile.flash")}
              disabled={mode === "nfc"}
            >
              {flash ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Status hint (tap to run demo when hardware is unavailable) */}
        <button
          onClick={simulateScan}
          role="status"
          aria-live="polite"
          className="absolute inset-x-0 bottom-6 mx-auto flex w-fit items-center gap-2 rounded-full border border-border/20 bg-foreground/40 px-5 py-2.5 text-sm font-medium backdrop-blur-md transition active:scale-95"
        >
          <ScanLine className="h-4 w-4" />
          {mode === "qr"
            ? qrStatus === "scanning"
              ? t("checkin.cam.scanning")
              : qrStatus === "denied"
                ? t("checkin.cam.denied")
                : qrStatus === "unsupported"
                  ? t("checkin.cam.unsupported")
                  : qrStatus === "error"
                    ? t("checkin.cam.error")
                    : t("checkin.cam.starting")
            : nfcStatus === "scanning"
              ? "Sẵn sàng chạm NFC (áp vào giữa lưng máy)"
              : nfcStatus === "denied"
                ? "Quyền NFC bị từ chối"
                : nfcStatus === "insecure"
                  ? "Cần kết nối HTTPS để chạm NFC"
                  : nfcStatus === "unsupported"
                    ? "Web NFC hỗ trợ trên Chrome (Android)"
                    : "Không bật được NFC"}
        </button>

        {/* Result sheet */}
        {attendee && (
          <div className="absolute inset-x-0 bottom-0 animate-in slide-in-from-bottom duration-300">
            <ResultSheet attendee={attendee} result={result} />
          </div>
        )}

        {/* Search sheet */}
        {searchOpen && (
          <div className="absolute inset-0 z-10 flex flex-col bg-background text-foreground animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-2 border-b border-border p-3 pt-[calc(env(safe-area-inset-top,0)+0.75rem)]">
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setQ("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("checkin.search")}
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {searchResults.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                  {t("checkin.searchHint")}
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSearchOpen(false);
                        setQ("");
                        void pick(a);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left active:bg-muted"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-primary-foreground"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        {a.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{a.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {a.company}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/10 bg-[oklch(0.12_0.04_265)] px-4 pb-[calc(env(safe-area-inset-bottom,0)+0.75rem)] pt-3">
        <div className="mb-3 flex justify-center">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-card/10 px-4 py-1.5 text-xs font-medium text-primary-foreground/90 backdrop-blur active:bg-card/15"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            {t("checkin.mobile.manual")}
          </button>
        </div>

        {/* QR/NFC switcher */}
        <div className="relative grid grid-cols-2 rounded-2xl bg-card/10 p-1">
          <span
            className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl shadow-[var(--shadow-glow)] transition-transform duration-300"
            style={{
              background: "var(--gradient-primary)",
              transform: mode === "qr" ? "translateX(0)" : "translateX(calc(100% + 0.5rem))",
            }}
          />
          <button
            onClick={() => setMode("qr")}
            className={`relative z-10 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
              mode === "qr" ? "text-primary-foreground" : "text-primary-foreground/60"
            }`}
          >
            <QrCode className="h-4 w-4" />
            {t("checkin.mode.qr")}
          </button>
          <button
            onClick={() => setMode("nfc")}
            className={`relative z-10 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
              mode === "nfc" ? "text-primary-foreground" : "text-primary-foreground/60"
            }`}
          >
            <Wifi className="h-4 w-4" />
            {t("checkin.mode.nfc")}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes mscan {
          0% { transform: translateY(0); opacity: 0.2; }
          50% { transform: translateY(calc(68vw - 1.5rem)); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.2; }
        }
        @media (min-height: 600px) {
          @keyframes mscan {
            0% { transform: translateY(0); opacity: 0.2; }
            50% { transform: translateY(310px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.2; }
          }
        }
      `}</style>
    </div>
  );
}

function ResultSheet({ attendee, result }: { attendee: Attendee; result: CheckinResult | null }) {
  const t = useT();
  const r = result ? resultMap[result] : null;
  return (
    <div className="rounded-t-3xl bg-card text-foreground shadow-[0_-12px_40px_rgba(0,0,0,0.4)]">
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
      {r && (
        <div className={`${r.bg} mt-3 flex items-center gap-3 px-5 py-3`}>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-card ring-4 ${r.ring}`}
          >
            <r.Icon className={`h-6 w-6 ${r.text}`} />
          </div>
          <div className="min-w-0">
            <div className={`text-base font-bold ${r.text}`}>{t(r.key)}</div>
            <div className="text-[11px] text-muted-foreground">{attendee.id}</div>
          </div>
        </div>
      )}
      <div className="px-5 pb-[calc(env(safe-area-inset-bottom,0)+1rem)] pt-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            {attendee.initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold">{attendee.name}</h3>
            <p className="truncate text-xs text-muted-foreground">{attendee.title}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {attendee.badges.map((b) => (
                <span
                  key={b}
                  className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badgeStyles[b]}`}
                >
                  {t(badgeKey[b])}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-1.5 rounded-xl bg-muted/50 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{attendee.company}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{attendee.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

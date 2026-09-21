import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Phone,
  IdCard,
  Loader2,
} from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import type { Attendee, AttendeeBadge, CheckinResult } from "@/lib/checkin-data";

const badgeStyles: Record<AttendeeBadge, string> = {
  vip: "bg-warning/15 text-warning-foreground border-warning/40",
  speaker: "bg-info/15 text-info border-info/40",
  sponsor: "bg-primary/10 text-primary border-primary/30",
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
    ring: "ring-success/30",
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
    ring: "ring-destructive/30",
    Icon: XCircle,
  },
};

type Props = {
  attendee: Attendee | null;
  result: CheckinResult | null;
  onConfirm?: () => void;
  onReset?: () => void;
};

export function AttendeePanel({ attendee, result, onConfirm, onReset }: Props) {
  const t = useT();

  if (!attendee) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-muted-foreground/40" />
        <h3 className="text-base font-semibold text-foreground">{t("checkin.waiting")}</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t("checkin.noAttendee")}</p>
      </div>
    );
  }

  const r = result ? resultMap[result] : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)] animate-in fade-in zoom-in-95 duration-200">
      {/* Status banner */}
      {r && (
        <div className={`${r.bg} border-b border-border px-5 py-4`}>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-card ring-4 ${r.ring}`}
            >
              <r.Icon className={`h-7 w-7 ${r.text}`} />
            </div>
            <div>
              <div className={`text-lg font-bold ${r.text}`}>{t(r.key)}</div>
              <div className="text-xs text-muted-foreground">
                {attendee.id} ·{" "}
                {new Date().toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            {attendee.initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-foreground">{attendee.name}</h3>
            <p className="truncate text-sm text-muted-foreground">{attendee.title}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {attendee.badges.map((b) => (
                <span
                  key={b}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeStyles[b]}`}
                >
                  {t(badgeKey[b])}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3 rounded-xl bg-muted/40 p-4 text-sm">
          <Row icon={Building2} label={attendee.company} />
          <Row icon={Phone} label={attendee.phone} />
          <Row icon={IdCard} label={`${t(attendee.membership)} · ${attendee.id}`} />
        </div>

        {(attendee.badges.includes("sponsor") || attendee.sponsorType) && (
          <div className="mt-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                <span>🤝 ĐẠI DIỆN NHÀ TÀI TRỢ</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                attendee.sponsorType === "regular"
                  ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30"
                  : "bg-sky-500/20 text-sky-800 dark:text-sky-200 border border-sky-500/30"
              }`}>
                {attendee.sponsorType === "regular" ? "★ Thường Xuyên Ổn Định" : "✦ Nhà Tài Trợ Mới"}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Hình thức gói:</span>
              <span className="font-bold text-foreground">
                {attendee.packageType === "in_kind" ? "🎁 Tài trợ Hiện vật" : "💵 Tài trợ Bằng Tiền"}
              </span>
            </div>
            {attendee.inKindDescription && (
              <div className="mt-1 text-[11px] italic text-purple-900 dark:text-purple-200 bg-purple-500/15 p-1.5 rounded-md">
                "{attendee.inKindDescription}"
              </div>
            )}
          </div>
        )}

        {attendee.seatAssignment ? (
          <div className="mt-3 rounded-xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <span>👑 VỊ TRÍ CHỖ NGỒI VIP / BÀN TIỆC</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                ĐÃ ĐIỀU PHỐI
              </span>
            </div>
            <div className="mt-1 text-base sm:text-lg font-black text-amber-900 dark:text-amber-200 font-sans tracking-tight">
              📍 {attendee.seatAssignment}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-border bg-muted/30 p-2.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Vị trí chỗ ngồi:</span>
            <span className="font-semibold text-foreground">Khu vực tự do</span>
          </div>
        )}

        {result === null && (
          <button
            onClick={onConfirm}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-95"
            style={{ background: "var(--gradient-primary)" }}
          >
            <CheckCircle2 className="h-4 w-4" />
            {t("checkin.checkInBtn")}
          </button>
        )}
        {result !== null && (
          <button
            onClick={onReset}
            className="mt-5 w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            {t("checkin.reset")}
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label }: { icon: typeof Building2; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate text-foreground">{label}</span>
    </div>
  );
}

import { Building2, CalendarCheck, DollarSign, FileText, Handshake } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";

const items: { icon: LucideIcon; tone: string; bg: string; text: TKey; time: TKey }[] = [
  {
    icon: Building2,
    tone: "oklch(0.50 0.22 280)",
    bg: "oklch(0.94 0.06 285)",
    text: "act.newMember",
    time: "act.time.10m",
  },
  {
    icon: CalendarCheck,
    tone: "oklch(0.52 0.18 240)",
    bg: "oklch(0.93 0.05 240)",
    text: "act.eventJoin",
    time: "act.time.1h",
  },
  {
    icon: DollarSign,
    tone: "oklch(0.58 0.16 65)",
    bg: "oklch(0.94 0.09 75)",
    text: "act.payment",
    time: "act.time.2h",
  },
  {
    icon: Handshake,
    tone: "oklch(0.52 0.16 155)",
    bg: "oklch(0.93 0.07 155)",
    text: "act.sponsor",
    time: "act.time.3h",
  },
  {
    icon: FileText,
    tone: "oklch(0.60 0.20 10)",
    bg: "oklch(0.93 0.06 10)",
    text: "act.docs",
    time: "act.time.5h",
  },
];

export function RecentActivity() {
  const t = useT();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{t("act.title")}</h3>
        <button className="text-xs font-semibold text-primary hover:text-primary-glow">
          {t("act.viewAll")}
        </button>
      </div>
      <div className="space-y-3.5">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: it.bg, color: it.tone }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] leading-snug text-foreground">{t(it.text)}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{t(it.time)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

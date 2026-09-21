import { Users, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useT } from "@/lib/i18n";

export function StatsBar({ registered, checkedIn }: { registered: number; checkedIn: number }) {
  const t = useT();
  const remaining = registered - checkedIn;
  const rate = Math.round((checkedIn / registered) * 100);

  const items = [
    {
      Icon: Users,
      label: t("checkin.stats.registered"),
      value: registered.toLocaleString("vi-VN"),
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      Icon: CheckCircle2,
      label: t("checkin.stats.checkedin"),
      value: checkedIn.toLocaleString("vi-VN"),
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      Icon: Clock,
      label: t("checkin.stats.remaining"),
      value: remaining.toLocaleString("vi-VN"),
      color: "text-[oklch(0.55_0.16_65)]",
      bg: "bg-warning/15",
    },
    {
      Icon: TrendingUp,
      label: t("checkin.stats.rate"),
      value: `${rate}%`,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${it.bg}`}>
              <it.Icon className={`h-5 w-5 ${it.color}`} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-muted-foreground">{it.label}</div>
              <div className="text-lg font-bold text-foreground">{it.value}</div>
            </div>
          </div>
          {it.label === t("checkin.stats.rate") && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${rate}%`, background: "var(--gradient-primary)" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

import { CheckCircle2, AlertTriangle, XCircle, Undo2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { RecentEntry } from "@/lib/checkin-data";

const icons = {
  success: { Icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  already: { Icon: AlertTriangle, color: "text-[oklch(0.55_0.16_65)]", bg: "bg-warning/15" },
  invalid: { Icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export function RecentList({
  recent,
  onUndo,
}: {
  recent: RecentEntry[];
  onUndo?: (attendeeId: string) => void;
}) {
  const t = useT();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{t("checkin.recent")}</h3>
      </div>
      <ul className="divide-y divide-border">
        {recent.map((e, i) => {
          const c = icons[e.result];
          return (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                {e.attendee.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {e.attendee.name}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {e.attendee.company}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${c.bg}`}>
                  <c.Icon className={`h-3.5 w-3.5 ${c.color}`} />
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground">{e.time}</span>
              </div>
              {onUndo && e.attendee.checkedIn && (
                <button
                  onClick={() => onUndo(e.attendee.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-destructive/30 bg-background text-destructive transition hover:bg-destructive/10"
                  aria-label={t("checkin.undo")}
                  title={t("checkin.undo")}
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

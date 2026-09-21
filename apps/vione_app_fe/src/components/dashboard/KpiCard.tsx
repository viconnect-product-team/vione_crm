import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "indigo" | "blue" | "green" | "amber" | "pink";

const toneStyles: Record<Tone, { bg: string; fg: string }> = {
  indigo: { bg: "oklch(0.94 0.06 285)", fg: "oklch(0.50 0.22 280)" },
  blue: { bg: "oklch(0.93 0.05 240)", fg: "oklch(0.52 0.18 240)" },
  green: { bg: "oklch(0.93 0.07 155)", fg: "oklch(0.52 0.16 155)" },
  amber: { bg: "oklch(0.94 0.09 75)", fg: "oklch(0.58 0.16 65)" },
  pink: { bg: "oklch(0.93 0.06 10)", fg: "oklch(0.60 0.20 10)" },
};

export function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  deltaLabel: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  const s = toneStyles[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: s.bg, color: s.fg }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="mb-0.5 text-[13px] font-medium text-muted-foreground">{label}</div>
          <div className="text-[26px] font-bold leading-tight tracking-tight text-foreground">
            {value}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-[11.5px]">
        <span className="inline-flex items-center gap-0.5 font-semibold text-success">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {delta}
        </span>
        <span className="text-muted-foreground">{deltaLabel}</span>
      </div>
    </div>
  );
}

export function MiniKpiCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  deltaLabel: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  const s = toneStyles[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="mb-1 text-[12px] font-medium text-muted-foreground">{label}</div>
          <div className="text-[22px] font-bold leading-tight text-foreground">{value}</div>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: s.bg, color: s.fg }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px]">
        <span className="inline-flex items-center gap-0.5 font-semibold text-success">
          <ArrowUpRight className="h-3 w-3" />
          {delta}
        </span>
        <span className="text-muted-foreground">{deltaLabel}</span>
      </div>
    </div>
  );
}

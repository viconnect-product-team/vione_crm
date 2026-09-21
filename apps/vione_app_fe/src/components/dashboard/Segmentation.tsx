import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useT } from "@/lib/i18n";

export function Segmentation() {
  const t = useT();
  const data = [
    { key: "seg.large", value: 349, pct: 28, color: "oklch(0.55 0.20 270)" },
    { key: "seg.medium", value: 399, pct: 32, color: "oklch(0.65 0.16 155)" },
    { key: "seg.small", value: 312, pct: 25, color: "oklch(0.74 0.16 65)" },
    { key: "seg.individual", value: 188, pct: 15, color: "oklch(0.65 0.18 340)" },
  ] as const;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-base font-semibold text-foreground">{t("seg.title")}</h3>
      <div className="flex items-center gap-4">
        <div className="relative h-[170px] w-[170px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[...data]}
                dataKey="value"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-foreground">1,248</div>
            <div className="text-[11px] text-muted-foreground">{t("seg.total")}</div>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {data.map((d) => (
            <div key={d.key} className="flex items-start gap-2.5 text-xs">
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color }}
              />
              <div className="min-w-0">
                <div className="font-semibold text-foreground">{t(d.key)}</div>
                <div className="text-muted-foreground">
                  {d.pct}% ({d.value})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useT } from "@/lib/i18n";

const data = [
  { m: "12/2023", new: 480, churn: 110 },
  { m: "01/2024", new: 720, churn: 130 },
  { m: "02/2024", new: 760, churn: 140 },
  { m: "03/2024", new: 980, churn: 150 },
  { m: "04/2024", new: 1080, churn: 160 },
  { m: "05/2024", new: 1240, churn: 170 },
];

export function GrowthChart() {
  const t = useT();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{t("chart.growth.title")}</h3>
        <button className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
          {t("chart.range.6m")}
        </button>
      </div>
      <div className="mb-3 flex items-center gap-5 text-xs">
        <span className="flex items-center gap-2 text-muted-foreground">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--color-chart-1)" }}
          />
          {t("chart.legend.new")}
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--color-chart-2)" }}
          />
          {t("chart.legend.churn")}
        </span>
      </div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="m"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
                boxShadow: "var(--shadow-elevated)",
              }}
            />
            <Line
              type="monotone"
              dataKey="new"
              stroke="var(--color-chart-1)"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "var(--color-chart-1)", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="churn"
              stroke="var(--color-chart-2)"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "var(--color-chart-2)", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

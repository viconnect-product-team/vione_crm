import { useT } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n";

const rows: { key: TKey; pct: number }[] = [
  { key: "ind.trade", pct: 28 },
  { key: "ind.it", pct: 20 },
  { key: "ind.manufacturing", pct: 18 },
  { key: "ind.realestate", pct: 16 },
  { key: "ind.finance", pct: 10 },
];

export function TopIndustries() {
  const t = useT();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-base font-semibold text-foreground">{t("industries.title")}</h3>
      <div className="space-y-3.5">
        {rows.map((r: any) => (
          <div key={r.key}>
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <span className="text-foreground">{t(r.key)}</span>
              <span className="font-semibold text-muted-foreground">{r.pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full"
                style={{ width: `${r.pct * 2.8}%`, background: "var(--gradient-primary)" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

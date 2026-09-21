import type { ReactNode } from "react";
import { SortHeader } from "@/components/dashboard/DataTablePagination";
import type { SortDir } from "@/hooks/use-table-controls";

export type TableColumn = string | { label: string; key?: string; align?: "left" | "right" };

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-[26px] font-bold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  icon?: ReactNode;
}) {
  const bg: Record<string, string> = {
    primary: "var(--gradient-primary)",
    success: "linear-gradient(135deg, oklch(0.65 0.15 155), oklch(0.78 0.14 155))",
    warning: "linear-gradient(135deg, oklch(0.70 0.16 75), oklch(0.82 0.13 75))",
    danger: "linear-gradient(135deg, oklch(0.62 0.20 25), oklch(0.74 0.17 25))",
    info: "linear-gradient(135deg, oklch(0.65 0.15 220), oklch(0.78 0.13 220))",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground"
            style={{ background: bg[tone] }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Pill({
  children,
  color,
  tone,
}: {
  children: ReactNode;
  color?: "neutral" | "success" | "warning" | "danger" | "info" | "primary";
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "primary" | "warn";
}) {
  const effectiveTone = tone === "warn" ? "warning" : (tone || color || "neutral");
  const styles: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: "oklch(0.94 0.01 250)", fg: "oklch(0.40 0.02 250)" },
    success: { bg: "oklch(0.93 0.07 155)", fg: "oklch(0.40 0.16 155)" },
    warning: { bg: "oklch(0.94 0.09 75)", fg: "oklch(0.45 0.14 65)" },
    danger: { bg: "oklch(0.93 0.06 25)", fg: "oklch(0.50 0.20 25)" },
    info: { bg: "oklch(0.94 0.05 220)", fg: "oklch(0.42 0.15 220)" },
    primary: { bg: "oklch(0.94 0.06 265)", fg: "oklch(0.40 0.18 265)" },
  };
  const s = styles[effectiveTone] || styles.neutral;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
      {children}
    </span>
  );
}

export function TableShell({
  columns,
  children,
  sort,
  footer,
}: {
  columns?: TableColumn[];
  children: ReactNode;
  sort?: { sortKey: string | null; sortDir: SortDir; onSort: (key: string) => void };
  footer?: ReactNode;
}) {
  const hasColumns = Array.isArray(columns) && columns.length > 0;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        {hasColumns ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {(columns || []).map((c, i) => {
                  const col = typeof c === "string" ? { label: c } : c;
                  if (sort && col.key) {
                    return (
                      <SortHeader
                        key={col.key}
                        label={col.label}
                        columnKey={col.key}
                        sortKey={sort.sortKey}
                        sortDir={sort.sortDir}
                        onSort={sort.onSort}
                        align={col.align}
                      />
                    );
                  }
                  return (
                    <th
                      key={col.label + i}
                      className={`px-4 py-3 ${col.align === "right" ? "text-right" : ""}`}
                    >
                      {col.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        ) : (
          children
        )}
      </div>
      {footer}
    </Card>
  );
}

export function fmtVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtDate(iso: string) {
  if (iso === "—") return "—";
  return new Date(iso).toLocaleDateString("vi-VN");
}
